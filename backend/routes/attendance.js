const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name, c.class_name
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN classes c ON a.class_id = c.id
       ORDER BY a.date DESC, a.check_in_time DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.first_name, s.last_name, (s.first_name || ' ' || s.last_name) AS student_name, c.class_name
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { student_id, class_id, check_in_time, check_out_time, date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO attendance (student_id, class_id, check_in_time, check_out_time, date, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [student_id, class_id, check_in_time, check_out_time, date || new Date(), status || 'present']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { student_id, class_id, check_in_time, check_out_time, date, status } = req.body;
    const result = await pool.query(
      `UPDATE attendance SET student_id=$1, class_id=$2, check_in_time=$3,
       check_out_time=$4, date=$5, status=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [student_id, class_id, check_in_time, check_out_time, date, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM attendance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance record deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
