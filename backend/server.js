require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const auth = require('./middleware/auth');
const { globalRateLimiter, authRateLimiter } = require('./middleware/rateLimiter');
const pool = require('./db');

const app = express();

// Security middleware
app.use(helmet());

// CORS allowlist via env (ALLOWED_ORIGINS=comma,separated). Falls back to single CLIENT_URL.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [process.env.CLIENT_URL || 'http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter on all /api routes
app.use('/api', globalRateLimiter);

// Create required tables at startup
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        student_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dojo_id INTEGER DEFAULT 1
    `);
    // Multi-tenant: ensure dojo_id on the most-used tables
    await pool.query(`ALTER TABLE classes ADD COLUMN IF NOT EXISTS dojo_id INTEGER DEFAULT 1`).catch(() => {});
    await pool.query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS dojo_id INTEGER DEFAULT 1`).catch(() => {});
    await pool.query(`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS dojo_id INTEGER DEFAULT 1`).catch(() => {});
    await pool.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS dojo_id INTEGER DEFAULT 1`).catch(() => {});

    // Reminders/notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        student_id INTEGER,
        message TEXT,
        severity VARCHAR(20) DEFAULT 'info',
        acknowledged BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Curriculum coverage: techniques taxonomy + class_techniques link
    await pool.query(`
      CREATE TABLE IF NOT EXISTS techniques (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        style VARCHAR(80),
        required_for_belt VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_techniques (
        id SERIAL PRIMARY KEY,
        class_id INTEGER,
        technique_id INTEGER,
        UNIQUE (class_id, technique_id)
      )
    `);

    // Sparring matchups (pre-computed pairings)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sparring_matchups (
        id SERIAL PRIMARY KEY,
        student_a_id INTEGER,
        student_b_id INTEGER,
        compatibility_score INT,
        rationale TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('DB init error (non-fatal):', err.message);
  }
}
initDb();

// Public routes (with auth rate limit)
app.use('/api/auth', authRateLimiter, require('./routes/auth'));

// Protected domain routes (auth enforced)
app.use('/api/students', auth, require('./routes/students'));
app.use('/api/belt-progression', auth, require('./routes/belt-progression'));
app.use('/api/testing', auth, require('./routes/testing'));
app.use('/api/classes', auth, require('./routes/classes'));
app.use('/api/instructors', auth, require('./routes/instructors'));
app.use('/api/memberships', auth, require('./routes/memberships'));
app.use('/api/attendance', auth, require('./routes/attendance'));
app.use('/api/tournaments', auth, require('./routes/tournaments'));
app.use('/api/private-lessons', auth, require('./routes/private-lessons'));
app.use('/api/equipment', auth, require('./routes/equipment'));
app.use('/api/billing', auth, require('./routes/billing'));
app.use('/api/waivers', auth, require('./routes/waivers'));
app.use('/api/contracts', auth, require('./routes/contracts'));
app.use('/api/video-library', auth, require('./routes/video-library'));
app.use('/api/instructor-certs', auth, require('./routes/instructor-certs'));
app.use('/api/ai', auth, require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Notifications (paginated)
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query('SELECT * FROM notifications WHERE acknowledged = false ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*)::int AS cnt FROM notifications WHERE acknowledged = false'),
    ]);
    res.json({ data: rows.rows, pagination: { page, limit, total: count.rows[0].cnt, totalPages: Math.ceil(count.rows[0].cnt / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notifications/:id/acknowledge', auth, async (req, res) => {
  try { await pool.query('UPDATE notifications SET acknowledged = true WHERE id = $1', [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Background scan: drop-out risk + membership-renewal reminders
async function runBackgroundScan() {
  try {
    // Find students whose recent attendance dropped vs their personal baseline
    const dropoutQuery = `
      WITH base AS (
        SELECT a.student_id,
               COUNT(*) FILTER (WHERE a.date >= CURRENT_DATE - INTERVAL '30 days' AND a.status='present') AS last_30,
               COUNT(*) FILTER (WHERE a.date >= CURRENT_DATE - INTERVAL '120 days' AND a.date < CURRENT_DATE - INTERVAL '30 days' AND a.status='present') AS prior_90
        FROM attendance a
        GROUP BY a.student_id
      )
      SELECT b.student_id, b.last_30, b.prior_90, s.first_name, s.last_name
      FROM base b
      JOIN students s ON s.id = b.student_id
      WHERE s.active = true
        AND b.prior_90 > 6
        AND b.last_30 <= (b.prior_90 / 3.0) * 0.4   -- 60% drop vs prior 3-month avg
      LIMIT 100`;
    const dropouts = await pool.query(dropoutQuery).catch(() => ({ rows: [] }));
    for (const r of dropouts.rows) {
      await pool.query(
        `INSERT INTO notifications (type, student_id, message, severity, metadata)
         SELECT 'dropout_risk', $1, $2, 'high', $3
         WHERE NOT EXISTS (
           SELECT 1 FROM notifications WHERE type='dropout_risk' AND student_id=$1 AND acknowledged=false
         )`,
        [r.student_id, `Drop-out risk: ${r.first_name} ${r.last_name} attended ${r.last_30} classes in last 30d (vs ${r.prior_90} in prior 90d)`,
          JSON.stringify({ last_30: r.last_30, prior_90: r.prior_90 })]
      ).catch(() => {});
    }

    // Membership renewals expiring within 30 days
    const memQuery = `
      SELECT m.id, m.student_id, m.end_date, s.first_name, s.last_name
      FROM memberships m
      LEFT JOIN students s ON s.id = m.student_id
      WHERE m.end_date IS NOT NULL
        AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      LIMIT 100`;
    const renewals = await pool.query(memQuery).catch(() => ({ rows: [] }));
    for (const r of renewals.rows) {
      await pool.query(
        `INSERT INTO notifications (type, student_id, message, severity, metadata)
         SELECT 'membership_renewal', $1, $2, 'medium', $3
         WHERE NOT EXISTS (
           SELECT 1 FROM notifications WHERE type='membership_renewal' AND student_id=$1 AND acknowledged=false
         )`,
        [r.student_id, `Membership renewal due: ${r.first_name} ${r.last_name} expires ${r.end_date}`,
          JSON.stringify({ membership_id: r.id, end_date: r.end_date })]
      ).catch(() => {});
    }

    console.log(`[scheduler] dropout=${dropouts.rows.length}, renewals=${renewals.rows.length}`);
  } catch (err) { console.error('[scheduler] error:', err.message); }
}

// Daily at 6:00am
cron.schedule('0 6 * * *', runBackgroundScan);
// Run once 10s after boot
setTimeout(runBackgroundScan, 10000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/belt-advisor-agent', require('./routes/belt-advisor-agent'));
app.use('/api/vision-technique-eval', require('./routes/vision-technique-eval'));
app.use('/api/tournament-organizer', require('./routes/tournament-organizer'));
app.use('/api/engagement-stream', require('./routes/engagement-stream'));
app.use('/api/athlete-pipeline', require('./routes/athlete-pipeline'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_student_performance_analytics = require('./routes/gap-student-performance-analytics'); app.use('/api/gap-student-performance-analytics', _gap_student_performance_analytics); } catch(e) { console.error('gap mount fail student-performance-analytics:', e.message); }
try { const _gap_class_optimization = require('./routes/gap-class-optimization'); app.use('/api/gap-class-optimization', _gap_class_optimization); } catch(e) { console.error('gap mount fail class-optimization:', e.message); }
try { const _gap_equipment_demand_forecast = require('./routes/gap-equipment-demand-forecast'); app.use('/api/gap-equipment-demand-forecast', _gap_equipment_demand_forecast); } catch(e) { console.error('gap mount fail equipment-demand-forecast:', e.message); }
try { const _gap_instructor_workload_balancer = require('./routes/gap-instructor-workload-balancer'); app.use('/api/gap-instructor-workload-balancer', _gap_instructor_workload_balancer); } catch(e) { console.error('gap mount fail instructor-workload-balancer:', e.message); }
try { const _gap_substantive = require('./routes/gap-substantive'); app.use('/api/gap-substantive', _gap_substantive); } catch(e) { console.error('gap mount fail substantive:', e.message); }
try { const _gap_parent = require('./routes/gap-parent'); app.use('/api/gap-parent', _gap_parent); } catch(e) { console.error('gap mount fail parent:', e.message); }
try { const _gap_mobile = require('./routes/gap-mobile'); app.use('/api/gap-mobile', _gap_mobile); } catch(e) { console.error('gap mount fail mobile:', e.message); }
try { const _gap_video = require('./routes/gap-video'); app.use('/api/gap-video', _gap_video); } catch(e) { console.error('gap mount fail video:', e.message); }
try { const _gap_instructor = require('./routes/gap-instructor'); app.use('/api/gap-instructor', _gap_instructor); } catch(e) { console.error('gap mount fail instructor:', e.message); }
try { const _gap_payment = require('./routes/gap-payment'); app.use('/api/gap-payment', _gap_payment); } catch(e) { console.error('gap mount fail payment:', e.message); }
try { const _gap_social = require('./routes/gap-social'); app.use('/api/gap-social', _gap_social); } catch(e) { console.error('gap mount fail social:', e.message); }
try { const _gap_webhooks = require('./routes/gap-webhooks'); app.use('/api/gap-webhooks', _gap_webhooks); } catch(e) { console.error('gap mount fail webhooks:', e.message); }
// === End Batch 05 Mounts ===
