const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callAI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'AI Martial Arts Dojo Manager',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert martial arts instructor and dojo management consultant. Provide detailed, actionable advice based on the student data provided. When asked to return JSON, respond ONLY with valid JSON — no markdown fences, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * parseAIJson: 3-strategy parser for AI JSON responses.
 * Strategy 1: direct JSON.parse
 * Strategy 2: extract JSON from markdown code block
 * Strategy 3: extract first {...} or [...] block
 */
function parseAIJson(text) {
  // Strategy 1: direct parse
  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  // Strategy 2: strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) {}
  }

  // Strategy 3: find first JSON object or array
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch (_) {}
  }
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch (_) {}
  }

  return null; // could not parse
}

// Fire-and-forget AI result persistence
function persistAIAnalysis(studentId, endpoint, inputData, result) {
  pool.query(
    'INSERT INTO ai_analyses (student_id, endpoint, input_data, result, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [studentId || null, endpoint, JSON.stringify(inputData), result]
  ).catch(err => console.error('Failed to persist AI analysis:', err.message));
}

// Apply rate limiter to all AI routes
router.use(aiRateLimiter);

// POST /api/ai/progression-assessment
router.post('/progression-assessment', async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const attendanceResult = await pool.query(
      `SELECT a.*, c.class_name, c.style FROM attendance a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.student_id = $1 ORDER BY a.date DESC LIMIT 50`,
      [student_id]
    );

    const beltResult = await pool.query(
      'SELECT * FROM belt_progressions WHERE student_id = $1 ORDER BY promotion_date DESC',
      [student_id]
    );

    const prompt = `Assess the martial arts progression of this student:

Student: ${student.first_name} ${student.last_name}
Current Belt: ${student.belt_rank}
Join Date: ${student.join_date}
Goals: ${student.goals || 'Not specified'}

Belt Progression History:
${beltResult.rows.map(bp => `- ${bp.from_rank} -> ${bp.to_rank} on ${bp.promotion_date} (Notes: ${bp.notes || 'N/A'})`).join('\n') || 'No belt progressions recorded'}

Recent Attendance (last 50 records):
Total classes attended: ${attendanceResult.rows.filter(a => a.status === 'present').length}
Late arrivals: ${attendanceResult.rows.filter(a => a.status === 'late').length}
Absences: ${attendanceResult.rows.filter(a => a.status === 'absent').length}
Styles practiced: ${[...new Set(attendanceResult.rows.map(a => a.style).filter(Boolean))].join(', ') || 'N/A'}

Please provide:
1. Overall progression assessment
2. Strengths identified
3. Areas for improvement
4. Recommended focus areas
5. Timeline estimate for next belt promotion`;

    const aiResponse = await callAI(prompt);
    persistAIAnalysis(student_id, 'progression-assessment', { student_id }, aiResponse);

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      assessment: aiResponse,
      data_summary: {
        current_belt: student.belt_rank,
        total_promotions: beltResult.rows.length,
        recent_attendance_count: attendanceResult.rows.length,
      },
    });
  } catch (err) {
    console.error('Error in progression assessment:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/ai/training-plan
router.post('/training-plan', async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const attendanceResult = await pool.query(
      `SELECT a.*, c.class_name, c.style, c.level FROM attendance a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.student_id = $1 AND a.status = 'present' ORDER BY a.date DESC LIMIT 30`,
      [student_id]
    );

    const testResult = await pool.query(
      'SELECT * FROM tests WHERE student_id = $1 ORDER BY test_date DESC LIMIT 5',
      [student_id]
    );

    const prompt = `Create a personalized training plan for this martial arts student:

Student: ${student.first_name} ${student.last_name}
Current Belt: ${student.belt_rank}
Date of Birth: ${student.date_of_birth}
Goals: ${student.goals || 'General improvement'}
Member Since: ${student.join_date}

Recent Class Attendance:
${attendanceResult.rows.map(a => `- ${a.class_name} (${a.style}, ${a.level}) on ${a.date}`).join('\n') || 'No recent attendance'}

Recent Test Results:
${testResult.rows.map(t => `- Belt: ${t.belt_level_tested}, Score: ${t.score}, Result: ${t.pass_fail}, Notes: ${t.notes || 'N/A'}`).join('\n') || 'No test records'}

Please create a detailed 4-week training plan including:
1. Weekly training schedule
2. Specific techniques to focus on for their belt level
3. Conditioning exercises
4. Mental preparation activities
5. Sparring recommendations
6. Goals for each week`;

    const aiResponse = await callAI(prompt);
    persistAIAnalysis(student_id, 'training-plan', { student_id }, aiResponse);

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      training_plan: aiResponse,
      current_belt: student.belt_rank,
    });
  } catch (err) {
    console.error('Error generating training plan:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/ai/belt-readiness - Structured JSON output
router.post('/belt-readiness', async (req, res) => {
  try {
    const { student_id, target_belt } = req.body;
    if (!student_id || !target_belt) {
      return res.status(400).json({ error: 'student_id and target_belt are required' });
    }

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const attendanceResult = await pool.query(
      `SELECT COUNT(*) as total_classes FROM attendance
       WHERE student_id = $1 AND status = 'present'`,
      [student_id]
    );

    const testResult = await pool.query(
      'SELECT * FROM tests WHERE student_id = $1 ORDER BY test_date DESC',
      [student_id]
    );

    const beltResult = await pool.query(
      'SELECT * FROM belt_progressions WHERE student_id = $1 ORDER BY promotion_date DESC LIMIT 1',
      [student_id]
    );

    const lastPromotion = beltResult.rows[0];
    const daysSinceLastPromotion = lastPromotion
      ? Math.floor((Date.now() - new Date(lastPromotion.promotion_date).getTime()) / (1000 * 60 * 60 * 24))
      : 'N/A';

    const prompt = `Evaluate this student's readiness for belt promotion and return JSON only.

Student: ${student.first_name} ${student.last_name}
Current Belt: ${student.belt_rank}
Target Belt: ${target_belt}
Total Classes Attended: ${attendanceResult.rows[0].total_classes}
Days Since Last Promotion: ${daysSinceLastPromotion}
Member Since: ${student.join_date}

Previous Test History:
${testResult.rows.map(t => `- ${t.belt_level_tested}: Score ${t.score}, ${t.pass_fail}, Techniques: ${t.techniques_evaluated || 'N/A'}`).join('\n') || 'No previous tests'}

Return JSON: { "readiness_score": (0-100), "ready_for_testing": bool, "strengths": [], "areas_to_improve": [], "recommended_training_weeks": number, "instructor_notes": "string" }`;

    const aiResponse = await callAI(prompt);
    persistAIAnalysis(student_id, 'belt-readiness', { student_id, target_belt }, aiResponse);

    const parsed = parseAIJson(aiResponse);

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      current_belt: student.belt_rank,
      target_belt,
      readiness: parsed || null,
      raw_assessment: parsed ? undefined : aiResponse,
    });
  } catch (err) {
    console.error('Error assessing belt readiness:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/ai/tournament-strategy
router.post('/tournament-strategy', async (req, res) => {
  try {
    const { student_id, tournament_name, division, weight_class } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE student_id = $1 ORDER BY date DESC LIMIT 10',
      [student_id]
    );

    const prompt = `Develop a tournament strategy for this martial arts competitor:

Student: ${student.first_name} ${student.last_name}
Belt Rank: ${student.belt_rank}
Tournament: ${tournament_name || 'Upcoming tournament'}
Division: ${division || 'Not specified'}
Weight Class: ${weight_class || 'Not specified'}

Past Tournament History:
${tournamentResult.rows.map(t => `- ${t.tournament_name}: ${t.division}, Result: ${t.result}, Placement: ${t.placement}, Points: ${t.points}`).join('\n') || 'No tournament history'}

Please provide:
1. Pre-tournament preparation plan (2 weeks out)
2. Day-of-tournament strategy
3. Mental preparation techniques
4. Key techniques to focus on
5. Common opponent strategies and counters
6. Recovery plan post-tournament
7. Nutrition and hydration recommendations`;

    const aiResponse = await callAI(prompt);
    persistAIAnalysis(student_id, 'tournament-strategy', { student_id, tournament_name, division }, aiResponse);

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      tournament_strategy: aiResponse,
    });
  } catch (err) {
    console.error('Error generating tournament strategy:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/ai/injury-prevention - Structured JSON output
router.post('/injury-prevention', async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const attendanceResult = await pool.query(
      `SELECT a.date, c.class_name, c.style, c.level FROM attendance a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.student_id = $1 AND a.status = 'present'
       ORDER BY a.date DESC LIMIT 60`,
      [student_id]
    );

    const privateLessons = await pool.query(
      'SELECT * FROM private_lessons WHERE student_id = $1 ORDER BY date DESC LIMIT 20',
      [student_id]
    );

    const classFrequency = attendanceResult.rows.length;
    const styles = [...new Set(attendanceResult.rows.map(a => a.style).filter(Boolean))];

    const prompt = `Analyze training patterns and provide structured injury prevention advice. Return JSON only.

Student: ${student.first_name} ${student.last_name}
Age: ${student.date_of_birth ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'}
Belt Rank: ${student.belt_rank}
Training Frequency: ${classFrequency} classes in recent period
Styles Practiced: ${styles.join(', ') || 'Not specified'}
Private Lessons Recently: ${privateLessons.rows.length}
Class Levels Attended: ${[...new Set(attendanceResult.rows.map(a => a.level).filter(Boolean))].join(', ') || 'Mixed levels'}

Return JSON: { "risk_level": "low|medium|high", "risk_score": (0-100), "risk_factors": [], "warmup_exercises": [], "cooldown_exercises": [], "recommended_rest_days": number, "volume_recommendations": "string" }`;

    const aiResponse = await callAI(prompt);
    persistAIAnalysis(student_id, 'injury-prevention', { student_id }, aiResponse);

    const parsed = parseAIJson(aiResponse);

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      injury_prevention: parsed || null,
      raw_response: parsed ? undefined : aiResponse,
      training_summary: {
        recent_classes: classFrequency,
        styles,
        private_lessons: privateLessons.rows.length,
      },
    });
  } catch (err) {
    console.error('Error generating injury prevention:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #1: AI-triggered test scheduler
   When belt-readiness >= 80, automatically insert a draft `tests` row.
   ════════════════════════════════════════════════════════════════════════ */
router.post('/auto-schedule-test', async (req, res) => {
  try {
    const { student_id, target_belt, threshold = 80 } = req.body;
    if (!student_id || !target_belt) return res.status(400).json({ error: 'student_id and target_belt required' });

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const student = studentResult.rows[0];

    const attendanceResult = await pool.query(`SELECT COUNT(*)::int AS total FROM attendance WHERE student_id = $1 AND status='present'`, [student_id]);
    const beltResult = await pool.query(`SELECT * FROM belt_progressions WHERE student_id = $1 ORDER BY promotion_date DESC LIMIT 1`, [student_id]);
    const lastPromo = beltResult.rows[0];
    const days = lastPromo ? Math.floor((Date.now() - new Date(lastPromo.promotion_date).getTime()) / 86400000) : 'N/A';

    const prompt = `Evaluate readiness and respond with JSON only:
Student: ${student.first_name} ${student.last_name}
Current: ${student.belt_rank} → Target: ${target_belt}
Total Classes: ${attendanceResult.rows[0].total}
Days Since Last Promotion: ${days}
Return: { "readiness_score": (0-100), "ready_for_testing": bool, "recommended_training_weeks": number, "rationale": string }`;
    const aiResp = await callAI(prompt);
    const parsed = parseAIJson(aiResp);
    persistAIAnalysis(student_id, 'auto-schedule-test', { student_id, target_belt }, aiResp);

    let createdTest = null;
    if (parsed && (parsed.readiness_score || 0) >= threshold) {
      const proposedDate = new Date(Date.now() + (parsed.recommended_training_weeks || 4) * 7 * 86400000);
      try {
        const ins = await pool.query(
          `INSERT INTO tests (student_id, belt_level_tested, test_date, pass_fail, score, notes, created_at)
           VALUES ($1, $2, $3, 'proposed', NULL, $4, NOW()) RETURNING *`,
          [student_id, target_belt, proposedDate.toISOString().slice(0, 10), `Auto-proposed by AI; readiness=${parsed.readiness_score}`]
        );
        createdTest = ins.rows[0];
      } catch (e) {
        // Schema variation fallback
        try {
          const ins = await pool.query(
            `INSERT INTO tests (student_id, belt_level_tested, test_date, pass_fail, notes)
             VALUES ($1, $2, $3, 'proposed', $4) RETURNING *`,
            [student_id, target_belt, proposedDate.toISOString().slice(0, 10), `Auto-proposed; readiness=${parsed.readiness_score}`]
          );
          createdTest = ins.rows[0];
        } catch (e2) { console.error('Test insert failed:', e2.message); }
      }
    }

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      readiness: parsed,
      raw_response: parsed ? undefined : aiResp,
      threshold,
      created_test: createdTest,
      auto_scheduled: !!createdTest,
    });
  } catch (err) {
    console.error('auto-schedule-test error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #2: Sparring partner matchmaker
   ════════════════════════════════════════════════════════════════════════ */
router.post('/sparring-match', async (req, res) => {
  try {
    const { student_a_id, student_b_id } = req.body;
    if (!student_a_id || !student_b_id) return res.status(400).json({ error: 'student_a_id and student_b_id required' });

    const [aRes, bRes] = await Promise.all([
      pool.query('SELECT * FROM students WHERE id = $1', [student_a_id]),
      pool.query('SELECT * FROM students WHERE id = $1', [student_b_id]),
    ]);
    if (!aRes.rows[0] || !bRes.rows[0]) return res.status(404).json({ error: 'Student not found' });
    const a = aRes.rows[0], b = bRes.rows[0];

    const [aStyles, bStyles] = await Promise.all([
      pool.query(`SELECT DISTINCT c.style FROM attendance a JOIN classes c ON a.class_id=c.id WHERE a.student_id=$1`, [student_a_id]),
      pool.query(`SELECT DISTINCT c.style FROM attendance a JOIN classes c ON a.class_id=c.id WHERE a.student_id=$1`, [student_b_id]),
    ]);

    const ageA = a.date_of_birth ? Math.floor((Date.now() - new Date(a.date_of_birth).getTime()) / 31557600000) : null;
    const ageB = b.date_of_birth ? Math.floor((Date.now() - new Date(b.date_of_birth).getTime()) / 31557600000) : null;

    const prompt = `Score sparring compatibility between two martial arts students. Return JSON only:
Student A: ${a.first_name} ${a.last_name}, Belt: ${a.belt_rank}, Age: ${ageA}, Styles: ${aStyles.rows.map(r => r.style).join(', ') || 'unknown'}
Student B: ${b.first_name} ${b.last_name}, Belt: ${b.belt_rank}, Age: ${ageB}, Styles: ${bStyles.rows.map(r => r.style).join(', ') || 'unknown'}

Return: { "compatibility_score": (0-100), "safety_rating": "safe|caution|unsafe", "rationale": string, "training_focus": [string], "round_format": string, "concerns": [string] }`;

    const aiResp = await callAI(prompt);
    const parsed = parseAIJson(aiResp);
    persistAIAnalysis(student_a_id, 'sparring-match', { student_a_id, student_b_id }, aiResp);

    if (parsed?.compatibility_score) {
      pool.query(
        `INSERT INTO sparring_matchups (student_a_id, student_b_id, compatibility_score, rationale)
         VALUES ($1, $2, $3, $4)`,
        [student_a_id, student_b_id, parsed.compatibility_score, parsed.rationale || '']
      ).catch(e => console.error('matchup save fail:', e.message));
    }

    res.json({
      student_a: { id: a.id, name: `${a.first_name} ${a.last_name}`, belt: a.belt_rank },
      student_b: { id: b.id, name: `${b.first_name} ${b.last_name}`, belt: b.belt_rank },
      match: parsed,
      raw_response: parsed ? undefined : aiResp,
    });
  } catch (err) {
    console.error('sparring-match error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #3: Drop-out risk analysis + AI re-engagement message
   ════════════════════════════════════════════════════════════════════════ */
router.post('/dropout-risk', async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id required' });

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const student = studentResult.rows[0];

    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='present' AND date >= CURRENT_DATE - INTERVAL '30 days')::int AS last_30,
        COUNT(*) FILTER (WHERE status='present' AND date >= CURRENT_DATE - INTERVAL '120 days' AND date < CURRENT_DATE - INTERVAL '30 days')::int AS prior_90,
        COUNT(*) FILTER (WHERE status='present')::int AS lifetime,
        MAX(date) AS last_attended
      FROM attendance WHERE student_id = $1`, [student_id]);
    const s = stats.rows[0];
    const baseline = s.prior_90 / 3.0;
    const dropPct = baseline > 0 ? Math.max(0, Math.round((1 - s.last_30 / baseline) * 100)) : 0;

    const prompt = `Analyze drop-out risk and draft a personalized re-engagement message. Return JSON only:
Student: ${student.first_name} ${student.last_name}
Current Belt: ${student.belt_rank}
Goals: ${student.goals || 'unknown'}
Last 30 days attendance: ${s.last_30}
Prior 90 days avg/30: ${baseline.toFixed(1)}
Drop %: ${dropPct}
Last attended: ${s.last_attended || 'never'}
Lifetime attendance: ${s.lifetime}

Return: { "risk_level": "low|medium|high|critical", "risk_score": (0-100), "risk_factors": [string], "reengagement_message": "personalized text under 200 words", "recommended_next_steps": [string], "outreach_priority": "low|medium|high" }`;

    const aiResp = await callAI(prompt);
    const parsed = parseAIJson(aiResp);
    persistAIAnalysis(student_id, 'dropout-risk', { student_id }, aiResp);

    // Auto-create a private_lessons outreach task if high/critical
    let outreachTask = null;
    if (parsed && ['high', 'critical'].includes(parsed.risk_level)) {
      try {
        const ins = await pool.query(
          `INSERT INTO private_lessons (student_id, date, instructor_id, focus, status, notes)
           VALUES ($1, $2, NULL, 'Re-engagement check-in', 'proposed', $3) RETURNING *`,
          [student_id, new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), parsed.reengagement_message?.substring(0, 500) || 'AI-flagged retention outreach']
        );
        outreachTask = ins.rows[0];
      } catch (e) { console.error('outreach insert fail:', e.message); }
    }

    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      attendance_stats: { ...s, drop_pct: dropPct },
      risk: parsed,
      raw_response: parsed ? undefined : aiResp,
      outreach_task: outreachTask,
    });
  } catch (err) {
    console.error('dropout-risk error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #4: Tournament bracket projector
   ════════════════════════════════════════════════════════════════════════ */
router.post('/bracket-projection', async (req, res) => {
  try {
    const { tournament_name, student_ids } = req.body;
    if (!Array.isArray(student_ids) || student_ids.length < 2) {
      return res.status(400).json({ error: 'student_ids must be array of >=2' });
    }

    const studentRows = await pool.query(`SELECT * FROM students WHERE id = ANY($1)`, [student_ids]);
    const tournRows = await pool.query(`SELECT * FROM tournaments WHERE student_id = ANY($1) ORDER BY date DESC LIMIT 100`, [student_ids]);

    const studentSummary = studentRows.rows.map(s => {
      const past = tournRows.rows.filter(t => t.student_id === s.id);
      const wins = past.filter(t => /1st|gold|win/i.test(t.placement || t.result || '')).length;
      const totalPoints = past.reduce((a, t) => a + (parseInt(t.points) || 0), 0);
      return { id: s.id, name: `${s.first_name} ${s.last_name}`, belt: s.belt_rank, past_competitions: past.length, wins, total_points: totalPoints };
    });

    const prompt = `Project a single-elimination tournament bracket. Return JSON only:
Tournament: ${tournament_name || 'Untitled tournament'}
Competitors: ${JSON.stringify(studentSummary, null, 2)}

Return: { "bracket": [{ "round": number, "match": number, "competitor_a_id": int, "competitor_b_id": int, "predicted_winner_id": int, "confidence": (0-100), "reasoning": string }], "champion_prediction": { "id": int, "name": string, "confidence": (0-100) }, "focus_matchups": [{ "match_description": string, "why": string }] }`;

    const aiResp = await callAI(prompt);
    const parsed = parseAIJson(aiResp);
    persistAIAnalysis(null, 'bracket-projection', { tournament_name, student_ids }, aiResp);

    res.json({
      tournament_name,
      competitors: studentSummary,
      projection: parsed,
      raw_response: parsed ? undefined : aiResp,
    });
  } catch (err) {
    console.error('bracket-projection error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #5: Curriculum coverage tracker
   Lists which required techniques for student's target belt they've never trained.
   ════════════════════════════════════════════════════════════════════════ */
router.post('/curriculum-coverage', async (req, res) => {
  try {
    const { student_id, target_belt } = req.body;
    if (!student_id || !target_belt) return res.status(400).json({ error: 'student_id and target_belt required' });

    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const student = studentResult.rows[0];

    // Required techniques for the target belt
    const required = await pool.query(`SELECT * FROM techniques WHERE required_for_belt = $1`, [target_belt]);
    // Techniques covered by classes the student attended
    const covered = await pool.query(`
      SELECT DISTINCT t.id, t.name
      FROM techniques t
      JOIN class_techniques ct ON ct.technique_id = t.id
      JOIN attendance a ON a.class_id = ct.class_id
      WHERE a.student_id = $1 AND a.status = 'present' AND t.required_for_belt = $2`,
      [student_id, target_belt]);

    const coveredIds = new Set(covered.rows.map(r => r.id));
    const missing = required.rows.filter(t => !coveredIds.has(t.id));

    let aiPlan = null;
    if (missing.length > 0) {
      const prompt = `Plan a focused curriculum to fill technique gaps. Return JSON only:
Student: ${student.first_name} ${student.last_name}
Current Belt: ${student.belt_rank} → Target: ${target_belt}
Required techniques (total): ${required.rows.length}
Missing (${missing.length}): ${missing.slice(0, 30).map(t => t.name).join(', ')}

Return: { "priority_groups": [{ "group_name": string, "techniques": [string], "weeks_to_master": number, "drills": [string] }], "estimated_total_weeks": number, "instructor_focus_notes": string }`;
      const aiResp = await callAI(prompt);
      aiPlan = parseAIJson(aiResp);
      persistAIAnalysis(student_id, 'curriculum-coverage', { student_id, target_belt }, aiResp);
    }

    res.json({
      student_id,
      target_belt,
      required_count: required.rows.length,
      covered_count: covered.rows.length,
      missing_count: missing.length,
      coverage_pct: required.rows.length > 0 ? Math.round((covered.rows.length / required.rows.length) * 100) : 0,
      missing_techniques: missing,
      ai_plan: aiPlan,
    });
  } catch (err) {
    console.error('curriculum-coverage error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/marketing-content - Live stats + structured JSON
router.post('/marketing-content', async (req, res) => {
  try {
    const { content_type, details } = req.body;
    if (!content_type) {
      return res.status(400).json({ error: 'content_type is required' });
    }

    // Fetch real live stats
    const [studentCount, classCount, styleResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students WHERE active = true'),
      pool.query('SELECT COUNT(*) FROM classes WHERE active = true'),
      pool.query('SELECT DISTINCT style FROM classes WHERE active = true'),
    ]);

    const activeStudents = parseInt(studentCount.rows[0].count);
    const activeClasses = parseInt(classCount.rows[0].count);
    const styles = styleResult.rows.map(r => r.style).filter(Boolean);

    const prompt = `Generate marketing content for a martial arts dojo. Return JSON only.

Dojo Stats (real-time):
- Active Students: ${activeStudents}
- Active Classes: ${activeClasses}
- Styles Offered: ${styles.join(', ') || 'Various martial arts'}

Content Type Requested: ${content_type}
Additional Details: ${details || 'General promotion for the dojo'}

Return JSON: { "social_post": "string (Instagram/Facebook ready post with hashtags)", "email_subject": "string", "email_body": "string (HTML-friendly)", "flyer_headline": "string", "flyer_body": "string" }`;

    const aiResponse = await callAI(prompt);
    persistAIAnalysis(null, 'marketing-content', { content_type, details }, aiResponse);

    const parsed = parseAIJson(aiResponse);

    res.json({
      content_type,
      marketing_content: parsed || null,
      raw_response: parsed ? undefined : aiResponse,
      dojo_stats: {
        active_students: activeStudents,
        active_classes: activeClasses,
        styles,
      },
    });
  } catch (err) {
    console.error('Error generating marketing content:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/ai/student-performance-analytics
router.post('/student-performance-analytics', async (req, res) => {
  try {
    const { student_id, since } = req.body;
    let attendance = [];
    let testing = [];
    let progressions = [];
    let student = null;
    try {
      const sQ = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
      student = sQ.rows[0];
    } catch (e) {}
    try {
      const aQ = await pool.query('SELECT * FROM attendance WHERE student_id = $1 ORDER BY id DESC LIMIT 100', [student_id]);
      attendance = aQ.rows;
    } catch (e) {}
    try {
      const tQ = await pool.query('SELECT * FROM testing WHERE student_id = $1 ORDER BY id DESC LIMIT 30', [student_id]);
      testing = tQ.rows;
    } catch (e) {}
    try {
      const pQ = await pool.query('SELECT * FROM belt_progression WHERE student_id = $1 ORDER BY id DESC LIMIT 30', [student_id]);
      progressions = pQ.rows;
    } catch (e) {}

    const prompt = `Analyze student performance and identify struggling areas.
Student: ${JSON.stringify(student)}
Since: ${since || 'all time'}
Attendance (last 100): ${JSON.stringify(attendance).slice(0, 4000)}
Testing history: ${JSON.stringify(testing).slice(0, 2500)}
Belt progressions: ${JSON.stringify(progressions).slice(0, 2500)}

Return ONLY JSON: { performance_score (0-100), strengths: [], struggling_areas: [{area, evidence, intervention}], attendance_trend ("improving"|"stable"|"declining"), testing_trajectory, recommended_focus: [], retention_risk ("low"|"medium"|"high") }`;

    const result = await callAI(prompt);
    const structured = parseAIJson(result);
    persistAIAnalysis(student_id, 'student-performance-analytics', { since }, result);
    res.json({ raw: result, structured });
  } catch (err) {
    console.error('Student performance analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/class-optimization — suggest class times/levels to maximize enrollment
router.post('/class-optimization', async (req, res) => {
  try {
    const { dojoId } = req.body;
    let classes = [];
    let attendance = [];
    let students = [];
    try {
      const cQ = await pool.query('SELECT * FROM classes ORDER BY id LIMIT 50');
      classes = cQ.rows;
    } catch (e) {}
    try {
      const aQ = await pool.query('SELECT * FROM attendance ORDER BY id DESC LIMIT 200');
      attendance = aQ.rows;
    } catch (e) {}
    try {
      const sQ = await pool.query('SELECT id, level, age FROM students LIMIT 200');
      students = sQ.rows;
    } catch (e) {}

    const prompt = `Optimize the class schedule for enrollment and retention.
Dojo: ${dojoId || 'all'}
Classes: ${JSON.stringify(classes).slice(0, 4000)}
Recent attendance: ${JSON.stringify(attendance).slice(0, 4000)}
Student demographics (sample): ${JSON.stringify(students).slice(0, 2500)}

Return ONLY JSON: { recommendations: [{class_id, change_type ("add"|"reschedule"|"merge"|"split"|"cancel"), proposed_change, rationale, expected_enrollment_lift}], schedule_gaps: [], over_supplied_slots: [], summary }`;

    const result = await callAI(prompt);
    const structured = parseAIJson(result);
    persistAIAnalysis(null, 'class-optimization', { dojoId: dojoId || null }, result);
    res.json({ raw: result, structured });
  } catch (err) {
    console.error('Class optimization error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/equipment-demand-forecast — forecast equipment needs from inventory + student level data
router.post('/equipment-demand-forecast', async (req, res) => {
  try {
    const { dojoId, horizon_days } = req.body;
    const horizon = horizon_days && Number.isFinite(parseInt(horizon_days, 10)) ? parseInt(horizon_days, 10) : 90;
    let equipment = [];
    let students = [];
    let testing = [];
    try {
      const eQ = await pool.query('SELECT * FROM equipment ORDER BY id LIMIT 200');
      equipment = eQ.rows;
    } catch (e) {}
    try {
      const sQ = await pool.query('SELECT id, level, age FROM students LIMIT 500');
      students = sQ.rows;
    } catch (e) {}
    try {
      const tQ = await pool.query('SELECT * FROM testing ORDER BY id DESC LIMIT 100');
      testing = tQ.rows;
    } catch (e) {}

    const prompt = `Forecast equipment demand for a martial arts dojo.
Dojo: ${dojoId || 'all'}
Horizon (days): ${horizon}
Current equipment inventory: ${JSON.stringify(equipment).slice(0, 4000)}
Student roster (level + age): ${JSON.stringify(students).slice(0, 3000)}
Recent testing/grading events: ${JSON.stringify(testing).slice(0, 2000)}

Return ONLY JSON: { forecast: [{ item, current_qty, projected_demand, reorder_qty, urgency ("low"|"medium"|"high"), reasoning }], retiring_items: [], summary, total_estimated_cost (or null) }`;

    const result = await callAI(prompt);
    const structured = parseAIJson(result);
    persistAIAnalysis(null, 'equipment-demand-forecast', { dojoId: dojoId || null, horizon_days: horizon }, result);
    res.json({ raw: result, structured });
  } catch (err) {
    console.error('Equipment demand forecast error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/instructor-workload-balancer — recommend reassignments to balance instructor load
router.post('/instructor-workload-balancer', async (req, res) => {
  try {
    const { dojoId } = req.body;
    let instructors = [];
    let classes = [];
    let attendance = [];
    try {
      const iQ = await pool.query('SELECT * FROM instructors LIMIT 100');
      instructors = iQ.rows;
    } catch (e) {}
    try {
      const cQ = await pool.query('SELECT * FROM classes ORDER BY id LIMIT 100');
      classes = cQ.rows;
    } catch (e) {}
    try {
      const aQ = await pool.query('SELECT class_id, COUNT(*)::int AS cnt FROM attendance GROUP BY class_id ORDER BY cnt DESC LIMIT 100');
      attendance = aQ.rows;
    } catch (e) {}

    const prompt = `Balance instructor workload across classes for a martial arts dojo.
Dojo: ${dojoId || 'all'}
Instructors: ${JSON.stringify(instructors).slice(0, 3000)}
Classes (with assignments where available): ${JSON.stringify(classes).slice(0, 4000)}
Per-class attendance volume: ${JSON.stringify(attendance).slice(0, 2000)}

Return ONLY JSON: { current_load: [{ instructor_id, classes_per_week, students_per_week, utilization (0-1) }], imbalances: [{ instructor_id, issue, severity }], recommendations: [{ action ("reassign"|"add_class"|"reduce_load"|"hire"), instructor_id, class_id (or null), rationale }], summary }`;

    const result = await callAI(prompt);
    const structured = parseAIJson(result);
    persistAIAnalysis(null, 'instructor-workload-balancer', { dojoId: dojoId || null }, result);
    res.json({ raw: result, structured });
  } catch (err) {
    console.error('Instructor workload balancer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/history - paginated AI analyses across all students
router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const studentId = req.query.student_id;
    const where = studentId ? 'WHERE student_id = $1' : '';
    const params = studentId ? [studentId, limit, offset] : [limit, offset];
    const limitParamIdx = studentId ? '$2' : '$1';
    const offsetParamIdx = studentId ? '$3' : '$2';
    const [rows, count] = await Promise.all([
      pool.query(`SELECT id, student_id, endpoint, input_data, result, created_at FROM ai_analyses ${where} ORDER BY created_at DESC LIMIT ${limitParamIdx} OFFSET ${offsetParamIdx}`, params),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM ai_analyses ${where}`, studentId ? [studentId] : []),
    ]);
    res.json({ data: rows.rows, pagination: { page, limit, total: count.rows[0].cnt, totalPages: Math.ceil(count.rows[0].cnt / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
