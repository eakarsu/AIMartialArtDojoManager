const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM memberships m
       LEFT JOIN students s ON m.student_id = s.id
       ORDER BY m.start_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM memberships m
       LEFT JOIN students s ON m.student_id = s.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching membership:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, plan_type, start_date, end_date, amount, status, auto_renew, family_discount } = req.body;
    const result = await pool.query(
      `INSERT INTO memberships (student_id, plan_type, start_date, end_date, amount, status, auto_renew, family_discount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [student_id, plan_type, start_date, end_date, amount, status || 'active', auto_renew || false, family_discount || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating membership:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, plan_type, start_date, end_date, amount, status, auto_renew, family_discount } = req.body;
    const result = await pool.query(
      `UPDATE memberships SET student_id=$1, plan_type=$2, start_date=$3, end_date=$4,
       amount=$5, status=$6, auto_renew=$7, family_discount=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [student_id, plan_type, start_date, end_date, amount, status, auto_renew, family_discount, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating membership:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM memberships WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json({ message: 'Membership deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting membership:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
