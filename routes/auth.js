const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { getCorrectDashboard } = require('../middleware/auth');

const SALT_ROUNDS = 10;
const PASSWORD_REGEX = /^[a-zA-Z0-9]{6,}$/;

function setSession(req, user, worker, shop) {
  req.session.userId = user.id;
  req.session.userType = user.user_type;
  req.session.userName = user.name;
  req.session.workerApproved = worker ? worker.approved : false;
  req.session.shopApproved = shop ? shop.approved : false;
  req.session.isAdmin = false;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, region, city, additional_info, user_type,
            profession, experience, description, telegram, instagram,
            shop_name, owner_name, product_types,
            instagram_username, telegram_username,
            password } = req.body;

    if (!name || !phone || !region || !city || !user_type) {
      return res.status(400).json({ error: 'missingFields' });
    }
    if (!/^\+998\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'phoneError' });
    }
    if (!password || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ error: 'passwordInvalid' });
    }

    const existing = await prisma.user.findFirst({ where: { phone } });
    if (existing) return res.status(400).json({ error: 'phoneTaken' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name, phone, password: hashedPassword, region, city,
        additional_info: additional_info || '',
        user_type,
        instagram_username: instagram_username || null,
        telegram_username: telegram_username || null
      }
    });
    const userId = user.id;

    let worker = null, shop = null;

    if (user_type === 'worker') {
      if (!profession || !experience || !description) {
        return res.status(400).json({ error: 'missingFields' });
      }
      worker = await prisma.worker.create({
        data: {
          user_id: userId, name, profession, experience, description,
          region, city, phone, telegram: telegram || '', instagram: instagram || '',
          approved: false
        }
      });
      await prisma.workerSubmission.create({
        data: {
          user_id: userId, name, profession, region, city,
          experience, description, phone,
          telegram: telegram || '', instagram: instagram || ''
        }
      });
    }

    if (user_type === 'shop') {
      if (!shop_name || !owner_name) {
        return res.status(400).json({ error: 'missingFields' });
      }
      const ptStr = Array.isArray(product_types) ? product_types.join(',') : (product_types || '');
      shop = await prisma.shop.create({
        data: {
          user_id: userId, shop_name, owner_name, phone,
          telegram: telegram || '', instagram: instagram || '',
          region, city, description: description || '',
          product_types: ptStr, approved: false
        }
      });
      await prisma.shopSubmission.create({
        data: {
          user_id: userId, shop_name, owner_name, phone,
          telegram: telegram || '', instagram: instagram || '',
          region, city, description: description || '',
          product_types: ptStr
        }
      });
    }

    setSession(req, user, worker, shop);

    res.json({
      success: true,
      userType: user_type,
      workerApproved: req.session.workerApproved,
      shopApproved: req.session.shopApproved
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) return res.status(400).json({ error: 'phoneError' });
    if (!password) return res.status(400).json({ error: 'passwordRequired' });

    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return res.status(404).json({ error: 'phoneNotFound' });
    if (user.status === 'banned') return res.status(403).json({ error: 'banned' });

    // Users registered before the password system have empty password — let them in without check
    if (user.password && user.password !== '') {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'wrongPassword' });
    }

    const worker = user.user_type === 'worker'
      ? await prisma.worker.findFirst({ where: { user_id: user.id } }) : null;
    const shop = user.user_type === 'shop'
      ? await prisma.shop.findFirst({ where: { user_id: user.id } }) : null;

    setSession(req, user, worker, shop);

    if (user.user_type === 'worker' && worker) {
      await prisma.worker.update({
        where: { id: worker.id },
        data: { last_seen: new Date() }
      });
    }

    res.json({
      success: true,
      userType: user.user_type,
      workerApproved: req.session.workerApproved,
      shopApproved: req.session.shopApproved
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/auth/admin
router.post('/admin', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'missingFields' });
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'wrongPassword' });
    }
    req.session.isAdmin = true;
    req.session.userId = null;
    req.session.userType = 'admin';
    res.json({ success: true });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// GET /api/auth/status
router.get('/status', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ loggedIn: false });
  }
  try {
    const user = await prisma.user.findFirst({ where: { id: req.session.userId } });
    if (!user) { req.session.destroy(() => {}); return res.json({ loggedIn: false }); }

    const worker = user.user_type === 'worker'
      ? await prisma.worker.findFirst({ where: { user_id: user.id } }) : null;
    const shop = user.user_type === 'shop'
      ? await prisma.shop.findFirst({ where: { user_id: user.id } }) : null;

    const workerSub = user.user_type === 'worker'
      ? await prisma.workerSubmission.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
          select: { status: true }
        }) : null;
    const shopSub = user.user_type === 'shop'
      ? await prisma.shopSubmission.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
          select: { status: true }
        }) : null;

    const workerRejected = !!(workerSub && workerSub.status === 'rejected');
    const shopRejected = !!(shopSub && shopSub.status === 'rejected');
    const wasWorkerApproved = req.session.workerApproved;
    const wasShopApproved = req.session.shopApproved;
    req.session.workerApproved = workerRejected ? false : (worker ? worker.approved : false);
    req.session.shopApproved = shopRejected ? false : (shop ? shop.approved : false);

    if (user.user_type === 'worker') {
      await prisma.worker.updateMany({
        where: { user_id: user.id },
        data: { last_seen: new Date() }
      });
    }

    res.json({
      loggedIn: true,
      userId: req.session.userId,
      userType: req.session.userType,
      userName: req.session.userName,
      workerApproved: req.session.workerApproved,
      shopApproved: req.session.shopApproved,
      workerRejected,
      shopRejected,
      justApproved: (!wasWorkerApproved && req.session.workerApproved) ||
                    (!wasShopApproved && req.session.shopApproved)
    });
  } catch (err) {
    console.error('Status error:', err);
    res.json({ loggedIn: false });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'notLoggedIn' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.session.userId },
      select: { id: true, name: true, phone: true, region: true, city: true,
                additional_info: true, user_type: true, language: true, created_at: true }
    });
    if (!user) return res.status(401).json({ error: 'notLoggedIn' });
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
