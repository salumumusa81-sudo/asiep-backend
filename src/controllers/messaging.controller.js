const prisma = require('../config/db');

// ── GET MY CONVERSATIONS ──────────────────────────────────────────────────────
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id:true, name:true, username:true, role:true, university:true, isVerified:true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Add unread count for each conversation
    const convsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find(p => p.userId === userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
            createdAt: { gt: participant?.lastReadAt || new Date(0) },
          },
        });

        const otherParticipant = conv.participants.find(p => p.userId !== userId);

        return {
          ...conv,
          unreadCount,
          otherUser: otherParticipant?.user,
          lastMessage: conv.messages[0] || null,
        };
      })
    );

    res.json({ conversations: convsWithUnread });
  } catch(err) { next(err); }
};

// ── GET OR CREATE CONVERSATION ────────────────────────────────────────────────
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params;
    const myId = req.user.id;

    if (otherUserId === myId) {
      return res.status(400).json({ error: 'Huwezi kujitumia message' });
    }

    // Check kama mtumiaji mwingine yupo
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id:true, name:true, username:true, role:true, university:true, isVerified:true },
    });
    if (!otherUser) return res.status(404).json({ error: 'Mtumiaji hapatikani' });

    // Check kama conversation tayari ipo
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: myId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id:true, name:true, username:true, role:true, university:true, isVerified:true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id:true, name:true, username:true } },
          },
        },
      },
    });

    if (existing) {
      return res.json({ conversation: existing, otherUser, isNew: false });
    }

    // Unda conversation mpya
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: myId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id:true, name:true, username:true, role:true, university:true, isVerified:true } },
          },
        },
        messages: true,
      },
    });

    res.json({ conversation, otherUser, isNew: true });
  } catch(err) { next(err); }
};

// ── GET MESSAGES ──────────────────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) return res.status(403).json({ error: 'Huna ruhusa ya kuona mazungumzo haya' });

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id:true, name:true, username:true, role:true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update lastReadAt
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    res.json({ messages, total, page: Number(page) });
  } catch(err) { next(err); }
};

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'TEXT' } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) return res.status(400).json({ error: 'Andika ujumbe kwanza' });
    if (content.length > 5000) return res.status(400).json({ error: 'Ujumbe ni mrefu sana' });

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) return res.status(403).json({ error: 'Huna ruhusa' });

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        conversationId,
        senderId: userId,
      },
      include: {
        sender: { select: { id:true, name:true, username:true, role:true } },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify other participant
    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: userId } },
      include: { user: { select: { id:true, name:true } } },
    });

    if (otherParticipant) {
      await prisma.notification.create({
        data: {
          userId: otherParticipant.userId,
          type: 'MESSAGE',
          message: `✉️ ${req.user.name}: ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
          link: `/messages`,
        },
      });
    }

    res.status(201).json({ message });
  } catch(err) { next(err); }
};

// ── DELETE MESSAGE ────────────────────────────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== userId) return res.status(403).json({ error: 'Not authorized to delete this message' });

    // Soft delete — replace content
    await prisma.message.update({
      where: { id: messageId },
      data: { content: '🗑 Message deleted', type: 'SYSTEM' },
    });

    res.json({ message: 'Message deleted!' });
  } catch(err) { next(err); }
};

// ── SEARCH USERS TO MESSAGE ───────────────────────────────────────────────────
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) return res.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { university: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id:true, name:true, username:true,
        role:true, university:true, isVerified:true,
      },
      take: 10,
    });

    res.json({ users });
  } catch(err) { next(err); }
};

// ── GET UNREAD COUNT ──────────────────────────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId:true, lastReadAt:true },
    });

    let total = 0;
    for (const conv of conversations) {
      const count = await prisma.message.count({
        where: {
          conversationId: conv.conversationId,
          senderId: { not: userId },
          isRead: false,
          createdAt: { gt: conv.lastReadAt },
        },
      });
      total += count;
    }

    res.json({ unreadCount: total });
  } catch(err) { next(err); }
};

module.exports = {
  getConversations, getOrCreateConversation, getMessages,
  sendMessage, deleteMessage, searchUsers, getUnreadCount,
};