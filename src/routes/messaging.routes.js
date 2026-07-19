const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  searchUsers,
  getUnreadCount,
} = require('../controllers/messaging.controller');

// ── Specific routes KWANZA ────────────────────────────────────────────────────
router.get('/search',        protect, searchUsers);
router.get('/unread',        protect, getUnreadCount);
router.get('/conversations', protect, getConversations);

// ── Dynamic routes BAADAYE ────────────────────────────────────────────────────
router.get('/conversations/:userId',       protect, getOrCreateConversation);
router.get('/messages/:conversationId',    protect, getMessages);
router.post('/messages/:conversationId',   protect, sendMessage);
router.delete('/messages/:messageId',      protect, deleteMessage);

module.exports = router;