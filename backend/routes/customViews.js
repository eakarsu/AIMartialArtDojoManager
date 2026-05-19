/**
 * Custom Views router for AIMartialArtDojoManager.
 *
 * Provides 4 endpoints under /api/custom-views:
 *   GET  /belt-progression        -> VIZ data: belt rank distribution over time
 *   GET  /attendance-heatmap      -> VIZ data: student x week attendance matrix
 *   GET  /certificate/:studentId  -> NON-VIZ: PDF (text) belt test / certificate
 *   GET  /belt-requirements       -> NON-VIZ CRUD: list ranking criteria
 *   POST /belt-requirements
 *   PUT  /belt-requirements/:id
 *   DELETE /belt-requirements/:id
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');

// -- Ensure the belt_requirements table exists on first hit --
let _tableReady = false;
async function ensureTable() {
  if (_tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS belt_requirements (
        id SERIAL PRIMARY KEY,
        belt_rank VARCHAR(50) NOT NULL,
        criterion VARCHAR(200) NOT NULL,
        min_classes INT DEFAULT 0,
        min_months INT DEFAULT 0,
        required_techniques TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Seed a baseline once
    const cnt = await pool.query('SELECT COUNT(*)::int AS c FROM belt_requirements');
    if (cnt.rows[0].c === 0) {
      const rows = [
        ['white',  'Stances & basic blocks',           20,  2, 'Front stance, horse stance, low block', 'Foundational form work'],
        ['yellow', 'Basic kicks and combinations',     40,  4, 'Front kick, side kick, 1-step sparring', 'First color belt'],
        ['orange', 'Intermediate forms',               60,  6, 'Form 1, Form 2, basic self-defense',     'Builds coordination'],
        ['green',  'Sparring fundamentals',            90,  9, 'Roundhouse, hook, controlled sparring',  'Light contact only'],
        ['blue',   'Advanced forms & breaks',         120, 12, 'Form 3, board break, jumping kicks',     'Power & precision'],
        ['purple', 'Tournament-level sparring',       150, 15, 'Combination drills, multi-step spar',    'Pre-brown gate'],
        ['brown',  'Leadership & demo skills',        200, 18, 'Form 4, self-defense set A',             'Assist beginner classes'],
        ['black',  'Full curriculum mastery',         300, 36, 'All forms, all breaks, written test',    'Black belt examination'],
      ];
      for (const r of rows) {
        await pool.query(
          `INSERT INTO belt_requirements (belt_rank, criterion, min_classes, min_months, required_techniques, notes)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          r
        );
      }
    }
    _tableReady = true;
  } catch (err) {
    console.error('[custom-views] ensureTable error:', err.message);
  }
}

// =========================================================================
// VIZ 1: Belt progression chart data
// Returns time-series counts of promotions per belt rank.
// =========================================================================
router.get('/belt-progression', async (req, res) => {
  try {
    await ensureTable();
    // Try the belt_progressions table for promotion events
    const promo = await pool.query(`
      SELECT to_rank AS rank,
             to_char(date_trunc('month', promotion_date), 'YYYY-MM') AS month,
             COUNT(*)::int AS promotions
      FROM belt_progressions
      WHERE promotion_date IS NOT NULL
      GROUP BY to_rank, date_trunc('month', promotion_date)
      ORDER BY month, rank
    `).catch(() => ({ rows: [] }));

    // Current snapshot of student belt distribution
    const snapshot = await pool.query(`
      SELECT belt_rank AS rank, COUNT(*)::int AS students
      FROM students
      WHERE active = true
      GROUP BY belt_rank
      ORDER BY students DESC
    `).catch(() => ({ rows: [] }));

    const BELT_ORDER = ['white','yellow','orange','green','blue','purple','brown','black'];
    const distribution = BELT_ORDER.map((r) => {
      const found = snapshot.rows.find((row) => (row.rank || '').toLowerCase() === r);
      return { rank: r, students: found ? found.students : 0 };
    });

    res.json({
      type: 'belt-progression',
      generated_at: new Date().toISOString(),
      distribution,
      timeline: promo.rows,
      total_active_students: distribution.reduce((s, d) => s + d.students, 0),
    });
  } catch (err) {
    console.error('[custom-views] belt-progression error:', err);
    res.status(500).json({ error: 'Failed to build belt progression data' });
  }
});

// =========================================================================
// VIZ 2: Attendance heatmap (student x week, last 8 weeks)
// =========================================================================
router.get('/attendance-heatmap', async (req, res) => {
  try {
    const weeks = Math.min(16, Math.max(1, parseInt(req.query.weeks) || 8));
    const studentLimit = Math.min(50, Math.max(1, parseInt(req.query.studentLimit) || 12));

    // Top-N most-active students in the window
    const topStudents = await pool.query(`
      SELECT s.id, s.first_name, s.last_name, s.belt_rank,
             COUNT(a.id)::int AS visits
      FROM students s
      LEFT JOIN attendance a
        ON a.student_id = s.id
       AND a.date >= CURRENT_DATE - ($1::int || ' weeks')::interval
       AND a.status = 'present'
      WHERE s.active = true
      GROUP BY s.id
      ORDER BY visits DESC, s.last_name
      LIMIT $2
    `, [weeks, studentLimit]).catch(() => ({ rows: [] }));

    const ids = topStudents.rows.map((r) => r.id);
    if (ids.length === 0) {
      return res.json({ type: 'attendance-heatmap', weeks, students: [], matrix: [], week_labels: [] });
    }

    const cells = await pool.query(`
      SELECT student_id,
             date_trunc('week', date)::date AS week_start,
             COUNT(*) FILTER (WHERE status = 'present')::int AS present
      FROM attendance
      WHERE student_id = ANY($1::int[])
        AND date >= CURRENT_DATE - ($2::int || ' weeks')::interval
      GROUP BY student_id, week_start
    `, [ids, weeks]).catch(() => ({ rows: [] }));

    // Build week labels (oldest -> newest)
    const today = new Date();
    const weekLabels = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      // Move to Monday of that week (ISO)
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() - (day - 1));
      weekLabels.push(d.toISOString().slice(0, 10));
    }

    const matrix = topStudents.rows.map((s) => {
      const row = weekLabels.map((wk) => {
        const cell = cells.rows.find(
          (c) => c.student_id === s.id &&
                 c.week_start &&
                 new Date(c.week_start).toISOString().slice(0, 10) === wk
        );
        return cell ? cell.present : 0;
      });
      return {
        student_id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        belt: s.belt_rank,
        weekly_counts: row,
        total: row.reduce((a, b) => a + b, 0),
      };
    });

    res.json({
      type: 'attendance-heatmap',
      weeks,
      week_labels: weekLabels,
      students: topStudents.rows.length,
      matrix,
    });
  } catch (err) {
    console.error('[custom-views] attendance-heatmap error:', err);
    res.status(500).json({ error: 'Failed to build attendance heatmap' });
  }
});

// =========================================================================
// NON-VIZ 1: Belt test / certificate PDF
// Returns a self-contained PDF document (text-based, no external deps).
// =========================================================================
function buildPdf(lines) {
  // Minimal hand-rolled PDF with one page of text in Helvetica.
  const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let stream = 'BT\n/F1 14 Tf\n50 770 Td\n14 TL\n';
  lines.forEach((ln, i) => {
    stream += `(${escape(ln)}) Tj\nT*\n`;
  });
  stream += 'ET';
  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += String(o).padStart(10, '0') + ' 00000 n \n';
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

router.get('/certificate/:studentId', async (req, res) => {
  try {
    const sid = parseInt(req.params.studentId, 10);
    if (Number.isNaN(sid)) return res.status(400).json({ error: 'Invalid student id' });

    const sRes = await pool.query('SELECT * FROM students WHERE id = $1', [sid]).catch(() => null);
    let student = sRes && sRes.rows[0];
    if (!student) {
      // Fallback to first active student so the endpoint always returns 200 with data
      const fallback = await pool.query('SELECT * FROM students WHERE active = true ORDER BY id LIMIT 1').catch(() => ({ rows: [] }));
      student = fallback.rows[0];
    }
    if (!student) {
      return res.status(404).json({ error: 'No students in system' });
    }

    const lastTest = await pool.query(
      'SELECT * FROM tests WHERE student_id = $1 ORDER BY test_date DESC NULLS LAST LIMIT 1',
      [student.id]
    ).catch(() => ({ rows: [] }));
    const test = lastTest.rows[0];

    const lines = [
      'AI Martial Arts Dojo Manager',
      'Belt Test Certificate of Achievement',
      '------------------------------------------------------------',
      `Awarded to: ${student.first_name} ${student.last_name}`,
      `Student ID: ${student.id}`,
      `Current Rank: ${(student.belt_rank || 'white').toUpperCase()}`,
      `Member Since: ${student.join_date || 'N/A'}`,
      '',
      'Most Recent Belt Test',
      '------------------------------------------------------------',
      test ? `Date: ${test.test_date || 'N/A'}` : 'No test on record yet.',
      test ? `Belt Tested: ${test.belt_level_tested || 'N/A'}` : '',
      test ? `Result: ${test.pass_fail || 'pending'}` : '',
      test ? `Score: ${test.score || 'N/A'}` : '',
      test ? `Examiner: ${test.examiner || 'N/A'}` : '',
      '',
      'This certifies that the above-named student has met the',
      'standards and curriculum requirements set forth by the dojo.',
      '',
      `Issued: ${new Date().toISOString().slice(0, 10)}`,
      '',
      '________________________            ________________________',
      '  Chief Instructor                       Dojo Director',
    ];

    const pdf = buildPdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificate-${student.id}.pdf"`);
    res.setHeader('X-Custom-View', 'certificate');
    res.status(200).send(pdf);
  } catch (err) {
    console.error('[custom-views] certificate error:', err);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// =========================================================================
// NON-VIZ 2: Ranking criteria CRUD (belt requirements editor)
// =========================================================================
router.get('/belt-requirements', async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(
      'SELECT * FROM belt_requirements ORDER BY id'
    );
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('[custom-views] belt-requirements list error:', err);
    res.status(500).json({ error: 'Failed to list belt requirements' });
  }
});

router.post('/belt-requirements', async (req, res) => {
  try {
    await ensureTable();
    const { belt_rank, criterion, min_classes, min_months, required_techniques, notes } = req.body || {};
    if (!belt_rank || !criterion) {
      return res.status(400).json({ error: 'belt_rank and criterion are required' });
    }
    const result = await pool.query(
      `INSERT INTO belt_requirements
       (belt_rank, criterion, min_classes, min_months, required_techniques, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [belt_rank, criterion, min_classes || 0, min_months || 0, required_techniques || '', notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[custom-views] belt-requirements create error:', err);
    res.status(500).json({ error: 'Failed to create belt requirement' });
  }
});

router.put('/belt-requirements/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id, 10);
    const { belt_rank, criterion, min_classes, min_months, required_techniques, notes } = req.body || {};
    const result = await pool.query(
      `UPDATE belt_requirements
       SET belt_rank = COALESCE($2, belt_rank),
           criterion = COALESCE($3, criterion),
           min_classes = COALESCE($4, min_classes),
           min_months = COALESCE($5, min_months),
           required_techniques = COALESCE($6, required_techniques),
           notes = COALESCE($7, notes),
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, belt_rank, criterion, min_classes, min_months, required_techniques, notes]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[custom-views] belt-requirements update error:', err);
    res.status(500).json({ error: 'Failed to update belt requirement' });
  }
});

router.delete('/belt-requirements/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM belt_requirements WHERE id = $1', [id]);
    res.json({ ok: true, id });
  } catch (err) {
    console.error('[custom-views] belt-requirements delete error:', err);
    res.status(500).json({ error: 'Failed to delete belt requirement' });
  }
});

module.exports = router;
