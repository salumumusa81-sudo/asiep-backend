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
  getEntries,
  updateEntryStatus,
  getMyChallenges,
  getChallengeStats,
  getLeaderboard,
} = require('../controllers/challenge.controller');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getChallenges);
router.get('/my/entries', protect, getMyChallenges);
router.get('/:id', getChallenge);
router.get('/:id/leaderboard', protect, getLeaderboard);
router.get('/:id/stats', protect, requireRole('COMPANY','ADMIN'), getChallengeStats);
router.get('/:id/entries', protect, requireRole('COMPANY','ADMIN'), getEntries);

// ── Student ───────────────────────────────────────────────────────────────────
router.post('/:id/enter', protect, enterChallenge);
router.post('/:id/submit', protect, submitSolution);

// ── Company & Admin ───────────────────────────────────────────────────────────
router.post('/', protect, requireRole('COMPANY','ADMIN'), createChallenge);
router.put('/:id', protect, requireRole('COMPANY','ADMIN'), updateChallenge);
router.put('/:id/entries/:entryId', protect, requireRole('COMPANY','ADMIN'), updateEntryStatus);

// ── Admin only ────────────────────────────────────────────────────────────────
router.delete('/:id', protect, requireRole('ADMIN'), deleteChallenge);

module.exports = router;