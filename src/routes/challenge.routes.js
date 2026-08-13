const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  enterChallenge,
  submitSolution,
  getMyEntries,
  getLeaderboard,
  reviewEntry,
} = require('../controllers/challenge.controller');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getChallenges);
router.get('/my/entries', protect, getMyEntries);
router.get('/:id', getChallenge);
router.get('/:id/leaderboard', getLeaderboard);

// ── Student ───────────────────────────────────────────────────────────────────
router.post('/:id/join', protect, enterChallenge);
router.post('/:id/submit', protect, submitSolution);

// ── Company & Admin ───────────────────────────────────────────────────────────
router.post('/', protect, requireRole('COMPANY','ADMIN'), createChallenge);
router.put('/:id', protect, requireRole('COMPANY','ADMIN'), updateChallenge);
router.put('/:id/entries/:entryId/review', protect, requireRole('COMPANY','ADMIN'), reviewEntry);

// ── Admin only ────────────────────────────────────────────────────────────────
router.delete('/:id', protect, requireRole('ADMIN'), deleteChallenge);

module.exports = router;