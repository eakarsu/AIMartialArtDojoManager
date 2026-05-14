const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET / - List classes with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM classes');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT c.*, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
              (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM classes c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       ORDER BY c.day_of_week, c.start_time
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
              (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM classes c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching class:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { class_name, style, level, instructor_id, day_of_week, start_time, end_time, room, max_capacity, active } = req.body;
    const result = await pool.query(
      `INSERT INTO classes (class_name, style, level, instructor_id, day_of_week, start_time, end_time, room, max_capacity, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [class_name, style, level, instructor_id, day_of_week, start_time, end_time, room, max_capacity || 20, active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating class:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { class_name, style, level, instructor_id, day_of_week, start_time, end_time, room, max_capacity, active } = req.body;
    const result = await pool.query(
      `UPDATE classes SET class_name=$1, style=$2, level=$3, instructor_id=$4, day_of_week=$5,
       start_time=$6, end_time=$7, room=$8, max_capacity=$9, active=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [class_name, style, level, instructor_id, day_of_week, start_time, end_time, room, max_capacity, active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating class:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ message: 'Class deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting class:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
