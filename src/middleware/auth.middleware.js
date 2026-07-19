const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Hakuna token — tafadhali ingia kwanza' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isVerified: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Mtumiaji hapatikani' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token batili au imeisha muda' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Huna ruhusa ya kufanya hivi' });
    }
    next();
  };
};

module.exports = { protect, requireRole };
