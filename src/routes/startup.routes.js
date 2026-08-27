const router = require('express').Router();
const { getStartups, getStartup, createStartup, updateMilestone, expressInterest, getMyStartups, updateStartup, deleteStartup } = require('../controllers/startup.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/',                              getStartups);
router.get('/mine',          protect,        getMyStartups);
router.get('/:id',                           getStartup);
router.post('/',             protect,        createStartup);
router.put('/:id',           protect,        updateStartup);
router.delete('/:id',        protect,        deleteStartup);
router.put('/:id/milestones/:milestoneId', protect, updateMilestone);
router.post('/:id/interest', protect,        expressInterest);

module.exports = router;