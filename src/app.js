const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://dancing-marigold-170d06.netlify.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// General limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/projects',      require('./routes/project.routes'));
app.use('/api/challenges',    require('./routes/challenge.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/badges',        require('./routes/badge.routes'));
app.use('/api/datasets',      require('./routes/dataset.routes'));
app.use('/api/points',        require('./routes/points.routes'));
app.use('/api/discussion',    require('./routes/discussion.routes'));
app.use('/api/workspaces',    require('./routes/workspace.routes'));
app.use('/api/feed',          require('./routes/feed.routes'));
app.use('/api/grants',        require('./routes/grant.routes'));
app.use('/api/universities',  require('./routes/university.routes'));
app.use('/api/startups',      require('./routes/startup.routes'));
app.use('/api/tanzanite',     require('./routes/tanzanite.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/messaging',     require('./routes/messaging.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', platform: 'ASIEP', version: '1.0.0' }));
app.use(errorHandler);

module.exports = app;