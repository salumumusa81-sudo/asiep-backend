const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const prisma = require('../config/db');

router.use(protect, requireRole('ADMIN'));

// Stats
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date(new Date().setHours(0,0,0,0));
    const [totalUsers, todayUsers, totalProjects, todayProjects, totalStartups,
           totalGrants, totalApplications, totalBadges, todayBadges, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.project.count(),
      prisma.project.count({ where: { createdAt: { gte: today } } }),
      prisma.startup.count(),
      prisma.sponsorGrant.count(),
      prisma.grantApplication.count(),
      prisma.userBadge.count(),
      prisma.userBadge.count({ where: { earnedAt: { gte: today } } }),
      prisma.user.groupBy({ by:['role'], _count:{ role:true } }),
    ]);

    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await prisma.user.count({ where: { createdAt: { gte: start, lt: end } } });
      monthly.push({ month: start.toLocaleString('sw', { month: 'short' }), users: count });
    }

    const recentUsers = await prisma.user.findMany({
      take: 8, orderBy: { createdAt: 'desc' },
      select: { id:true, name:true, email:true, role:true, university:true, country:true, createdAt:true, isVerified:true },
    });

    res.json({
      stats: {
        users: { total: totalUsers, today: todayUsers },
        projects: { total: totalProjects, today: todayProjects },
        startups: { total: totalStartups },
        grants: { total: totalGrants, applications: totalApplications },
        badges: { total: totalBadges, today: todayBadges },
      },
      usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.role })),
      monthly,
      recentUsers,
    });
  } catch(err) { next(err); }
});

// Get users
router.get('/users', async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page)-1) * Number(limit);
    const where = {
      ...(role && role !== 'ALL' && { role }),
      ...(search && { OR: [
        { name: { contains: search, mode:'insensitive' } },
        { email: { contains: search, mode:'insensitive' } },
      ]}),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt:'desc' },
        select: { id:true, name:true, email:true, username:true, role:true,
          university:true, country:true, isVerified:true, createdAt:true,
          _count: { select: { projects:true, badges:true } } },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total });
  } catch(err) { next(err); }
});

// Update user
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, isVerified } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(role && { role }), ...(typeof isVerified==='boolean' && { isVerified }) },
    });
    res.json({ message: 'User imesasishwa!', user });
  } catch(err) { next(err); }
});

// Delete user
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Huwezi kujifuta!' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User amefutwa!' });
  } catch(err) { next(err); }
});

// Get projects
router.get('/projects', async (req, res, next) => {
  try {
    const { status, search, page=1, limit=20 } = req.query;
    const skip = (Number(page)-1) * Number(limit);
    const where = {
      ...(status && status!=='ALL' && { status }),
      ...(search && { title: { contains: search, mode:'insensitive' } }),
    };
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt:'desc' },
        include: {
          author: { select: { name:true, university:true } },
          tags: { include: { tag:true } },
          ipCertificate: { select: { id:true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    res.json({ projects, total });
  } catch(err) { next(err); }
});

// Update project
router.put('/projects/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ message: 'Mradi umesasishwa!', project });
  } catch(err) { next(err); }
});

// Delete project
router.delete('/projects/:id', async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Mradi umefutwa!' });
  } catch(err) { next(err); }
});

// Broadcast notification
router.post('/broadcast', async (req, res, next) => {
  try {
    const { message, type='SYSTEM', roles } = req.body;
    if (!message) return res.status(400).json({ error: 'Ujumbe unahitajika' });
    const where = roles?.length ? { role: { in: roles } } : {};
    const users = await prisma.user.findMany({ where, select: { id:true } });
    await prisma.notification.createMany({
      data: users.map(u => ({ userId:u.id, type, message, link:'/notifications' })),
    });
    res.json({ message:`Imetumwa kwa ${users.length} watumiaji!`, count: users.length });
  } catch(err) { next(err); }
});

// Activity log
router.get('/activity', async (req, res, next) => {
  try {
    const [recentProjects, recentUsers, recentBadges] = await Promise.all([
      prisma.project.findMany({ take:5, orderBy:{ createdAt:'desc' }, include:{ author:{ select:{ name:true } } } }),
      prisma.user.findMany({ take:5, orderBy:{ createdAt:'desc' }, select:{ name:true, role:true, createdAt:true } }),
      prisma.userBadge.findMany({ take:5, orderBy:{ earnedAt:'desc' }, include:{ user:{ select:{ name:true } }, badge:{ select:{ name:true, icon:true } } } }),
    ]);
    const activity = [
      ...recentProjects.map(p => ({ icon:'💡', msg:`Mradi mpya: "${p.title}" — ${p.author?.name}`, time: p.createdAt })),
      ...recentUsers.map(u => ({ icon:'👤', msg:`Mtumiaji mpya: ${u.name} (${u.role})`, time: u.createdAt })),
      ...recentBadges.map(b => ({ icon:'🏅', msg:`Badge "${b.badge?.icon}${b.badge?.name}" → ${b.user?.name}`, time: b.earnedAt })),
    ].sort((a,b) => new Date(b.time)-new Date(a.time)).slice(0,15);
    res.json({ activity });
  } catch(err) { next(err); }
});

module.exports = router;
