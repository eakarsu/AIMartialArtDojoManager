const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY category, item_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { item_name, category, quantity, condition, purchase_date, cost, location, needs_replacement } = req.body;
    const result = await pool.query(
      `INSERT INTO equipment (item_name, category, quantity, condition, purchase_date, cost, location, needs_replacement)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item_name, category, quantity || 1, condition || 'good', purchase_date, cost, location, needs_replacement || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { item_name, category, quantity, condition, purchase_date, cost, location, needs_replacement } = req.body;
    const result = await pool.query(
      `UPDATE equipment SET item_name=$1, category=$2, quantity=$3, condition=$4,
       purchase_date=$5, cost=$6, location=$7, needs_replacement=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [item_name, category, quantity, condition, purchase_date, cost, location, needs_replacement, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
