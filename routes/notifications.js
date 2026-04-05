const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/notifications
router.get('/', requireApi, (req, res) => {
  try {
    const notifs = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.session.userId);
    const unread = db.prepare(
      'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.session.userId);
    res.json({ notifications: notifs, unread: unread.cnt });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireApi, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
