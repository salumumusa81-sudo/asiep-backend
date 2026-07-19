const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getDatasets, getDataset, createDataset, downloadDataset,
  requestAccess, rateDataset, getMyDatasets, updateAccessRequest,
} = require('../controllers/dataset.controller');

router.get('/', getDatasets);
router.get('/my', protect, getMyDatasets);
router.get('/:id', getDataset);


router.post('/', protect, createDataset);
router.post('/:id/download', protect, downloadDataset);
router.post('/:id/request', protect, requestAccess);
router.post('/:id/rate', protect, rateDataset);

router.put('/requests/:requestId', protect, requireRole('ADMIN'), updateAccessRequest);

module.exports = router;