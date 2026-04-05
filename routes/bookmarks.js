const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/bookmarks
router.get('/', requireApi, (req, res) => {
  try {
    const bookmarks = db.prepare(`
      SELECT b.*, w.name, w.profession, w.region, w.city, w.rating, w.availability_status,
             w.id as worker_id
      FROM bookmarks b JOIN workers w ON w.id = b.worker_id
      WHERE b.user_id = ? ORDER BY b.created_at DESC
    `).all(req.session.userId);
    res.json({ bookmarks });
  } catch (err) {
    console.error('Bookmarks error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/bookmarks/toggle
router.post('/toggle', requireApi, (req, res) => {
  try {
    const { worker_id } = req.body;
    if (!worker_id) return res.status(400).json({ error: 'missingFields' });

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND worker_id = ?')
      .get(req.session.userId, worker_id);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      res.json({ success: true, bookmarked: false });
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, worker_id) VALUES (?, ?)').run(req.session.userId, worker_id);
      res.json({ success: true, bookmarked: true });
    }
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/bookmarks/check/:workerId
router.get('/check/:workerId', requireApi, (req, res) => {
  try {
    const b = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND worker_id = ?')
      .get(req.session.userId, req.params.workerId);
    res.json({ bookmarked: !!b });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
