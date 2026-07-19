const router = require('express').Router();
const { body } = require('express-validator');
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, likeProject, getMyProjects, addComment, getComments
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// ── Specific routes KABLA ya /:id ─────────────────────────────────────────────
router.get('/', getProjects);
router.get('/my', protect, getMyProjects);

// ── Dynamic routes ────────────────────────────────────────────────────────────
router.get('/:id', getProject);
router.get('/:id/comments', getComments);

router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Kichwa cha mradi kinahitajika'),
  body('description').trim().notEmpty().withMessage('Maelezo yanahitajika'),
  validate,
], createProject);

router.post('/:id/like', protect, likeProject);
router.post('/:id/comments', protect, addComment);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;