const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vl.*, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name, (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM video_library vl
       LEFT JOIN instructors i ON vl.instructor_id = i.id
       ORDER BY vl.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching video library:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vl.*, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name, (i.first_name || ' ' || i.last_name) AS instructor_name
       FROM video_library vl
       LEFT JOIN instructors i ON vl.instructor_id = i.id
       WHERE vl.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { title, style, technique_category, belt_level, instructor_id, video_url, description, duration, views } = req.body;
    const result = await pool.query(
      `INSERT INTO video_library (title, style, technique_category, belt_level, instructor_id, video_url, description, duration, views)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, style, technique_category, belt_level, instructor_id, video_url, description, duration, views || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { title, style, technique_category, belt_level, instructor_id, video_url, description, duration, views } = req.body;
    const result = await pool.query(
      `UPDATE video_library SET title=$1, style=$2, technique_category=$3, belt_level=$4,
       instructor_id=$5, video_url=$6, description=$7, duration=$8, views=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title, style, technique_category, belt_level, instructor_id, video_url, description, duration, views, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM video_library WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ message: 'Video deleted', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
