const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM tournaments t
       LEFT JOIN students s ON t.student_id = s.id
       ORDER BY t.date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name
       FROM tournaments t
       LEFT JOIN students s ON t.student_id = s.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament entry not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching tournament:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { tournament_name, date, location, student_id, division, weight_class, result: resultVal, placement, points } = req.body;
    const dbResult = await pool.query(
      `INSERT INTO tournaments (tournament_name, date, location, student_id, division, weight_class, result, placement, points)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tournament_name, date, location, student_id, division, weight_class, resultVal, placement, points]
    );
    res.status(201).json(dbResult.rows[0]);
  } catch (err) {
    console.error('Error creating tournament:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { tournament_name, date, location, student_id, division, weight_class, result: resultVal, placement, points } = req.body;
    const dbResult = await pool.query(
      `UPDATE tournaments SET tournament_name=$1, date=$2, location=$3, student_id=$4,
       division=$5, weight_class=$6, result=$7, placement=$8, points=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [tournament_name, date, location, student_id, division, weight_class, resultVal, placement, points, req.params.id]
    );
    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament entry not found' });
    }
    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error('Error updating tournament:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tournaments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament entry not found' });
    }
    res.json({ message: 'Tournament entry deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting tournament:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
