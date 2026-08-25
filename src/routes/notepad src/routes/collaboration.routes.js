const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const prisma = require('../config/db');

const userSelect = { id:true, name:true, username:true, avatar:true, university:true, role:true };

// Get all collaborations
router.get('/', async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const where = {
      ...(category && category !== 'All' && { category }),
      ...(status && { status }),
    };
    const collaborations = await prisma.collaboration.findMany({
      where,
      include: {
        leader: { select: userSelect },
        members: { include: { user: { select: userSelect } } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ collaborations });
  } catch(err) { next(err); }
});

// Get my collaborations
router.get('/mine', protect, async (req, res, next) => {
  try {
    const collaborations = await prisma.collaboration.findMany({
      where: {
        OR: [
          { leaderId: req.user.id },
          { members: { some: { userId: req.user.id, status: 'ACCEPTED' } } },
        ],
      },
      include: {
        leader: { select: userSelect },
        members: { include: { user: { select: userSelect } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ collaborations });
  } catch(err) { next(err); }
});

// Get my invitations
router.get('/invitations', protect, async (req, res, next) => {
  try {
    const invitations = await prisma.collaborationMember.findMany({
      where: { userId: req.user.id, status: 'PENDING' },
      include: {
        collaboration: {
          include: { leader: { select: userSelect } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
    res.json({ invitations });
  } catch(err) { next(err); }
});

// Create collaboration
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, category, deadline, maxMembers, rolesNeeded } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description and category are required' });
    }
    const collaboration = await prisma.collaboration.create({
      data: {
        title, description, category,
        deadline: deadline ? new Date(deadline) : null,
        maxMembers: maxMembers ? Number(maxMembers) : 5,
        leaderId: req.user.id,
        status: 'RECRUITING',
      },
      include: {
        leader: { select: userSelect },
        members: true,
      },
    });
    res.status(201).json({ message: 'Collaboration created!', collaboration });
  } catch(err) { next(err); }
});

// Update collaboration
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { title, description, category, deadline, maxMembers, status } = req.body;
    const collab = await prisma.collaboration.findUnique({ where: { id: req.params.id } });
    if (!collab) return res.status(404).json({ error: 'Collaboration not found' });
    if (collab.leaderId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const collaboration = await prisma.collaboration.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(maxMembers && { maxMembers: Number(maxMembers) }),
        ...(status && { status }),
      },
      include: {
        leader: { select: userSelect },
        members: { include: { user: { select: userSelect } } },
      },
    });
    res.json({ message: 'Collaboration updated!', collaboration });
  } catch(err) { next(err); }
});

// Delete collaboration
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const collab = await prisma.collaboration.findUnique({ where: { id: req.params.id } });
    if (!collab) return res.status(404).json({ error: 'Collaboration not found' });
    if (collab.leaderId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.collaboration.delete({ where: { id: req.params.id } });
    res.json({ message: 'Collaboration deleted!' });
  } catch(err) { next(err); }
});

// Join collaboration
router.post('/:id/join', protect, async (req, res, next) => {
  try {
    const collab = await prisma.collaboration.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { members: true } } },
    });
    if (!collab) return res.status(404).json({ error: 'Collaboration not found' });
    if (collab.leaderId === req.user.id) {
      return res.status(400).json({ error: 'You are the leader of this collaboration' });
    }
    const existing = await prisma.collaborationMember.findUnique({
      where: { collaborationId_userId: { collaborationId: req.params.id, userId: req.user.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already a member or request pending' });

    const member = await prisma.collaborationMember.create({
      data: {
        collaborationId: req.params.id,
        userId: req.user.id,
        status: 'PENDING',
      },
    });

    // Notify leader
    try {
      await prisma.notification.create({
        data: {
          userId: collab.leaderId,
          type: 'COLLABORATION',
          message: `🤝 ${req.user.name} wants to join your collaboration: "${collab.title}"`,
          link: '/collaborations',
        },
      });
    } catch(e) {}

    res.status(201).json({ message: 'Join request sent!', member });
  } catch(err) { next(err); }
});

// Accept/Reject member
router.put('/:id/members/:userId', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const collab = await prisma.collaboration.findUnique({ where: { id: req.params.id } });
    if (!collab) return res.status(404).json({ error: 'Collaboration not found' });
    if (collab.leaderId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const member = await prisma.collaborationMember.update({
      where: { collaborationId_userId: { collaborationId: req.params.id, userId: req.params.userId } },
      data: { status },
    });

    // Notify user
    try {
      await prisma.notification.create({
        data: {
          userId: req.params.userId,
          type: 'COLLABORATION',
          message: status === 'ACCEPTED'
            ? `✅ Your request to join "${collab.title}" has been accepted!`
            : `❌ Your request to join "${collab.title}" was declined.`,
          link: '/collaborations',
        },
      });
    } catch(e) {}

    res.json({ message: `Member ${status.toLowerCase()}!`, member });
  } catch(err) { next(err); }
});

module.exports = router;