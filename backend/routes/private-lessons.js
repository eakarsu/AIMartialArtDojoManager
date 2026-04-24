const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, s.first_name AS student_first_name, s.last_name AS student_last_name, (s.first_name || ' ' || s.last_name) AS student_name,
       i.first_name AS instructor_first_name, i.last_name AS instructor_last_name, (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM private_lessons pl
       LEFT JOIN students s ON pl.student_id = s.id
       LEFT JOIN instructors i ON pl.instructor_id = i.id
       ORDER BY pl.date DESC, pl.start_time DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching private lessons:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, s.first_name AS student_first_name, s.last_name AS student_last_name, (s.first_name || ' ' || s.last_name) AS student_name,
       i.first_name AS instructor_first_name, i.last_name AS instructor_last_name, (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM private_lessons pl
       LEFT JOIN students s ON pl.student_id = s.id
       LEFT JOIN instructors i ON pl.instructor_id = i.id
       WHERE pl.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Private lesson not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching private lesson:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, instructor_id, date, start_time, end_time, status, rate, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO private_lessons (student_id, instructor_id, date, start_time, end_time, status, rate, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [student_id, instructor_id, date, start_time, end_time, status || 'booked', rate, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating private lesson:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, instructor_id, date, start_time, end_time, status, rate, notes } = req.body;
    const result = await pool.query(
      `UPDATE private_lessons SET student_id=$1, instructor_id=$2, date=$3, start_time=$4,
       end_time=$5, status=$6, rate=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [student_id, instructor_id, date, start_time, end_time, status, rate, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Private lesson not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating private lesson:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM private_lessons WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Private lesson not found' });
    }
    res.json({ message: 'Private lesson deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting private lesson:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
