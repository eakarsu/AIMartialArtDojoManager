const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM instructors ORDER BY last_name, first_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching instructors:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM instructors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching instructor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, belt_rank, hire_date, bio, photo_url, hourly_rate, active } = req.body;
    const result = await pool.query(
      `INSERT INTO instructors (first_name, last_name, email, phone, specialization, belt_rank, hire_date, bio, photo_url, hourly_rate, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [first_name, last_name, email, phone, specialization, belt_rank, hire_date || new Date(), bio, photo_url, hourly_rate, active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating instructor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, belt_rank, hire_date, bio, photo_url, hourly_rate, active } = req.body;
    const result = await pool.query(
      `UPDATE instructors SET first_name=$1, last_name=$2, email=$3, phone=$4, specialization=$5,
       belt_rank=$6, hire_date=$7, bio=$8, photo_url=$9, hourly_rate=$10, active=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [first_name, last_name, email, phone, specialization, belt_rank, hire_date, bio, photo_url, hourly_rate, active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating instructor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM instructors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    res.json({ message: 'Instructor deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting instructor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
