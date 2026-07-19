const prisma = require('../config/db');

const userSelect = {
  id:true, name:true, username:true, avatar:true,
  university:true, role:true, isVerified:true,
};

// ── GET FEED ──────────────────────────────────────────────────────────────────
const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await prisma.feedPost.findMany({
      where: type && type !== 'ALL' ? { type } : {},
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: userSelect },
        comments: {
          include: { author: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
          take: 5,
        },
        _count: { select: { comments:true, feedLikes:true } },
      },
    });

    // Liked status
    let likedPostIds = [];
    if (req.user) {
      const likes = await prisma.feedLike.findMany({
        where: { userId: req.user.id, postId: { in: posts.map(p => p.id) } },
      });
      likedPostIds = likes.map(l => l.postId);
    }

    const postsWithLiked = posts.map(p => ({
      ...p,
      liked: likedPostIds.includes(p.id),
    }));

    res.json({ posts: postsWithLiked });
  } catch(err) { next(err); }
};

// ── CREATE POST ───────────────────────────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { content, type = 'UPDATE', image } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Andika maudhui ya post' });
    if (content.length < 10) return res.status(400).json({ error: 'Post ni fupi sana (min herufi 10)' });

    const post = await prisma.feedPost.create({
      data: {
        content: content.trim(),
        type,
        image: image || null,
        authorId: req.user.id,
      },
      include: {
        author: { select: userSelect },
        comments: { include: { author: { select: userSelect } } },
        _count: { select: { comments:true, feedLikes:true } },
      },
    });

    res.status(201).json({ post: { ...post, liked: false } });
  } catch(err) { next(err); }
};

// ── LIKE/UNLIKE ───────────────────────────────────────────────────────────────
const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const existing = await prisma.feedLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.feedLike.delete({ where: { postId_userId: { postId, userId } } });
      await prisma.feedPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } } });
      return res.json({ liked: false });
    }

    await prisma.feedLike.create({ data: { postId, userId } });
    const post = await prisma.feedPost.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
      select: { likes:true, authorId:true },
    });

    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'FEED_LIKE',
          message: `❤️ ${req.user.name} amependa post yako`,
          link: '/feed',
        },
      });
    }

    res.json({ liked: true, likes: post.likes });
  } catch(err) { next(err); }
};

// ── ADD COMMENT ───────────────────────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Andika maoni kwanza' });

    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { authorId:true },
    });
    if (!post) return res.status(404).json({ error: 'Post haipatikani' });

    const comment = await prisma.feedComment.create({
      data: { content: content.trim(), postId, authorId: req.user.id },
      include: { author: { select: userSelect } },
    });

    if (post.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'FEED_COMMENT',
          message: `💬 ${req.user.name} ameandika maoni kwenye post yako`,
          link: '/feed',
        },
      });
    }

    res.status(201).json({ comment });
  } catch(err) { next(err); }
};

// ── DELETE POST ───────────────────────────────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post haipatikani' });
    if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Huna ruhusa' });
    }
    await prisma.feedPost.delete({ where: { id: postId } });
    res.json({ message: 'Post imefutwa!' });
  } catch(err) { next(err); }
};

// ── GET COMMENTS ──────────────────────────────────────────────────────────────
const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await prisma.feedComment.findMany({
      where: { postId },
      include: { author: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ comments });
  } catch(err) { next(err); }
};

module.exports = { getFeed, createPost, toggleLike, addComment, deletePost, getComments };