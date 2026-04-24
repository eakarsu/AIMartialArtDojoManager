const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM billing b
       LEFT JOIN students s ON b.student_id = s.id
       ORDER BY b.due_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM billing b
       LEFT JOIN students s ON b.student_id = s.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, amount, due_date, paid_date, payment_method, status, description, auto_pay } = req.body;
    const result = await pool.query(
      `INSERT INTO billing (student_id, amount, due_date, paid_date, payment_method, status, description, auto_pay)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [student_id, amount, due_date, paid_date, payment_method, status || 'pending', description, auto_pay || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating billing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, amount, due_date, paid_date, payment_method, status, description, auto_pay } = req.body;
    const result = await pool.query(
      `UPDATE billing SET student_id=$1, amount=$2, due_date=$3, paid_date=$4,
       payment_method=$5, status=$6, description=$7, auto_pay=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [student_id, amount, due_date, paid_date, payment_method, status, description, auto_pay, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating billing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM billing WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.json({ message: 'Billing record deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting billing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
