const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/students - List all students
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students ORDER BY last_name, first_name'
    );
    res.json(result.rows);
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

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      belt_rank, join_date, goals, emergency_contact,
      emergency_phone, photo_url, active
    } = req.body;

    const result = await pool.query(
      `INSERT INTO students (first_name, last_name, email, phone, date_of_birth,
        belt_rank, join_date, goals, emergency_contact, emergency_phone, photo_url, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth,
       belt_rank || 'white', join_date || new Date(), goals,
       emergency_contact, emergency_phone, photo_url, active !== false]
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
