const prisma = require('../config/db');

// ─── Get university analytics ─────────────────────────────────────────────────
const getUniversityDashboard = async (req, res, next) => {
  try {
    const { universityName } = req.params;

    // Get all students from this university
    const students = await prisma.user.findMany({
      where: { university: { contains: universityName, mode: 'insensitive' }, role: 'STUDENT' },
      select: {
        id: true, name: true, username: true, avatar: true, createdAt: true,
        projects: {
          where: { status: 'PUBLISHED' },
          select: { id: true, title: true, views: true, likes: true, tags: true, createdAt: true, ipCertificate: { select: { id: true } } }
        },
        badges: { include: { badge: { select: { name: true, icon: true, tier: true } } } },
        _count: { select: { projects: true, collaborations: true } }
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get all projects from university
    const allProjects = students.flatMap(s => s.projects);

    // Analytics calculations
    const totalStudents   = students.length;
    const totalProjects   = allProjects.length;
    const totalViews      = allProjects.reduce((sum, p) => sum + p.views, 0);
    const totalLikes      = allProjects.reduce((sum, p) => sum + p.likes, 0);
    const totalIPCerts    = allProjects.filter(p => p.ipCertificate).length;

    // Top students by project count
    const topStudents = [...students]
      .sort((a, b) => b._count.projects - a._count.projects)
      .slice(0, 5);

    // Top projects by views
    const topProjects = [...allProjects]
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    // Category breakdown
    const categoryMap = {};
    allProjects.forEach(p => {
      p.tags?.forEach(t => {
        const name = t.tag?.name || t.name || 'Other';
        categoryMap[name] = (categoryMap[name] || 0) + 1;
      });
    });
    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly projects (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = allProjects.filter(p => {
        const d = new Date(p.createdAt);
        return d >= date && d < nextDate;
      }).length;
      monthlyData.push({
        month: date.toLocaleString('sw', { month: 'short' }),
        count,
      });
    }

    // Badge tally
    const allBadges = students.flatMap(s => s.badges);
    const totalBadges = allBadges.length;
    const platinumCount = allBadges.filter(b => b.badge?.tier === 'PLATINUM').length;

    res.json({
      university: universityName,
      analytics: {
        totalStudents, totalProjects, totalViews, totalLikes,
        totalIPCerts, totalBadges, platinumCount,
      },
      topStudents,
      topProjects,
      categories,
      monthlyData,
      allStudents: students,
    });
  } catch (err) { next(err); }
};

// ─── Get all universities ─────────────────────────────────────────────────────
const getUniversities = async (req, res, next) => {
  try {
    // Get distinct universities from users
    const result = await prisma.user.groupBy({
      by: ['university'],
      where: { university: { not: null }, role: 'STUDENT' },
      _count: { university: true },
      orderBy: { _count: { university: 'desc' } },
    });

    const universities = result
      .filter(r => r.university)
      .map(r => ({ name: r.university, studentCount: r._count.university }));

    res.json({ universities });
  } catch (err) { next(err); }
};

module.exports = { getUniversityDashboard, getUniversities };
