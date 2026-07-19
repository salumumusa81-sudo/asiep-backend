const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getMyPoints, getPlatformLeaderboard, dailyLogin } = require('../controllers/points.controller');

router.get('/me', protect, getMyPoints);
router.get('/leaderboard', getPlatformLeaderboard);
router.post('/daily-login', protect, dailyLogin);

module.exports = router;