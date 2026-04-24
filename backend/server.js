require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/belt-progression', require('./routes/belt-progression'));
app.use('/api/testing', require('./routes/testing'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/private-lessons', require('./routes/private-lessons'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/waivers', require('./routes/waivers'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/video-library', require('./routes/video-library'));
app.use('/api/instructor-certs', require('./routes/instructor-certs'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
