const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const prisma = require('../config/db');

// Get all notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications, unread: notifications.filter(n=>!n.isRead).length });
  } catch(err) { next(err); }
});

// Mark one as read
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ message: 'Imesomwa' });
  } catch(err) { next(err); }
});

// Mark ALL as read
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Zote zimesomwa!' });
  } catch(err) { next(err); }
});

// Delete one
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: 'Imefutwa' });
  } catch(err) { next(err); }
});

module.exports = router;