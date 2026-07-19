const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, username, university, country, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword,
        username, university, country,
        role: role || 'STUDENT',
      },
      select: { id: true, name: true, email: true, username: true, role: true },
    });

    // Points za kwanza kwa registration
    try {
      await prisma.userPoints.create({
        data: {
          userId: user.id,
          points: 10,
          level: 'Beginner',
          streak: 1,
          lastLogin: new Date(),
          history: {
            create: { points: 10, action: 'DAILY_LOGIN', description: '🎉 Karibu ASIEP! Login ya kwanza.' },
          },
        },
      });
    } catch(e) {}

    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      message: 'Umesajiliwa vizuri! Karibu ASIEP.',
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) { next(err); }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Barua pepe au nenosiri si sahihi' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Barua pepe au nenosiri si sahihi' });

    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    // ── Daily login points ──
    try {
      const userPts = await prisma.userPoints.findUnique({ where: { userId: user.id } });
      if (!userPts) {
        await prisma.userPoints.create({
          data: {
            userId: user.id, points: 10, level: 'Beginner', streak: 1, lastLogin: new Date(),
            history: { create: { points: 10, action: 'DAILY_LOGIN', description: '🎉 Login ya kwanza!' } },
          },
        });
      } else {
        const diffHours = (new Date() - new Date(userPts.lastLogin)) / (1000 * 60 * 60);
        if (diffHours >= 24) {
          const streak = diffHours < 48 ? userPts.streak + 1 : 1;
          const bonus = streak >= 7 ? 20 : 10;
          const newPoints = userPts.points + bonus;
          const newLevel = newPoints>=10000?'Legend':newPoints>=5000?'Champion':newPoints>=2000?'Pioneer':newPoints>=500?'Innovator':'Beginner';
          await prisma.userPoints.update({
            where: { userId: user.id },
            data: {
              points: newPoints,
              level: newLevel,
              streak,
              lastLogin: new Date(),
              history: {
                create: { points: bonus, action: 'DAILY_LOGIN', description: `🔥 Streak ya siku ${streak}! +${bonus}pts` },
              },
            },
          });
        }
      }
    } catch(e) {}

    res.json({
      message: 'Umeingia vizuri!',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (err) { next(err); }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Refresh token inahitajika' });

    const decoded = verifyRefreshToken(token);
    const accessToken = generateAccessToken(decoded.userId);

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token batili' });
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, username: true,
        avatar: true, bio: true, university: true, country: true,
        role: true, isVerified: true, createdAt: true,
        skills: { include: { skill: true } },
        _count: { select: { projects: true, collaborations: true } },
      },
    });
    res.json({ user });
  } catch (err) { next(err); }
};

module.exports = { register, login, refreshToken, getMe };