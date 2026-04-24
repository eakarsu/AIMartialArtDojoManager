const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET / - List all belt progressions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bp.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name, (i.first_name || ' ' || i.last_name) AS promoted_by_name
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
      `SELECT bp.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name, (i.first_name || ' ' || i.last_name) AS promoted_by_name
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
