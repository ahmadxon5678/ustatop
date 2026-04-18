const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/notifications
router.get('/', requireApi, async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { user_id: req.session.userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    const unread = await prisma.notification.count({
      where: { user_id: req.session.userId, is_read: false }
    });
    res.json({ notifications: notifs, unread });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireApi, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.session.userId },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
