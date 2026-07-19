const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getWorkspace, saveWorkspace, addResource,
  deleteResource, getStarterCodeRoute,
  getFiles, createFile, saveFile, renameFile, deleteFile,
} = require('../controllers/workspace.controller');

router.get('/starter/:language', getStarterCodeRoute);
router.get('/:challengeId', protect, getWorkspace);
router.put('/:challengeId', protect, saveWorkspace);
router.post('/:challengeId/resources', protect, requireRole('COMPANY','ADMIN'), addResource);
router.delete('/:challengeId/resources/:resourceId', protect, requireRole('COMPANY','ADMIN'), deleteResource);

// Files routes
router.get('/:challengeId/files', protect, getFiles);
router.post('/:challengeId/files', protect, createFile);
router.put('/files/:fileId', protect, saveFile);
router.patch('/files/:fileId/rename', protect, renameFile);
router.delete('/files/:fileId', protect, deleteFile);

module.exports = router;