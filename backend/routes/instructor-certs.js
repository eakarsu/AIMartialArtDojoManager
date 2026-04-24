const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ic.*, i.first_name, i.last_name, (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM instructor_certifications ic
       LEFT JOIN instructors i ON ic.instructor_id = i.id
       ORDER BY ic.expiry_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching instructor certifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ic.*, i.first_name, i.last_name, (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM instructor_certifications ic
       LEFT JOIN instructors i ON ic.instructor_id = i.id
       WHERE ic.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching certification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { instructor_id, certification_name, issuing_organization, issue_date, expiry_date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO instructor_certifications (instructor_id, certification_name, issuing_organization, issue_date, expiry_date, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [instructor_id, certification_name, issuing_organization, issue_date, expiry_date, status || 'valid']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating certification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { instructor_id, certification_name, issuing_organization, issue_date, expiry_date, status } = req.body;
    const result = await pool.query(
      `UPDATE instructor_certifications SET instructor_id=$1, certification_name=$2,
       issuing_organization=$3, issue_date=$4, expiry_date=$5, status=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [instructor_id, certification_name, issuing_organization, issue_date, expiry_date, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating certification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM instructor_certifications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    res.json({ message: 'Certification deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting certification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
