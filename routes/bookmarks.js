const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/bookmarks
router.get('/', requireApi, async (req, res) => {
  try {
    const bookmarks = await prisma.$queryRaw`
      SELECT b.*, w.name, w.profession, w.region, w.city, w.rating, w.availability_status,
             w.id as worker_id
      FROM bookmarks b JOIN workers w ON w.id = b.worker_id
      WHERE b.user_id = ${req.session.userId} ORDER BY b.created_at DESC
    `;
    res.json({ bookmarks });
  } catch (err) {
    console.error('Bookmarks error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/bookmarks/toggle
router.post('/toggle', requireApi, async (req, res) => {
  try {
    const { worker_id } = req.body;
    if (!worker_id) return res.status(400).json({ error: 'missingFields' });

    const existing = await prisma.bookmark.findFirst({
      where: { user_id: req.session.userId, worker_id: parseInt(worker_id) }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      res.json({ success: true, bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: { user_id: req.session.userId, worker_id: parseInt(worker_id) }
      });
      res.json({ success: true, bookmarked: true });
    }
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/bookmarks/check/:workerId
router.get('/check/:workerId', requireApi, async (req, res) => {
  try {
    const b = await prisma.bookmark.findFirst({
      where: { user_id: req.session.userId, worker_id: parseInt(req.params.workerId) }
    });
    res.json({ bookmarked: !!b });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
