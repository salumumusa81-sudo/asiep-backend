const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const prisma = require('../config/db');

// Get all mentors
router.get('/', async (req, res, next) => {
  try {
    const { skill } = req.query;
    const mentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR',
        ...(skill && skill !== 'All' && {
          skills: { some: { skill: { name: { contains: skill, mode: 'insensitive' } } } }
        }),
      },
      select: {
        id: true, name: true, username: true, avatar: true,
        bio: true, university: true, country: true, isVerified: true,
        skills: { include: { skill: true } },
        _count: { select: { mentorships: true, projects: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ mentors });
  } catch(err) { next(err); }
});

// Request mentorship
router.post('/:mentorId/request', protect, async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { message } = req.body;
    const menteeId = req.user.id;

    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const existing = await prisma.mentorship.findUnique({
      where: { mentorId_menteeId: { mentorId, menteeId } },
    });
    if (existing) return res.status(409).json({ error: 'Request already sent' });

    const mentorship = await prisma.mentorship.create({
      data: { mentorId, menteeId, message: message || null, status: 'PENDING' },
    });

    // Notify mentor
    try {
      await prisma.notification.create({
        data: {
          userId: mentorId,
          type: 'MENTORSHIP',
          message: `🤝 ${req.user.name} has requested mentorship from you!`,
          link: '/mentors',
        },
      });
    } catch(e) {}

    res.status(201).json({ message: 'Mentorship request sent!', mentorship });
  } catch(err) { next(err); }
});

// Get my mentorships
router.get('/mine', protect, async (req, res, next) => {
  try {
    const mentorships = await prisma.mentorship.findMany({
      where: { menteeId: req.user.id },
      include: {
        mentor: {
          select: {
            id: true, name: true, username: true, avatar: true,
            bio: true, university: true, country: true, isVerified: true,
            skills: { include: { skill: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ mentorships });
  } catch(err) { next(err); }
});

module.exports = router;