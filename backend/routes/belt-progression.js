const express = require('express');
const router = express.Router();
const pool = require('../db');

// Belt ranks ordered for progression logic
const BELT_ORDER = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
// Required classes per belt level (simplified)
const REQUIRED_CLASSES = {
  white: 20, yellow: 30, orange: 40, green: 50, blue: 60, purple: 70, brown: 80, black: 100
};

// GET / - List all belt progressions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bp.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name,
              i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
              (i.first_name || ' ' || i.last_name) AS promoted_by_name
       FROM belt_progressions bp
       LEFT JOIN students s ON bp.student_id = s.id
       LEFT JOIN instructors i ON bp.promoted_by = i.id
       ORDER BY bp.promotion_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching belt progressions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id - Get one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bp.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name,
              i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
              (i.first_name || ' ' || i.last_name) AS promoted_by_name
       FROM belt_progressions bp
       LEFT JOIN students s ON bp.student_id = s.id
       LEFT JOIN instructors i ON bp.promoted_by = i.id
       WHERE bp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Belt progression not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching belt progression:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auto-assess-all - Auto belt-readiness assessment for all active students
router.post('/auto-assess-all', async (req, res) => {
  try {
    const studentsResult = await pool.query(
      "SELECT * FROM students WHERE active = true"
    );
    const students = studentsResult.rows;

    let assessed = 0;
    let recommended = 0;

    for (const student of students) {
      try {
        // Get class attendance count
        const attendanceResult = await pool.query(
          "SELECT COUNT(*) as class_count FROM attendance WHERE student_id = $1 AND status = 'present'",
          [student.id]
        );
        const classCount = parseInt(attendanceResult.rows[0].class_count);

        // Determine next belt
        const currentBelt = (student.belt_rank || 'white').toLowerCase();
        const currentIdx = BELT_ORDER.indexOf(currentBelt.split(' ')[0]);
        const nextBeltIdx = currentIdx >= 0 && currentIdx < BELT_ORDER.length - 1
          ? currentIdx + 1
          : -1;

        if (nextBeltIdx === -1) {
          assessed++;
          continue; // Already at max belt
        }

        const nextBelt = BELT_ORDER[nextBeltIdx];
        const requiredClasses = REQUIRED_CLASSES[currentBelt] || 30;
        const readinessScore = Math.min(100, Math.round((classCount / requiredClasses) * 100));

        if (readinessScore >= 80) {
          // Check if a 'recommended' test already exists for this student + belt
          const existingTest = await pool.query(
            "SELECT id FROM tests WHERE student_id = $1 AND belt_level_tested = $2 AND pass_fail = 'recommended'",
            [student.id, nextBelt]
          );

          if (existingTest.rows.length === 0) {
            await pool.query(
              `INSERT INTO tests (student_id, test_date, belt_level_tested, score, pass_fail, notes)
               VALUES ($1, NOW(), $2, $3, 'recommended', 'Auto-assessed: meets readiness threshold')`,
              [student.id, nextBelt, readinessScore]
            );
            recommended++;
          }
        }

        assessed++;
      } catch (innerErr) {
        console.error(`Auto-assess error for student ${student.id}:`, innerErr.message);
        assessed++;
      }
    }

    res.json({ assessed, recommended, total_students: students.length });
  } catch (err) {
    console.error('Error in auto-assess-all:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create
router.post('/', async (req, res) => {
  try {
    const { student_id, from_rank, to_rank, promotion_date, promoted_by, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO belt_progressions (student_id, from_rank, to_rank, promotion_date, promoted_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [student_id, from_rank, to_rank, promotion_date || new Date(), promoted_by, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating belt progression:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id - Update
router.put('/:id', async (req, res) => {
  try {
    const { student_id, from_rank, to_rank, promotion_date, promoted_by, notes } = req.body;
    const result = await pool.query(
      `UPDATE belt_progressions SET student_id=$1, from_rank=$2, to_rank=$3,
       promotion_date=$4, promoted_by=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [student_id, from_rank, to_rank, promotion_date, promoted_by, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Belt progression not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating belt progression:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - Delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM belt_progressions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Belt progression not found' });
    }
    res.json({ message: 'Belt progression deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting belt progression:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
