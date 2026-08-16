const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const prisma = require('../config/db');

// Get user profile by username
router.get('/:username', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true, name: true, username: true, avatar: true,
        bio: true, university: true, country: true, role: true,
        createdAt: true,
        skills: { include: { skill: true } },
        projects: {
          where: { visibility: 'PUBLIC', status: 'PUBLISHED' },
          include: { tags: { include: { tag: true } }, ipCertificate: { select: { certificateId: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { projects: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Mtumiaji hapatikani' });
    res.json({ user });
  } catch (err) { next(err); }
});

// Update own profile
router.put('/me/profile', protect, async (req, res, next) => {
  try {
    const { name, bio, university, country, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, bio, university, country, avatar },
      select: { id: true, name: true, bio: true, university: true, country: true, avatar: true },
    });
    res.json({ message: 'Wasifu umesasishwa', user });
  } catch (err) { next(err); }
});

// Update profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, bio, university, country } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, bio, university, country },
      select: { id:true, name:true, username:true, bio:true, university:true, country:true, role:true },
    });
    res.json({ message: 'Profile imesasishwa!', user });
  } catch(err) { next(err); }
});

// Search users — LAZIMA iwe kabla ya /:username
router.get('/search', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: req.user.id },
      },
      select: {
        id: true, name: true, username: true,
        avatar: true, role: true, university: true, isVerified: true,
      },
      take: 10,
    });
    res.json({ users });
  } catch(err) { next(err); }
});

// Get user badges
router.get('/:username/badges', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: 'User hana account' });
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
    res.json({ badges });
  } catch(err) { next(err); }
});

// Get all mentors
router.get('/', async (req, res, next) => {
  try {
    const { skill, search, page=1, limit=12 } = req.query;
    const skip = (Number(page)-1) * Number(limit);

    const where = {
      role: 'MENTOR',
      ...(search && {
        OR: [
          { name: { contains: search, mode:'insensitive' } },
          { bio: { contains: search, mode:'insensitive' } },
          { university: { contains: search, mode:'insensitive' } },
        ],
      }),
      ...(skill && skill!=='All' && {
        skills: { some: { skill: { name: { contains: skill, mode:'insensitive' } } } },
      }),
    };

    const [mentors, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: Number(limit),
        select: {
          id:true, name:true, username:true, avatar:true,
          bio:true, university:true, country:true, role:true,
          isVerified:true, createdAt:true,
          skills: { include:{ skill:true } },
          projects: {
            where:{ status:'PUBLISHED' },
            select:{ id:true, title:true, views:true, likes:true },
            take: 3,
          },
          _count: { select:{ projects:true, collaborations:true, mentorships:true } },
        },
        orderBy: { createdAt:'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ mentors, total });
  } catch(err) { next(err); }
});

// Request mentorship
router.post('/:mentorId/request', protect, async (req, res, next) => {
  try {
    const { message } = req.body;
    const { mentorId } = req.params;

    if (mentorId === req.user.id) {
      return res.status(400).json({ error:'Huwezi kuomba mentorship yako mwenyewe' });
    }

    const mentor = await prisma.user.findUnique({ where:{ id:mentorId } });
    if (!mentor) return res.status(404).json({ error:'Mentor hapatikani' });

    const existing = await prisma.mentorship.findUnique({
      where:{ mentorId_menteeId:{ mentorId, menteeId:req.user.id } },
    });
    if (existing) return res.status(409).json({ error:'Umeshatuma ombi kwa mentor huyu' });

    const mentorship = await prisma.mentorship.create({
      data:{ mentorId, menteeId:req.user.id, message:message||null },
    });

    // Notify mentor
    await prisma.notification.create({
      data:{
        userId: mentorId,
        type: 'MENTORSHIP_REQUEST',
        message: `🤝 ${req.user.name} anaomba mentorship yako!`,
        link: '/mentors',
      },
    });

    res.status(201).json({ message:'Ombi limetumwa!', mentorship });
  } catch(err) {
    if (err.code==='P2002') return res.status(409).json({ error:'Umeshatuma ombi' });
    next(err);
  }
});

// Get my mentorship requests
router.get('/my/mentorships', protect, async (req, res, next) => {
  try {
    const mentorships = await prisma.mentorship.findMany({
      where: { menteeId: req.user.id },
      include: {
        mentor: {
          select:{ id:true, name:true, username:true, bio:true, university:true, country:true, skills:{ include:{ skill:true } } },
        },
      },
      orderBy: { createdAt:'desc' },
    });
    res.json({ mentorships });
  } catch(err) { next(err); }
});

// Accept/Decline mentorship (Mentor)
router.put('/mentorships/:id', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const mentorship = await prisma.mentorship.update({
      where:{ id:req.params.id },
      data:{ status },
      include:{
        mentee:{ select:{ id:true, name:true } },
        mentor:{ select:{ name:true } },
      },
    });

    // Notify mentee
    const msgs = {
      ACCEPTED: `✅ ${mentorship.mentor.name} amekubali ombi lako la mentorship!`,
      DECLINED: `❌ ${mentorship.mentor.name} amekataa ombi lako la mentorship.`,
    };
    if (msgs[status]) {
      await prisma.notification.create({
        data:{
          userId: mentorship.mentee.id,
          type: `MENTORSHIP_${status}`,
          message: msgs[status],
          link: '/mentors',
        },
      });
    }

    res.json({ message:'Imesasishwa!', mentorship });
  } catch(err) { next(err); }
});

module.exports = router;
