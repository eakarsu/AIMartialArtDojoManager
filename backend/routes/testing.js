const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET / - List all tests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM tests t
       LEFT JOIN students s ON t.student_id = s.id
       ORDER BY t.test_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM tests t
       LEFT JOIN students s ON t.student_id = s.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching test:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, test_date, belt_level_tested, score, pass_fail, examiner, notes, techniques_evaluated } = req.body;
    const result = await pool.query(
      `INSERT INTO tests (student_id, test_date, belt_level_tested, score, pass_fail, examiner, notes, techniques_evaluated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [student_id, test_date, belt_level_tested, score, pass_fail, examiner, notes, techniques_evaluated]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating test:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, test_date, belt_level_tested, score, pass_fail, examiner, notes, techniques_evaluated } = req.body;
    const result = await pool.query(
      `UPDATE tests SET student_id=$1, test_date=$2, belt_level_tested=$3, score=$4,
       pass_fail=$5, examiner=$6, notes=$7, techniques_evaluated=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [student_id, test_date, belt_level_tested, score, pass_fail, examiner, notes, techniques_evaluated, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating test:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ message: 'Test deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting test:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
