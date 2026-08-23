const prisma = require('../config/db');
const { addPoints } = require('./points.controller');

// ── GET THREADS ───────────────────────────────────────────────────────────────
const getThreads = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { filter = 'latest' } = req.query;

    const threads = await prisma.discussionThread.findMany({
      where: { challengeId },
      include: {
        author: { select: { id:true, name:true, username:true, university:true, role:true } },
        _count: { select: { replies:true, threadVotes:true } },
      },
      orderBy: filter === 'top'
        ? [{ isPinned:'desc' }, { upvotes:'desc' }]
        : [{ isPinned:'desc' }, { createdAt:'desc' }],
    });

    res.json({ threads });
  } catch(err) { next(err); }
};

// ── GET ONE THREAD ────────────────────────────────────────────────────────────
const getThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const userId = req.user?.id;

    // Increment views
    await prisma.discussionThread.update({
      where: { id: threadId },
      data: { views: { increment: 1 } },
    });

    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: {
        author: { select: { id:true, name:true, username:true, university:true, role:true } },
        replies: {
          include: {
            author: { select: { id:true, name:true, username:true, university:true, role:true } },
            _count: { select: { replyVotes:true } },
          },
          orderBy: [{ isAnswer:'desc' }, { upvotes:'desc' }, { createdAt:'asc' }],
        },
        _count: { select: { replies:true, threadVotes:true } },
      },
    });

    if (!thread) return res.status(404).json({ error: 'Thread haipatikani' });

    // Check kama user amevote
    let userVotedThread = false;
    let userVotedReplies = [];

    if (userId) {
      const threadVote = await prisma.threadVote.findUnique({
        where: { threadId_userId: { threadId, userId } },
      });
      userVotedThread = !!threadVote;

      const replyIds = thread.replies.map(r => r.id);
      if (replyIds.length > 0) {
        const votes = await prisma.replyVote.findMany({
          where: { replyId: { in: replyIds }, userId },
        });
        userVotedReplies = votes.map(v => v.replyId);
      }
    }

    res.json({ thread, userVotedThread, userVotedReplies });
  } catch(err) { next(err); }
};

// ── CREATE THREAD ─────────────────────────────────────────────────────────────
const createThread = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { title, content, isAnnouncement } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title is too long (max herufi 200)' });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id:true, title:true },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    // Announcement — Company/Admin tu
     {
      return res.status(403).json({ error: 'Announcement ni kwa Company au Admin tu' });
    }

    const thread = await prisma.discussionThread.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        challengeId,
        authorId: req.user.id,
        isAnnouncement: isAnnouncement && ['COMPANY','ADMIN'].includes(req.user.role),
      },
      include: {
        author: { select: { id:true, name:true, username:true, role:true } },
        _count: { select: { replies:true, threadVotes:true } },
      },
    });

    // Notify washiriki wa challenge
    const entries = await prisma.challengeEntry.findMany({
      where: { challengeId, userId: { not: req.user.id } },
      select: { userId:true },
      distinct: ['userId'],
    });

    if (entries.length > 0) {
      await prisma.notification.createMany({
        data: entries.map(e => ({
          userId: e.userId,
          type: isAnnouncement ? 'ANNOUNCEMENT' : 'DISCUSSION',
          message: isAnnouncement
            ? `📢 Tangazo jipya kwenye "${challenge.title}": ${title}`
            : `💬 Thread mpya kwenye "${challenge.title}": ${title}`,
          link: `/challenges/${challengeId}/discussion`,
        })),
        skipDuplicates: true,
      });
    }

    // Points
    try { await addPoints(req.user.id, 'COMMENT', `Ulianzisha thread: ${title}`); } catch(e) {}

    res.status(201).json({ message: 'Thread imeundwa!', thread });
  } catch(err) { next(err); }
};

// ── ADD REPLY ─────────────────────────────────────────────────────────────────
const addReply = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Andika jibu kwanza' });
    if (content.length > 5000) return res.status(400).json({ error: 'Jibu ni refu sana' });

    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: { challenge: { select: { title:true } } },
    });
    if (!thread) return res.status(404).json({ error: 'Thread haipatikani' });
    if (thread.isLocked) return res.status(403).json({ error: 'Thread imefungwa — haiwezi kujibiwa' });

    const reply = await prisma.discussionReply.create({
      data: {
        content: content.trim(),
        threadId,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id:true, name:true, username:true, university:true, role:true } },
        _count: { select: { replyVotes:true } },
      },
    });

    // Notify thread author
    if (thread.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: thread.authorId,
          type: 'DISCUSSION_REPLY',
          message: `💬 ${req.user.name} amejibu thread yako: "${thread.title}"`,
          link: `/challenges/${thread.challengeId}/discussion/${threadId}`,
        },
      });
    }

    // Points
    try { await addPoints(req.user.id, 'COMMENT', `Ulijibu thread: ${thread.title}`); } catch(e) {}

    res.status(201).json({ message: 'Jibu limeongezwa!', reply });
  } catch(err) { next(err); }
};

// ── VOTE THREAD ───────────────────────────────────────────────────────────────
const voteThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const existing = await prisma.threadVote.findUnique({
      where: { threadId_userId: { threadId, userId } },
    });

    if (existing) {
      // Unlike
      await prisma.threadVote.delete({ where: { id: existing.id } });
      await prisma.discussionThread.update({
        where: { id: threadId },
        data: { upvotes: { decrement: 1 } },
      });
      return res.json({ message: 'Vote imeondolewa', voted: false });
    }

    // Vote
    await prisma.threadVote.create({ data: { threadId, userId } });
    const thread = await prisma.discussionThread.update({
      where: { id: threadId },
      data: { upvotes: { increment: 1 } },
      select: { upvotes:true, authorId:true, title:true },
    });

    // Notify author
    if (thread.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: thread.authorId,
          type: 'DISCUSSION_VOTE',
          message: `👍 ${req.user.name} amependa thread yako: "${thread.title}"`,
          link: `/challenges/${req.params.challengeId}/discussion/${threadId}`,
        },
      });
    }

    res.json({ message: 'Umevote!', voted: true, upvotes: thread.upvotes });
  } catch(err) { next(err); }
};

// ── VOTE REPLY ────────────────────────────────────────────────────────────────
const voteReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    const existing = await prisma.replyVote.findUnique({
      where: { replyId_userId: { replyId, userId } },
    });

    if (existing) {
      await prisma.replyVote.delete({ where: { id: existing.id } });
      await prisma.discussionReply.update({
        where: { id: replyId },
        data: { upvotes: { decrement: 1 } },
      });
      return res.json({ message: 'Vote imeondolewa', voted: false });
    }

    await prisma.replyVote.create({ data: { replyId, userId } });
    const reply = await prisma.discussionReply.update({
      where: { id: replyId },
      data: { upvotes: { increment: 1 } },
      select: { upvotes:true },
    });

    res.json({ message: 'Umevote!', voted: true, upvotes: reply.upvotes });
  } catch(err) { next(err); }
};

// ── MARK AS ANSWER ────────────────────────────────────────────────────────────
const markAsAnswer = async (req, res, next) => {
  try {
    const { threadId, replyId } = req.params;

    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      select: { authorId:true },
    });

    if (!thread) return res.status(404).json({ error: 'Thread haipatikani' });
    if (thread.authorId !== req.user.id && !['ADMIN','COMPANY'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Huna ruhusa ya kuchagua jibu' });
    }

    // Unmark previous answer
    await prisma.discussionReply.updateMany({
      where: { threadId, isAnswer: true },
      data: { isAnswer: false },
    });

    const reply = await prisma.discussionReply.update({
      where: { id: replyId },
      data: { isAnswer: true },
      include: { author: { select: { id:true, name:true } } },
    });

    // Notify reply author
    if (reply.author.id !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: reply.author.id,
          type: 'DISCUSSION_ANSWER',
          message: `✅ Jibu lako limechaguliwa kama jibu sahihi!`,
          link: `/challenges/${req.params.challengeId}/discussion/${threadId}`,
        },
      });
    }

    res.json({ message: 'Jibu limechaguliwa!', reply });
  } catch(err) { next(err); }
};

// ── PIN THREAD (Admin/Company) ────────────────────────────────────────────────
const pinThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) return res.status(404).json({ error: 'Thread haipatikani' });

    const updated = await prisma.discussionThread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
    });

    res.json({ message: updated.isPinned ? '📌 Thread imepinned!' : 'Thread imepin-removed', thread: updated });
  } catch(err) { next(err); }
};

// ── LOCK THREAD (Admin/Company) ───────────────────────────────────────────────
const lockThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) return res.status(404).json({ error: 'Thread haipatikani' });

    const updated = await prisma.discussionThread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked },
    });

    res.json({ message: updated.isLocked ? '🔒 Thread imefungwa!' : '🔓 Thread imefunguliwa', thread: updated });
  } catch(err) { next(err); }
};

// ── DELETE THREAD ─────────────────────────────────────────────────────────────
const deleteThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) return res.status(404).json({ error: 'Thread haipatikani' });

    if (thread.authorId !== req.user.id && !['ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Huna ruhusa ya kufuta thread hii' });
    }

    await prisma.discussionThread.delete({ where: { id: threadId } });
    res.json({ message: 'Thread imefutwa!' });
  } catch(err) { next(err); }
};

// ── DELETE REPLY ──────────────────────────────────────────────────────────────
const deleteReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
    if (!reply) return res.status(404).json({ error: 'Jibu halipatikani' });

    if (reply.authorId !== req.user.id && !['ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Huna ruhusa ya kufuta jibu hili' });
    }

    await prisma.discussionReply.delete({ where: { id: replyId } });
    res.json({ message: 'Jibu limefutwa!' });
  } catch(err) { next(err); }
};

module.exports = {
  getThreads, getThread, createThread, addReply,
  voteThread, voteReply, markAsAnswer, pinThread,
  lockThread, deleteThread, deleteReply,
};