const prisma = require('../config/db');
const { checkAndAwardBadges, BADGE_DEFINITIONS } = require('../utils/badges');

// Get all badges (with user's earned status)
const getAllBadges = async (req, res, next) => {
  try {
    const badges = await prisma.badge.findMany({ orderBy: [{ category:'asc' }, { tier:'asc' }] });

    let earnedIds = [];
    if (req.user) {
      const userBadges = await prisma.userBadge.findMany({ where: { userId: req.user.id } });
      earnedIds = userBadges.map(ub => ub.badgeId);
    }

    const badgesWithStatus = badges.map(b => ({
      ...b,
      earned: earnedIds.includes(b.id),
    }));

    res.json({ badges: badgesWithStatus });
  } catch (err) { next(err); }
};

// Get user's earned badges
const getUserBadges = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
    res.json({ badges: userBadges });
  } catch (err) { next(err); }
};

// Check and award badges for current user
const checkBadges = async (req, res, next) => {
  try {
    const newBadges = await checkAndAwardBadges(req.user.id);
    res.json({ newBadges, count: newBadges.length });
  } catch (err) { next(err); }
};

module.exports = { getAllBadges, getUserBadges, checkBadges };
