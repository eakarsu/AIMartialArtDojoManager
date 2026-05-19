const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 20,
  keyGenerator: (req, res) => req.user ? `user:${req.user.id}` : ipKeyGenerator(req, res),
  message: { error: 'AI rate limit exceeded. Max 20 AI requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global limiter (for all /api routes)
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});

// Stricter auth limiter
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again later.' },
});

module.exports = { aiRateLimiter, globalRateLimiter, authRateLimiter };
