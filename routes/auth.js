const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getCorrectDashboard } = require('../middleware/auth');

function setSession(req, user, worker, shop) {
  req.session.userId = user.id;
  req.session.userType = user.user_type;
  req.session.userName = user.name;
  req.session.workerApproved = worker ? (worker.approved === 1) : false;
  req.session.shopApproved = shop ? (shop.approved === 1) : false;
  req.session.isAdmin = false;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, phone, region, city, additional_info, user_type,
            profession, experience, description, telegram, instagram,
            shop_name, owner_name, product_types } = req.body;

    if (!name || !phone || !region || !city || !user_type) {
      return res.status(400).json({ error: 'missingFields' });
    }
    if (!/^\+998\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'phoneError' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(400).json({ error: 'phoneTaken' });

    const insert = db.prepare(
      `INSERT INTO users (name, phone, password, region, city, additional_info, user_type)
       VALUES (?, ?, '', ?, ?, ?, ?)`
    );
    const result = insert.run(name, phone, region, city, additional_info || '', user_type);
    const userId = result.lastInsertRowid;

    let worker = null, shop = null;

    if (user_type === 'worker') {
      if (!profession || !experience || !description) {
        return res.status(400).json({ error: 'missingFields' });
      }
      db.prepare(
        `INSERT INTO workers (user_id, name, profession, experience, description, region, city, phone, telegram, instagram, approved)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      ).run(userId, name, profession, experience, description, region, city, phone, telegram || '', instagram || '');
      db.prepare(
        `INSERT INTO worker_submissions (user_id, name, profession, region, city, experience, description, phone, telegram, instagram)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, name, profession, region, city, experience, description, phone, telegram || '', instagram || '');
      worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(userId);
    }

    if (user_type === 'shop') {
      if (!shop_name || !owner_name) {
        return res.status(400).json({ error: 'missingFields' });
      }
      const ptStr = Array.isArray(product_types) ? product_types.join(',') : (product_types || '');
      db.prepare(
        `INSERT INTO shops (user_id, shop_name, owner_name, phone, telegram, instagram, region, city, description, product_types)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, shop_name, owner_name, phone, telegram || '', instagram || '', region, city, description || '', ptStr);
      db.prepare(
        `INSERT INTO shop_submissions (user_id, shop_name, owner_name, phone, telegram, instagram, region, city, description, product_types)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, shop_name, owner_name, phone, telegram || '', instagram || '', region, city, description || '', ptStr);
      shop = db.prepare('SELECT * FROM shops WHERE user_id = ?').get(userId);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
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
router.post('/login', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phoneError' });

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(404).json({ error: 'phoneNotFound' });
    if (user.status === 'banned') return res.status(403).json({ error: 'banned' });

    const worker = user.user_type === 'worker'
      ? db.prepare('SELECT * FROM workers WHERE user_id = ?').get(user.id) : null;
    const shop = user.user_type === 'shop'
      ? db.prepare('SELECT * FROM shops WHERE user_id = ?').get(user.id) : null;

    setSession(req, user, worker, shop);

    // Update last_seen for workers
    if (user.user_type === 'worker' && worker) {
      try { db.prepare('UPDATE workers SET last_seen = CURRENT_TIMESTAMP WHERE user_id = ?').run(user.id); } catch(_) {}
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
    if (password !== (process.env.ADMIN_PASSWORD || 'AhmadJohns!09')) {
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
router.get('/status', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ loggedIn: false });
  }
  // Refresh approval status from DB
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
    if (!user) { req.session.destroy(() => {}); return res.json({ loggedIn: false }); }
    const worker = user.user_type === 'worker'
      ? db.prepare('SELECT * FROM workers WHERE user_id = ?').get(user.id) : null;
    const shop = user.user_type === 'shop'
      ? db.prepare('SELECT * FROM shops WHERE user_id = ?').get(user.id) : null;
    const workerSub = user.user_type === 'worker'
      ? db.prepare("SELECT status FROM worker_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(user.id) : null;
    const shopSub = user.user_type === 'shop'
      ? db.prepare("SELECT status FROM shop_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(user.id) : null;
    const workerRejected = !!(workerSub && workerSub.status === 'rejected');
    const shopRejected = !!(shopSub && shopSub.status === 'rejected');
    const wasWorkerApproved = req.session.workerApproved;
    const wasShopApproved = req.session.shopApproved;
    req.session.workerApproved = workerRejected ? false : (worker ? (worker.approved === 1) : false);
    req.session.shopApproved = shopRejected ? false : (shop ? (shop.approved === 1) : false);

    // Update last_seen for workers on each status check (dashboard visit)
    if (user.user_type === 'worker') {
      try { db.prepare('UPDATE workers SET last_seen = CURRENT_TIMESTAMP WHERE user_id = ?').run(user.id); } catch(_) {}
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
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'notLoggedIn' });
  }
  try {
    const user = db.prepare('SELECT id, name, phone, region, city, additional_info, user_type, language, created_at FROM users WHERE id = ?').get(req.session.userId);
    if (!user) return res.status(401).json({ error: 'notLoggedIn' });
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
