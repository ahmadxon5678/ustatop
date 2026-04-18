const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireAdmin } = require('../middleware/adminAuth');

router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalWorkers, totalShops, totalCustomers, totalUsers,
           totalProducts, activeJobRequests, pendingWorkers, pendingShops, totalRatings] =
      await Promise.all([
        prisma.user.count({ where: { user_type: 'worker' } }),
        prisma.user.count({ where: { user_type: 'shop' } }),
        prisma.user.count({ where: { user_type: 'customer' } }),
        prisma.user.count(),
        prisma.product.count(),
        prisma.jobRequest.count({ where: { status: 'active' } }),
        prisma.workerSubmission.count({ where: { status: 'pending' } }),
        prisma.shopSubmission.count({ where: { status: 'pending' } }),
        prisma.rating.count()
      ]);

    const totalOther = totalUsers - totalWorkers - totalShops - totalCustomers;

    console.log('STATS DEBUG:', {
      totalUsers, totalWorkers, totalShops, totalCustomers, totalOther,
      sum: totalWorkers + totalShops + totalCustomers + totalOther
    });

    const [registrationsPerDay, professionBreakdown, regionBreakdown, jobRequestsPerDay] =
      await Promise.all([
        prisma.$queryRaw`
          SELECT DATE(created_at)::text as date, COUNT(*)::int as count
          FROM users
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY date ASC
        `,
        prisma.$queryRaw`
          SELECT w.profession, COUNT(*)::int as count
          FROM workers w INNER JOIN users u ON w.user_id = u.id
          GROUP BY w.profession ORDER BY count DESC
        `,
        prisma.$queryRaw`
          SELECT region, COUNT(*)::int as count FROM users
          WHERE region IS NOT NULL AND region != ''
          GROUP BY region ORDER BY count DESC
        `,
        prisma.$queryRaw`
          SELECT DATE(created_at)::text as date, COUNT(*)::int as count FROM job_requests
          WHERE status = 'active' AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY date ASC
        `
      ]);

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
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { created_at: 'desc' } });
    res.json({ users });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/users/:id/ban', async (req, res) => {
  try {
    await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { status: 'banned' } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/users/:id/unban', async (req, res) => {
  try {
    await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { status: 'active' } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── WORKER SUBMISSIONS ──
router.get('/worker-submissions', async (req, res) => {
  try {
    const subs = await prisma.$queryRaw`
      SELECT ws.*, u.name as user_name, u.phone as user_phone
      FROM worker_submissions ws LEFT JOIN users u ON u.id = ws.user_id
      ORDER BY ws.created_at DESC
    `;
    res.json({ submissions: subs });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/worker-submissions/:id/approve', async (req, res) => {
  try {
    const sub = await prisma.workerSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.workerSubmission.update({ where: { id: sub.id }, data: { status: 'approved' } });
    await prisma.worker.updateMany({ where: { user_id: sub.user_id }, data: { approved: true } });
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: 'Tabriklaymiz! Usta sifatida arizangiz tasdiqlandi.', message_ru: 'Поздравляем! Ваша заявка мастера одобрена.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/worker-submissions/:id/reject', async (req, res) => {
  try {
    const sub = await prisma.workerSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.workerSubmission.update({ where: { id: sub.id }, data: { status: 'rejected' } });
    await prisma.worker.updateMany({ where: { user_id: sub.user_id }, data: { approved: false } });
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Afsuski, arizangiz rad etildi. Batafsil ma'lumot uchun admin bilan bog'laning.", message_ru: 'К сожалению, ваша заявка отклонена.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/worker-submissions/:id/reconsider', async (req, res) => {
  try {
    const sub = await prisma.workerSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.workerSubmission.update({ where: { id: sub.id }, data: { status: 'approved' } });
    await prisma.worker.updateMany({ where: { user_id: sub.user_id }, data: { approved: true } });
    try { await prisma.notification.deleteMany({ where: { user_id: sub.user_id, message_uz: { contains: 'rad etildi' } } }); } catch(_) {}
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Tabriklaymiz! Arizangiz tasdiqlandi. Endi barcha imkoniyatlardan foydalanishingiz mumkin.", message_ru: 'Поздравляем! Ваша заявка одобрена.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/worker-submissions/:id/revoke', async (req, res) => {
  try {
    const sub = await prisma.workerSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.workerSubmission.update({ where: { id: sub.id }, data: { status: 'rejected' } });
    await prisma.worker.updateMany({ where: { user_id: sub.user_id }, data: { approved: false } });
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Usta huquqingiz bekor qilindi. Admin bilan bog'laning.", message_ru: 'Ваши права мастера были отозваны.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── SHOP SUBMISSIONS ──
router.get('/shop-submissions', async (req, res) => {
  try {
    const subs = await prisma.$queryRaw`
      SELECT ss.*, u.name as user_name, u.phone as user_phone
      FROM shop_submissions ss LEFT JOIN users u ON u.id = ss.user_id
      ORDER BY ss.created_at DESC
    `;
    res.json({ submissions: subs });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/approve', async (req, res) => {
  try {
    const sub = await prisma.shopSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.shopSubmission.update({ where: { id: sub.id }, data: { status: 'approved' } });
    await prisma.shop.updateMany({ where: { user_id: sub.user_id }, data: { approved: true } });
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Tabriklaymiz! Do'koningiz arizasi tasdiqlandi.", message_ru: 'Поздравляем! Заявка вашего магазина одобрена.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/reject', async (req, res) => {
  try {
    const sub = await prisma.shopSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.shopSubmission.update({ where: { id: sub.id }, data: { status: 'rejected' } });
    await prisma.shop.updateMany({ where: { user_id: sub.user_id }, data: { approved: false } });
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Do'kon arizangiz rad etildi. Admin bilan bog'laning.", message_ru: 'Заявка вашего магазина отклонена.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/reconsider', async (req, res) => {
  try {
    const sub = await prisma.shopSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.shopSubmission.update({ where: { id: sub.id }, data: { status: 'approved' } });
    await prisma.shop.updateMany({ where: { user_id: sub.user_id }, data: { approved: true } });
    try { await prisma.notification.deleteMany({ where: { user_id: sub.user_id, message_uz: { contains: 'rad etildi' } } }); } catch(_) {}
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Tabriklaymiz! Do'koningiz arizasi tasdiqlandi. Endi barcha imkoniyatlardan foydalanishingiz mumkin.", message_ru: 'Поздравляем! Заявка вашего магазина одобрена.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shop-submissions/:id/revoke', async (req, res) => {
  try {
    const sub = await prisma.shopSubmission.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'notFound' });
    await prisma.shopSubmission.update({ where: { id: sub.id }, data: { status: 'rejected' } });
    await prisma.shop.updateMany({ where: { user_id: sub.user_id }, data: { approved: false } });
    try { await prisma.notification.create({ data: { user_id: sub.user_id, message_uz: "Do'koningizga kirish imkoniyati bekor qilindi. Admin bilan bog'laning.", message_ru: 'Доступ к вашему магазину был отозван. Свяжитесь с администратором.' } }); } catch(_) {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── SHOPS ──
router.get('/shops', async (req, res) => {
  try {
    const shops = await prisma.$queryRaw`
      SELECT s.*, u.phone as user_phone, u.status as user_status
      FROM shops s LEFT JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `;
    res.json({ shops });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/shops/:id', async (req, res) => {
  try {
    const { shop_name, owner_name, phone, telegram, instagram, region, city, description, product_types } = req.body;
    if (!shop_name || !owner_name) return res.status(400).json({ error: 'missingFields' });
    await prisma.shop.update({
      where: { id: parseInt(req.params.id) },
      data: {
        shop_name, owner_name,
        phone: phone || '', telegram: telegram || '', instagram: instagram || '',
        region: region || '', city: city || '', description: description || '',
        product_types: product_types || ''
      }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/shops/:id', async (req, res) => {
  try {
    const shop = await prisma.shop.findFirst({
      where: { id: parseInt(req.params.id) }, select: { user_id: true }
    });
    if (shop && shop.user_id) {
      await prisma.shopSubmission.deleteMany({ where: { user_id: shop.user_id } });
    }
    await prisma.product.deleteMany({ where: { shop_id: parseInt(req.params.id) } });
    await prisma.shop.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── WORKERS ──
router.get('/workers', async (req, res) => {
  try {
    const workers = await prisma.$queryRaw`
      SELECT w.*, u.phone as user_phone, u.status as user_status
      FROM workers w LEFT JOIN users u ON u.id = w.user_id
      ORDER BY w.created_at DESC
    `;
    res.json({ workers });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers', async (req, res) => {
  try {
    const { name, profession, experience, description, region, city, phone, telegram, instagram, rating } = req.body;
    if (!name || !profession) return res.status(400).json({ error: 'missingFields' });
    await prisma.worker.create({
      data: {
        name, profession,
        experience: experience || '', description: description || '',
        region: region || '', city: city || '', phone: phone || '',
        telegram: telegram || '', instagram: instagram || '',
        rating: parseFloat(rating) || 0, approved: true
      }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/workers/:id', async (req, res) => {
  try {
    const { name, profession, experience, description, region, city, phone, telegram, instagram, rating } = req.body;
    await prisma.worker.update({
      where: { id: parseInt(req.params.id) },
      data: { name, profession, experience, description, region, city, phone, telegram, instagram, rating: parseFloat(rating) || 0 }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers/:id/feature', async (req, res) => {
  try {
    const { featured_order } = req.body;
    const currentCount = await prisma.worker.count({
      where: { is_featured: true, id: { not: parseInt(req.params.id) } }
    });
    if (currentCount >= 3) return res.status(400).json({ error: 'maxFeatured', message: "Maksimal 3 ta usta pinlanishi mumkin" });
    const nextOrder = featured_order || (currentCount + 1);
    await prisma.worker.update({
      where: { id: parseInt(req.params.id) },
      data: { is_featured: true, featured_order: nextOrder }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers/:id/unfeature', async (req, res) => {
  try {
    await prisma.worker.update({
      where: { id: parseInt(req.params.id) },
      data: { is_featured: false, featured_order: 0 }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/workers/:id/verify', async (req, res) => {
  try {
    const worker = await prisma.worker.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    await prisma.worker.update({
      where: { id: parseInt(req.params.id) },
      data: { is_verified: true, verified_at: new Date() }
    });
    try {
      await prisma.notification.create({
        data: {
          user_id: worker.user_id,
          message_uz: "Tabriklaymiz! Shaxsingiz tasdiqlandi. Profilingizda \"Tekshirilgan\" belgisi paydo bo'ldi.",
          message_ru: 'Поздравляем! Ваша личность подтверждена.'
        }
      });
    } catch(notifErr) { console.error('Notification error:', notifErr.message); }
    res.json({ success: true });
  } catch (err) {
    console.error('Verify worker error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/workers/:id/unverify', async (req, res) => {
  try {
    await prisma.worker.update({
      where: { id: parseInt(req.params.id) },
      data: { is_verified: false, verified_at: null }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Unverify worker error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/workers/:id', async (req, res) => {
  try {
    const worker = await prisma.worker.findFirst({
      where: { id: parseInt(req.params.id) }, select: { user_id: true }
    });
    if (worker && worker.user_id) {
      await prisma.workerSubmission.deleteMany({ where: { user_id: worker.user_id } });
    }
    await prisma.worker.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── PRODUCTS ──
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT p.*, s.shop_name as seller FROM products p
      LEFT JOIN shops s ON s.id = p.shop_id ORDER BY p.created_at DESC
    `;
    res.json({ products });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.post('/products', async (req, res) => {
  try {
    const { product_name, price, description, product_type, seller_phone } = req.body;
    if (!product_name || !price) return res.status(400).json({ error: 'missingFields' });
    await prisma.product.create({
      data: {
        product_name, price,
        description: description || '', product_type: product_type || '',
        seller_phone: seller_phone || ''
      }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { product_name, price, description, product_type, seller_phone } = req.body;
    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { product_name, price, description, product_type, seller_phone }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── JOB REQUESTS ──
router.get('/job-requests', async (req, res) => {
  try {
    const reqs = await prisma.$queryRaw`
      SELECT jr.*, u.name as poster_name, u.phone as poster_phone
      FROM job_requests jr LEFT JOIN users u ON u.id = jr.user_id
      ORDER BY jr.created_at DESC
    `;
    res.json({ requests: reqs });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/job-requests/:id', async (req, res) => {
  try {
    await prisma.jobRequest.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── RATINGS ──
router.get('/ratings', async (req, res) => {
  try {
    const ratings = await prisma.$queryRaw`
      SELECT r.*, w.name as worker_name, u.name as customer_name
      FROM ratings r LEFT JOIN workers w ON w.id = r.worker_id LEFT JOIN users u ON u.id = r.customer_id
      ORDER BY r.created_at DESC
    `;
    res.json({ ratings });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/ratings/:id', async (req, res) => {
  try {
    const r = await prisma.rating.findFirst({
      where: { id: parseInt(req.params.id) }, select: { worker_id: true }
    });
    await prisma.rating.delete({ where: { id: parseInt(req.params.id) } });
    if (r && r.worker_id) {
      const avg = await prisma.rating.aggregate({
        where: { worker_id: r.worker_id }, _avg: { stars: true }
      });
      await prisma.worker.update({
        where: { id: r.worker_id },
        data: { rating: Math.round((avg._avg.stars || 0) * 10) / 10 }
      });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

// ── JOB RESPONSES ──
router.get('/job-responses', async (req, res) => {
  try {
    const responses = await prisma.$queryRaw`
      SELECT jres.*, jr.title as job_title, w.name as worker_name
      FROM job_responses jres
      LEFT JOIN job_requests jr ON jr.id = jres.job_request_id
      LEFT JOIN workers w ON w.id = jres.worker_id
      ORDER BY jres.created_at DESC
    `;
    res.json({ responses });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

router.delete('/job-responses/:id', async (req, res) => {
  try {
    await prisma.jobResponse.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'serverError' }); }
});

module.exports = router;
