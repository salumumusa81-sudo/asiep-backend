const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/projects',     require('./routes/project.routes'));
app.use('/api/challenges',   require('./routes/challenge.routes'));
app.use('/api/users',        require('./routes/user.routes'));
app.use('/api/notifications',require('./routes/notification.routes'));
app.use('/api/badges',       require('./routes/badge.routes'));
app.use('/api/datasets',     require('./routes/dataset.routes'));
app.use('/api/points',       require('./routes/points.routes'));
app.use('/api/discussion',   require('./routes/discussion.routes'));
app.use('/api/workspaces',   require('./routes/workspace.routes'));
app.use('/api/feed',         require('./routes/feed.routes'));
app.use('/api/grants',       require('./routes/grant.routes'));
app.use('/api/universities', require('./routes/university.routes'));
app.use('/api/startups',     require('./routes/startup.routes'));
app.use('/api/tanzanite',    require('./routes/tanzanite.routes'));
app.use('/api/admin',        require('./routes/admin.routes'));
app.use('/api/messaging',    require('./routes/messaging.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', platform: 'ASIEP', version: '1.0.0' }));
app.use(errorHandler);

module.exports = app;