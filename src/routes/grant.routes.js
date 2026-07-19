const router = require('express').Router();
const {
  getGrants, getGrant, applyForGrant, getMyApplications,
  createGrant, updateApplicationStatus, getGrantApplications
} = require('../controllers/grant.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');

router.get('/', getGrants);
router.get('/my-applications', protect, getMyApplications);
router.get('/:id', getGrant);
router.get('/:id/applications', protect, requireRole('COMPANY','ADMIN'), getGrantApplications);
router.post('/:id/apply', protect, applyForGrant);
router.post('/', protect, requireRole('COMPANY','ADMIN'), createGrant);
router.put('/applications/:applicationId', protect, requireRole('COMPANY','ADMIN'), updateApplicationStatus);

module.exports = router;