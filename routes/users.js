const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', requireApi, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.session.userId },
      select: {
        id: true, name: true, phone: true, region: true, city: true,
        additional_info: true, user_type: true, language: true,
        instagram_username: true, telegram_username: true, created_at: true
      }
    });
    if (!user) return res.status(404).json({ error: 'notFound' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/users/profile
router.put('/profile', requireApi, async (req, res) => {
  try {
    const { name, region, city, additional_info, instagram_username, telegram_username } = req.body;
    if (!name || !region || !city) return res.status(400).json({ error: 'missingFields' });
    await prisma.user.update({
      where: { id: req.session.userId },
      data: {
        name, region, city,
        additional_info: additional_info || '',
        instagram_username: instagram_username || null,
        telegram_username: telegram_username || null
      }
    });
    req.session.userName = name;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/users/language
router.put('/language', requireApi, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['uz', 'ru'].includes(language)) return res.status(400).json({ error: 'invalid' });
    await prisma.user.update({ where: { id: req.session.userId }, data: { language } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
