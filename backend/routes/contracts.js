const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM contracts c
       LEFT JOIN students s ON c.student_id = s.id
       ORDER BY c.start_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contracts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM contracts c
       LEFT JOIN students s ON c.student_id = s.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching contract:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, contract_type, start_date, end_date, monthly_amount, total_value, status, terms } = req.body;
    const result = await pool.query(
      `INSERT INTO contracts (student_id, contract_type, start_date, end_date, monthly_amount, total_value, status, terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [student_id, contract_type, start_date, end_date, monthly_amount, total_value, status || 'active', terms]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating contract:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, contract_type, start_date, end_date, monthly_amount, total_value, status, terms } = req.body;
    const result = await pool.query(
      `UPDATE contracts SET student_id=$1, contract_type=$2, start_date=$3, end_date=$4,
       monthly_amount=$5, total_value=$6, status=$7, terms=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [student_id, contract_type, start_date, end_date, monthly_amount, total_value, status, terms, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating contract:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ message: 'Contract deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting contract:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
