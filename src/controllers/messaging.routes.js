const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getConversations, getOrCreateConversation, getMessages,
  sendMessage, deleteMessage, searchUsers, getUnreadCount,
} = require('../controllers/messaging.controller');

router.get('/conversations', protect, getConversations);
router.get('/conversations/:userId', protect, getOrCreateConversation);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages/:conversationId', protect, sendMessage);
router.delete('/messages/:messageId', protect, deleteMessage);
router.get('/search', protect, searchUsers);
router.get('/unread', protect, getUnreadCount);

module.exports = router;