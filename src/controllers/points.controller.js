const prisma = require('../config/db');

// ── Level calculator ──────────────────────────────────────────────────────────
const getLevel = (points) => {
  if (points >= 10000) return 'Legend';
  if (points >= 5000) return 'Champion';
  if (points >= 2000) return 'Pioneer';
  if (points >= 500) return 'Innovator';
  return 'Beginner';
};

// ── Points values ─────────────────────────────────────────────────────────────
const POINTS = {
  PROJECT_UPLOAD: 100,
  PROJECT_LIKE: 5,
  PROJECT_VIEW: 1,
  CHALLENGE_JOIN: 50,
  CHALLENGE_SUBMIT: 150,
  CHALLENGE_SHORTLISTED: 300,
  CHALLENGE_WIN: 500,
  GRANT_APPLY: 30,
  GRANT_APPROVED: 200,
  MENTOR_REQUEST: 20,
  MENTOR_ACCEPTED: 100,
  BADGE_EARNED: 75,
  DAILY_LOGIN: 10,
  DATASET_UPLOAD: 120,
  COMMENT: 5,
};

// ── Add points to user ────────────────────────────────────────────────────────
const addPoints = async (userId, action, description) => {
  const pts = POINTS[action] || 0;
  if (!pts) return null;

  // Get or create UserPoints
  let userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    userPoints = await prisma.userPoints.create({
      data: { userId, points: 0, level: 'Beginner', streak: 0 },
    });
  }

  const newPoints = userPoints.points + pts;
  const newLevel = getLevel(newPoints);
  const levelUp = newLevel !== userPoints.level;

  // Update points
  userPoints = await prisma.userPoints.update({
    where: { userId },
    data: {
      points: newPoints,
      level: newLevel,
      history: {
        create: {
          points: pts,
          action,
          description,
        },
      },
    },
    include: { history: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

  // Notify level up
  if (levelUp) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'LEVEL_UP',
        message: `🎉 Hongera! Umepanda level — Uko ${newLevel} sasa! (${newPoints.toLocaleString()} pts)`,
        link: '/profile',
      },
    });
  }

  return { userPoints, levelUp, newLevel, ptsEarned: pts };
};

// ── GET my points ─────────────────────────────────────────────────────────────
const getMyPoints = async (req, res, next) => {
  try {
    let userPoints = await prisma.userPoints.findUnique({
      where: { userId: req.user.id },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!userPoints) {
      userPoints = await prisma.userPoints.create({
        data: { userId: req.user.id, points: 0, level: 'Beginner', streak: 0 },
        include: { history: true },
      });
    }

    res.json({ userPoints });
  } catch(err) { next(err); }
};

// ── GET platform leaderboard ──────────────────────────────────────────────────
const getPlatformLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await prisma.userPoints.findMany({
      orderBy: { points: 'desc' },
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            university: true,
            country: true,
            role: true,
          },
        },
      },
    });

    const ranked = leaderboard.map((entry, i) => ({
      rank: i + 1,
      userId: entry.userId,
      name: entry.user.name,
      username: entry.user.username,
      university: entry.user.university,
      country: entry.user.country,
      points: entry.points,
      level: entry.level,
      streak: entry.streak,
    }));

    res.json({ leaderboard: ranked });
  } catch(err) { next(err); }
};

// ── Daily login streak ────────────────────────────────────────────────────────
const dailyLogin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = await prisma.userPoints.create({
        data: { userId, points: 0, level: 'Beginner', streak: 0 },
      });
    }

    const now = new Date();
    const lastLogin = new Date(userPoints.lastLogin);
    const diffHours = (now - lastLogin) / (1000 * 60 * 60);

    // Already logged in today
    if (diffHours < 24) {
      return res.json({ message: 'Tayari umeingia leo', userPoints, earned: false });
    }

    // Streak continues or resets
    const streak = diffHours < 48 ? userPoints.streak + 1 : 1;
    const bonusPoints = streak >= 7 ? 20 : 10; // Bonus kwa streak ya wiki

    const newPoints = userPoints.points + bonusPoints;
    const newLevel = getLevel(newPoints);

    userPoints = await prisma.userPoints.update({
      where: { userId },
      data: {
        points: newPoints,
        level: newLevel,
        streak,
        lastLogin: now,
        history: {
          create: {
            points: bonusPoints,
            action: 'DAILY_LOGIN',
            description: `🔥 Daily login streak — Siku ${streak}! +${bonusPoints} pts`,
          },
        },
      },
    });

    res.json({
      message: `🔥 Streak ya siku ${streak}! +${bonusPoints} pts`,
      userPoints,
      earned: true,
      streak,
      ptsEarned: bonusPoints,
    });
  } catch(err) { next(err); }
};

module.exports = { getMyPoints, getPlatformLeaderboard, dailyLogin, addPoints };