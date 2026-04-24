const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callAI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

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
          content: 'You are an expert martial arts instructor and dojo management consultant. Provide detailed, actionable advice based on the student data provided. Always respond in a structured format.',
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

// POST /api/ai/belt-readiness
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

    const prompt = `Evaluate this student's readiness for belt promotion:

Student: ${student.first_name} ${student.last_name}
Current Belt: ${student.belt_rank}
Target Belt: ${target_belt}
Total Classes Attended: ${attendanceResult.rows[0].total_classes}
Days Since Last Promotion: ${daysSinceLastPromotion}
Member Since: ${student.join_date}

Previous Test History:
${testResult.rows.map(t => `- ${t.belt_level_tested}: Score ${t.score}, ${t.pass_fail}, Techniques: ${t.techniques_evaluated || 'N/A'}`).join('\n') || 'No previous tests'}

Please provide:
1. Readiness score (0-100)
2. Areas where student is ready
3. Areas needing improvement
4. Recommended preparation timeline
5. Specific techniques to master before testing
6. Overall recommendation (ready / needs more time / close but not yet)`;

    const aiResponse = await callAI(prompt);
    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      current_belt: student.belt_rank,
      target_belt,
      readiness_assessment: aiResponse,
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

// POST /api/ai/injury-prevention
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

    const prompt = `Analyze training patterns and provide injury prevention advice for this martial arts student:

Student: ${student.first_name} ${student.last_name}
Age: ${student.date_of_birth ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'}
Belt Rank: ${student.belt_rank}
Training Frequency: ${classFrequency} classes in recent period
Styles Practiced: ${styles.join(', ') || 'Not specified'}
Private Lessons Recently: ${privateLessons.rows.length}

Class Levels Attended:
${[...new Set(attendanceResult.rows.map(a => a.level).filter(Boolean))].join(', ') || 'Mixed levels'}

Please provide:
1. Risk assessment based on training volume and intensity
2. Common injuries for their style(s) and belt level
3. Warm-up routine recommendations
4. Cool-down and recovery recommendations
5. Signs of overtraining to watch for
6. Stretching and flexibility program
7. Nutrition for recovery
8. Rest day recommendations`;

    const aiResponse = await callAI(prompt);
    res.json({
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      injury_prevention: aiResponse,
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

// POST /api/ai/marketing-content
router.post('/marketing-content', async (req, res) => {
  try {
    const { content_type, details } = req.body;
    if (!content_type) {
      return res.status(400).json({ error: 'content_type is required (social_media, email, or flyer)' });
    }

    const studentCount = await pool.query('SELECT COUNT(*) FROM students WHERE active = true');
    const classCount = await pool.query('SELECT COUNT(*) FROM classes WHERE active = true');
    const styleResult = await pool.query('SELECT DISTINCT style FROM classes WHERE active = true');

    const prompt = `Generate ${content_type} marketing content for a martial arts dojo with the following details:

Dojo Info:
- Active Students: ${studentCount.rows[0].count}
- Active Classes: ${classCount.rows[0].count}
- Styles Offered: ${styleResult.rows.map(r => r.style).join(', ') || 'Various martial arts'}

Content Type: ${content_type}
Additional Details: ${details || 'General promotion for the dojo'}

Please generate:
${content_type === 'social_media' ? `1. 3 social media post options (Instagram/Facebook)
2. Suggested hashtags
3. Call to action
4. Best posting times` : ''}
${content_type === 'email' ? `1. Subject line options (3)
2. Email body with compelling copy
3. Call to action
4. Follow-up email suggestion` : ''}
${content_type === 'flyer' ? `1. Headline options
2. Body copy
3. Key selling points to highlight
4. Call to action
5. Layout suggestions` : ''}

Make it engaging, professional, and focused on the benefits of martial arts training.`;

    const aiResponse = await callAI(prompt);
    res.json({
      content_type,
      marketing_content: aiResponse,
      dojo_stats: {
        active_students: parseInt(studentCount.rows[0].count),
        active_classes: parseInt(classCount.rows[0].count),
        styles: styleResult.rows.map(r => r.style),
      },
    });
  } catch (err) {
    console.error('Error generating marketing content:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
