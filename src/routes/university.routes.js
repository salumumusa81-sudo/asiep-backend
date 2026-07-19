const router = require('express').Router();
const { getUniversityDashboard, getUniversities } = require('../controllers/university.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', getUniversities);
router.get('/:universityName/dashboard', protect, getUniversityDashboard);

module.exports = router;
