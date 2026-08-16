const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getFeed, createPost, toggleLike, addComment } = require('../controllers/feed.controller');
const { getFeed, createPost, toggleLike, addComment, deletePost } = require('../controllers/feed.controller');

router.get('/',                    protect, getFeed);
router.post('/',                   protect, createPost);
router.post('/:postId/like',       protect, toggleLike);
router.post('/:postId/comment',    protect, addComment);
router.delete('/:postId', protect, deletePost);

module.exports = router;