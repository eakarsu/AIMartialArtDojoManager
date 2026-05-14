const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/students - List all students with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const dojoId = req.user.dojo_id || 1;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM students WHERE ($1::integer IS NULL OR dojo_id = $1)',
      [dojoId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM students
       WHERE ($1::integer IS NULL OR dojo_id = $1)
       ORDER BY last_name, first_name
       LIMIT $2 OFFSET $3`,
      [dojoId, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/students/:id - Get one student
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/students/:id/ai-history - Get AI analysis history for student
router.get('/:id/ai-history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ai_analyses WHERE student_id = $1',
      [req.params.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, endpoint, input_data, result, created_at
       FROM ai_analyses
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching AI history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      belt_rank, join_date, goals, emergency_contact,
      emergency_phone, photo_url, active
    } = req.body;
    const dojoId = req.user.dojo_id || 1;

    const result = await pool.query(
      `INSERT INTO students (first_name, last_name, email, phone, date_of_birth,
        belt_rank, join_date, goals, emergency_contact, emergency_phone, photo_url, active, dojo_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth,
       belt_rank || 'white', join_date || new Date(), goals,
       emergency_contact, emergency_phone, photo_url, active !== false, dojoId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      belt_rank, join_date, goals, emergency_contact,
      emergency_phone, photo_url, active
    } = req.body;

    const result = await pool.query(
      `UPDATE students SET first_name=$1, last_name=$2, email=$3, phone=$4,
        date_of_birth=$5, belt_rank=$6, join_date=$7, goals=$8,
        emergency_contact=$9, emergency_phone=$10, photo_url=$11, active=$12,
        updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth,
       belt_rank, join_date, goals, emergency_contact,
       emergency_phone, photo_url, active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted', student: result.rows[0] });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
