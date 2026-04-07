const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/adminAuth');

router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const allUsers = db.prepare('SELECT id, user_type FROM users').all();

    let totalWorkers = 0;
    let totalShops = 0;
    let totalCustomers = 0;
    let totalOther = 0;

    allUsers.forEach(user => {
      if (user.user_type === 'worker') totalWorkers++;
      else if (user.user_type === 'shop') totalShops++;
      else if (user.user_type === 'customer') totalCustomers++;
      else totalOther++;
    });

    const totalUsers = allUsers.length;

    console.log('STATS DEBUG:', {
      totalUsers,
      totalWorkers,
      totalShops,
      totalCustomers,
      totalOther,
      sum: totalWorkers + totalShops + totalCustomers + totalOther
    });

    const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    const activeJobRequests = db.prepare("SELECT COUNT(*) as c FROM job_requests WHERE status = 'active'").get().c;
    const pendingWorkers = db.prepare("SELECT COUNT(*) as c FROM worker_submissions WHERE status = 'pending'").get().c;
    const pendingShops = db.prepare("SELECT COUNT(*) as c FROM shop_submissions WHERE status = 'pending'").get().c;
    const totalRatings = db.prepare('SELECT COUNT(*) as c FROM ratings').get().c;

    const registrationsPerDay = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at) ORDER BY date ASC
    `).all();

    const professionBreakdown = db.prepare(`
      SELECT w.profession, COUNT(*) as count
      FROM workers w INNER JOIN users u ON w.user_id = u.id
      GROUP BY w.profession ORDER BY count DESC
    `).all();

    const regionBreakdown = db.prepare(`
      SELECT region, COUNT(*) as count FROM users
      WHERE region IS NOT NULL AND region != ''
      GROUP BY region ORDER BY count DESC
    `).all();

    const jobRequestsPerDay = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count FROM job_requests
      WHERE status = 'active' AND created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at) ORDER BY date ASC
    `).all();

    res.json({
      totalUsers, totalWorkers, totalShops, totalCustomers, totalOther,
      totalProducts, activeJobRequests, pendingWorkers, pendingShops, totalRatings,
      registrationsPerDay, professionBreakdown, regionBreakdown, jobRequestsPerDay
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── USERS ──
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json({ users });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/users/:id/ban', (req, res) => {
  try {
    db.prepare("UPDATE users SET status = 'banned' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/users/:id/unban', (req, res) => {
  try {
    db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── WORKER SUBMISSIONS ──
router.get('/worker-submissions', (req, res) => {
  try {
    const subs = db.prepare('SELECT ws.*, u.name as user_name, u.phone as user_phone FROM worker_submissions ws LEFT JOIN users u ON u.id = ws.user_id ORDER BY ws.created_at DESC').all();
    res.json({ submissions: subs });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/worker-submissions/:id/approve', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM worker_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE worker_submissions SET status = 'approved' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE workers SET approved = 1 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, 'Tabriklaymiz! Usta sifatida arizangiz tasdiqlandi.', 'Поздравляем! Ваша заявка мастера одобрена.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/worker-submissions/:id/reject', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM worker_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE worker_submissions SET status = 'rejected' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE workers SET approved = 0 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, "Afsuski, arizangiz rad etildi. Batafsil ma'lumot uchun admin bilan bog'laning.", 'К сожалению, ваша заявка отклонена.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/worker-submissions/:id/reconsider', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM worker_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE worker_submissions SET status = 'approved' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE workers SET approved = 1 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("DELETE FROM notifications WHERE user_id = ? AND message_uz LIKE '%rad etildi%'").run(sub.user_id); } catch(_) {}
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, "Tabriklaymiz! Arizangiz tasdiqlandi. Endi barcha imkoniyatlardan foydalanishingiz mumkin.", 'Поздравляем! Ваша заявка одобрена.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/worker-submissions/:id/revoke', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM worker_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE worker_submissions SET status = 'rejected' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE workers SET approved = 0 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, "Usta huquqingiz bekor qilindi. Admin bilan bog'laning.", 'Ваши права мастера были отозваны.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── SHOP SUBMISSIONS ──
router.get('/shop-submissions', (req, res) => {
  try {
    const subs = db.prepare('SELECT ss.*, u.name as user_name, u.phone as user_phone FROM shop_submissions ss LEFT JOIN users u ON u.id = ss.user_id ORDER BY ss.created_at DESC').all();
    res.json({ submissions: subs });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/approve', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM shop_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE shop_submissions SET status = 'approved' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE shops SET approved = 1 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, "Tabriklaymiz! Do'koningiz arizasi tasdiqlandi.", 'Поздравляем! Заявка вашего магазина одобрена.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/reject', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM shop_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE shop_submissions SET status = 'rejected' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE shops SET approved = 0 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, "Do'kon arizangiz rad etildi. Admin bilan bog'laning.", 'Заявка вашего магазина отклонена.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/reconsider', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM shop_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE shop_submissions SET status = 'approved' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE shops SET approved = 1 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("DELETE FROM notifications WHERE user_id = ? AND message_uz LIKE '%rad etildi%'").run(sub.user_id); } catch(_) {}
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(sub.user_id, "Tabriklaymiz! Do'koningiz arizasi tasdiqlandi. Endi barcha imkoniyatlardan foydalanishingiz mumkin.", 'Поздравляем! Заявка вашего магазина одобрена.'); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/revoke', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM shop_submissions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'notFound' });
    db.prepare("UPDATE shop_submissions SET status = 'rejected' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE shops SET approved = 0 WHERE user_id = ?').run(sub.user_id);
    try { db.prepare("INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)").run(
      sub.user_id,
      "Do'koningizga kirish imkoniyati bekor qilindi. Admin bilan bog'laning.",
      'Доступ к вашему магазину был отозван. Свяжитесь с администратором.'
    ); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── SHOPS ──
router.get('/shops', (req, res) => {
  try {
    const shops = db.prepare(`
      SELECT s.*, u.phone as user_phone, u.status as user_status
      FROM shops s LEFT JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `).all();
    res.json({ shops });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shops/:id', (req, res) => {
  try {
    const { shop_name, owner_name, phone, telegram, instagram, region, city, description, product_types } = req.body;
    if (!shop_name || !owner_name) return res.status(400).json({ error: 'missingFields' });
    db.prepare(
      `UPDATE shops SET shop_name=?, owner_name=?, phone=?, telegram=?, instagram=?, region=?, city=?, description=?, product_types=? WHERE id=?`
    ).run(shop_name, owner_name, phone || '', telegram || '', instagram || '', region || '', city || '', description || '', product_types || '', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/shops/:id', (req, res) => {
  try {
    const shop = db.prepare('SELECT user_id FROM shops WHERE id = ?').get(req.params.id);
    if (shop && shop.user_id) {
      db.prepare('DELETE FROM shop_submissions WHERE user_id = ?').run(shop.user_id);
    }
    db.prepare('DELETE FROM products WHERE shop_id = ?').run(req.params.id);
    db.prepare('DELETE FROM shops WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── WORKERS ──
router.get('/workers', (req, res) => {
  try {
    const workers = db.prepare('SELECT w.*, u.phone as user_phone, u.status as user_status FROM workers w LEFT JOIN users u ON u.id = w.user_id ORDER BY w.created_at DESC').all();
    res.json({ workers });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers', (req, res) => {
  try {
    const { name, profession, experience, description, region, city, phone, telegram, instagram, rating } = req.body;
    if (!name || !profession) return res.status(400).json({ error: 'missingFields' });
    db.prepare(
      `INSERT INTO workers (name, profession, experience, description, region, city, phone, telegram, instagram, rating, approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(name, profession, experience || '', description || '', region || '', city || '', phone || '', telegram || '', instagram || '', parseFloat(rating) || 0);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/workers/:id', (req, res) => {
  try {
    const { name, profession, experience, description, region, city, phone, telegram, instagram, rating } = req.body;
    db.prepare(
      `UPDATE workers SET name=?, profession=?, experience=?, description=?, region=?, city=?, phone=?, telegram=?, instagram=?, rating=? WHERE id=?`
    ).run(name, profession, experience, description, region, city, phone, telegram, instagram, parseFloat(rating) || 0, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers/:id/feature', (req, res) => {
  try {
    const { featured_order } = req.body;
    const currentCount = db.prepare('SELECT COUNT(*) as c FROM workers WHERE is_featured = 1 AND id != ?').get(req.params.id).c;
    if (currentCount >= 3) return res.status(400).json({ error: 'maxFeatured', message: "Maksimal 3 ta usta pinlanishi mumkin" });
    const nextOrder = featured_order || (currentCount + 1);
    db.prepare('UPDATE workers SET is_featured = 1, featured_order = ? WHERE id = ?').run(nextOrder, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers/:id/unfeature', (req, res) => {
  try {
    db.prepare('UPDATE workers SET is_featured = 0, featured_order = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers/:id/verify', (req, res) => {
  try {
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Ensure columns exist (idempotent)
    try { db.exec('ALTER TABLE workers ADD COLUMN is_verified INTEGER DEFAULT 0'); } catch(e) {}
    try { db.exec('ALTER TABLE workers ADD COLUMN verified_at DATETIME DEFAULT NULL'); } catch(e) {}

    db.prepare('UPDATE workers SET is_verified = 1, verified_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

    // Notify worker
    try {
      db.prepare('INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)').run(
        worker.user_id,
        "Tabriklaymiz! Shaxsingiz tasdiqlandi. Profilingizda \"Tekshirilgan\" belgisi paydo bo'ldi.",
        'Поздравляем! Ваша личность подтверждена.'
      );
    } catch(notifErr) { console.error('Notification error:', notifErr.message); }

    res.json({ success: true });
  } catch (err) {
    console.error('Verify worker error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/workers/:id/unverify', (req, res) => {
  try {
    db.prepare('UPDATE workers SET is_verified = 0, verified_at = NULL WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unverify worker error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/workers/:id', (req, res) => {
  try {
    const worker = db.prepare('SELECT user_id FROM workers WHERE id = ?').get(req.params.id);
    if (worker && worker.user_id) {
      db.prepare('DELETE FROM worker_submissions WHERE user_id = ?').run(worker.user_id);
    }
    db.prepare('DELETE FROM workers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── PRODUCTS ──
router.get('/products', (req, res) => {
  try {
    const products = db.prepare('SELECT p.*, s.shop_name as seller FROM products p LEFT JOIN shops s ON s.id = p.shop_id ORDER BY p.created_at DESC').all();
    res.json({ products });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/products', (req, res) => {
  try {
    const { product_name, price, description, product_type, seller_phone } = req.body;
    if (!product_name || !price) return res.status(400).json({ error: 'missingFields' });
    db.prepare(
      'INSERT INTO products (product_name, price, description, product_type, seller_phone) VALUES (?, ?, ?, ?, ?)'
    ).run(product_name, price, description || '', product_type || '', seller_phone || '');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/products/:id', (req, res) => {
  try {
    const { product_name, price, description, product_type, seller_phone } = req.body;
    db.prepare(
      'UPDATE products SET product_name=?, price=?, description=?, product_type=?, seller_phone=? WHERE id=?'
    ).run(product_name, price, description, product_type, seller_phone, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── JOB REQUESTS ──
router.get('/job-requests', (req, res) => {
  try {
    const reqs = db.prepare('SELECT jr.*, u.name as poster_name, u.phone as poster_phone FROM job_requests jr LEFT JOIN users u ON u.id = jr.user_id ORDER BY jr.created_at DESC').all();
    res.json({ requests: reqs });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/job-requests/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM job_requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── RATINGS ──
router.get('/ratings', (req, res) => {
  try {
    const ratings = db.prepare(`
      SELECT r.*, w.name as worker_name, u.name as customer_name
      FROM ratings r LEFT JOIN workers w ON w.id = r.worker_id LEFT JOIN users u ON u.id = r.customer_id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ ratings });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/ratings/:id', (req, res) => {
  try {
    const r = db.prepare('SELECT worker_id FROM ratings WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM ratings WHERE id = ?').run(req.params.id);
    if (r) {
      const avg = db.prepare('SELECT AVG(stars) as avg FROM ratings WHERE worker_id = ?').get(r.worker_id);
      db.prepare('UPDATE workers SET rating = ? WHERE id = ?').run(
        Math.round((avg.avg || 0) * 10) / 10, r.worker_id
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── JOB RESPONSES ──
router.get('/job-responses', (req, res) => {
  try {
    const responses = db.prepare(`
      SELECT jres.*, jr.title as job_title, w.name as worker_name
      FROM job_responses jres
      LEFT JOIN job_requests jr ON jr.id = jres.job_request_id
      LEFT JOIN workers w ON w.id = jres.worker_id
      ORDER BY jres.created_at DESC
    `).all();
    res.json({ responses });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/job-responses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM job_responses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

module.exports = router;
