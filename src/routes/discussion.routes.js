const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getThreads, getThread, createThread, addReply,
  voteThread, voteReply, markAsAnswer, pinThread,
  lockThread, deleteThread, deleteReply,
} = require('../controllers/discussion.controller');

// Threads
router.get('/challenges/:challengeId/threads', protect, getThreads);
router.post('/challenges/:challengeId/threads', protect, createThread);
router.get('/threads/:threadId', protect, getThread);
router.delete('/threads/:threadId', protect, deleteThread);

// Replies
router.post('/threads/:threadId/replies', protect, addReply);
router.delete('/replies/:replyId', protect, deleteReply);

// Votes
router.post('/threads/:threadId/vote', protect, voteThread);
router.post('/replies/:replyId/vote', protect, voteReply);

// Actions
router.put('/threads/:threadId/replies/:replyId/answer', protect, markAsAnswer);
router.put('/threads/:threadId/pin', protect, requireRole('COMPANY','ADMIN'), pinThread);
router.put('/threads/:threadId/lock', protect, requireRole('COMPANY','ADMIN'), lockThread);

module.exports = router;