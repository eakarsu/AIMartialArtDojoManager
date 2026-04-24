const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM waivers w
       LEFT JOIN students s ON w.student_id = s.id
       ORDER BY w.signed_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching waivers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM waivers w
       LEFT JOIN students s ON w.student_id = s.id
       WHERE w.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waiver not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching waiver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, waiver_type, signed_date, expiry_date, guardian_name, status, document_url } = req.body;
    const result = await pool.query(
      `INSERT INTO waivers (student_id, waiver_type, signed_date, expiry_date, guardian_name, status, document_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [student_id, waiver_type, signed_date || new Date(), expiry_date, guardian_name, status || 'active', document_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating waiver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, waiver_type, signed_date, expiry_date, guardian_name, status, document_url } = req.body;
    const result = await pool.query(
      `UPDATE waivers SET student_id=$1, waiver_type=$2, signed_date=$3, expiry_date=$4,
       guardian_name=$5, status=$6, document_url=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [student_id, waiver_type, signed_date, expiry_date, guardian_name, status, document_url, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waiver not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating waiver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM waivers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waiver not found' });
    }
    res.json({ message: 'Waiver deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting waiver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
