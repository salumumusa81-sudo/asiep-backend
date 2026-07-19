const router = require('express').Router();
const { getAllBadges, getUserBadges, checkBadges } = require('../controllers/badge.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/',           protect, getAllBadges);
router.get('/check',      protect, checkBadges);
router.get('/user/:userId', getUserBadges);

module.exports = router;
