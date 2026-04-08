const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', requireApi, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, phone, region, city, additional_info, user_type, language, instagram_username, telegram_username, created_at FROM users WHERE id = ?'
    ).get(req.session.userId);
    if (!user) return res.status(404).json({ error: 'notFound' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/users/profile
router.put('/profile', requireApi, (req, res) => {
  try {
    const { name, region, city, additional_info, instagram_username, telegram_username } = req.body;
    if (!name || !region || !city) return res.status(400).json({ error: 'missingFields' });
    db.prepare('UPDATE users SET name=?, region=?, city=?, additional_info=?, instagram_username=?, telegram_username=? WHERE id=?')
      .run(name, region, city, additional_info || '', instagram_username || null, telegram_username || null, req.session.userId);
    req.session.userName = name;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/users/language
router.put('/language', requireApi, (req, res) => {
  try {
    const { language } = req.body;
    if (!['uz','ru'].includes(language)) return res.status(400).json({ error: 'invalid' });
    db.prepare('UPDATE users SET language = ? WHERE id = ?').run(language, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
