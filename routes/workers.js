const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { Prisma } = require('@prisma/client');
const { requireApi, requireWorkerApproved } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : path.join(__dirname, '..', 'public', 'uploads');
    const dir = path.join(base, 'portfolio');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + path.extname(file.originalname));
  }
});
const imageFilter = (req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });

// GET /api/workers — list all approved workers
router.get('/', async (req, res) => {
  try {
    const { region, profession, verified } = req.query;

    let whereClause = Prisma.sql`w.approved = true`;
    if (region) whereClause = Prisma.sql`${whereClause} AND w.region = ${region}`;
    if (profession) whereClause = Prisma.sql`${whereClause} AND w.profession = ${profession}`;
    if (verified === '1') whereClause = Prisma.sql`${whereClause} AND w.is_verified = true`;

    const workers = await prisma.$queryRaw`
      SELECT w.*,
        (SELECT COUNT(*)::int FROM worker_views wv
         WHERE wv.worker_id = w.id
         AND wv.viewed_at > NOW() - INTERVAL '7 days') as weekly_views,
        (SELECT COUNT(*)::int FROM ratings r WHERE r.worker_id = w.id) as review_count,
        (SELECT COUNT(*)::int FROM job_responses jr WHERE jr.worker_id = w.id) as total_responses,
        (SELECT AVG(EXTRACT(EPOCH FROM (jr.created_at - jreq.created_at)) / 3600)
         FROM job_responses jr JOIN job_requests jreq ON jreq.id = jr.job_request_id
         WHERE jr.worker_id = w.id) as avg_response_hours
      FROM workers w WHERE ${whereClause}
      ORDER BY w.is_featured DESC, w.featured_order ASC, w.rating DESC, w.created_at DESC
    `;

    const result = await Promise.all(workers.map(async w => {
      const thumb = await prisma.workerPortfolio.findFirst({
        where: { worker_id: w.id },
        select: { image_url: true }
      });
      return { ...w, thumbnail: thumb ? thumb.image_url : null };
    }));

    res.json({ workers: result });
  } catch (err) {
    console.error('Workers list error:', err);
    res.status(500).json({ error: 'serverError', detail: err.message });
  }
});

// GET /api/workers/my/profile — worker's own profile (must be before /:id)
router.get('/my/profile', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = await prisma.worker.findFirst({ where: { user_id: req.session.userId } });
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const portfolio = await prisma.workerPortfolio.findMany({
      where: { worker_id: worker.id }, orderBy: { id: 'desc' }
    });
    const calendar = await prisma.workerAvailabilityCalendar.findMany({
      where: { worker_id: worker.id }
    });
    res.json({ worker, portfolio, calendar });
  } catch (err) {
    console.error('My profile error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/workers/me/availability/calendar — all saved dates (must be before /:id)
router.get('/me/availability/calendar', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const dates = await prisma.workerAvailabilityCalendar.findMany({
      where: { worker_id: worker.id },
      select: { date: true, status: true }
    });
    res.json({ dates });
  } catch (err) {
    console.error('Calendar get error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/workers/:id — single worker profile
router.get('/:id', async (req, res) => {
  try {
    const workerId = parseInt(req.params.id);
    const workers = await prisma.$queryRaw`
      SELECT w.*,
        (SELECT COUNT(*)::int FROM worker_views wv
         WHERE wv.worker_id = w.id
         AND wv.viewed_at > NOW() - INTERVAL '7 days') as weekly_views,
        (SELECT COUNT(*)::int FROM ratings r WHERE r.worker_id = w.id) as review_count,
        (SELECT COUNT(*)::int FROM job_responses jr WHERE jr.worker_id = w.id) as total_responses,
        (SELECT AVG(EXTRACT(EPOCH FROM (jr.created_at - jreq.created_at)) / 3600)
         FROM job_responses jr JOIN job_requests jreq ON jreq.id = jr.job_request_id
         WHERE jr.worker_id = w.id) as avg_response_hours
      FROM workers w WHERE w.id = ${workerId} AND w.approved = true
    `;
    const worker = workers[0];
    if (!worker) return res.status(404).json({ error: 'notFound' });

    const portfolio = await prisma.workerPortfolio.findMany({
      where: { worker_id: worker.id }, orderBy: { id: 'desc' }
    });
    const ratings = await prisma.$queryRaw`
      SELECT r.*, u.name as customer_name
      FROM ratings r JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ${workerId}
      ORDER BY r.created_at DESC LIMIT 20
    `;
    const calendar = await prisma.workerAvailabilityCalendar.findMany({
      where: { worker_id: worker.id }
    });

    // Track view if logged in
    if (req.session && req.session.userId) {
      try {
        const alreadyViewed = await prisma.$queryRaw`
          SELECT id FROM worker_views
          WHERE worker_id = ${workerId} AND user_id = ${req.session.userId}
          AND viewed_at > NOW() - INTERVAL '7 days'
          LIMIT 1
        `;
        if (!alreadyViewed.length) {
          await prisma.workerView.create({
            data: { worker_id: workerId, user_id: req.session.userId }
          });
        }
      } catch(e) {}
    }

    const isLoggedIn = req.session && req.session.userId;
    const workerData = { ...worker };
    if (!isLoggedIn) {
      workerData.phone = null;
      workerData.telegram = null;
      workerData.instagram = null;
    }

    res.json({ worker: workerData, portfolio, ratings, calendar });
  } catch (err) {
    console.error('Worker profile error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/workers/my/profile — update worker profile
router.put('/my/profile', requireApi, requireWorkerApproved, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { name, profession, experience, description, region, city, phone, telegram, instagram } = req.body;
    const worker = await prisma.worker.findFirst({ where: { user_id: req.session.userId } });
    if (!worker) return res.status(404).json({ error: 'notFound' });
    await prisma.worker.update({
      where: { id: worker.id },
      data: { name, profession, experience, description, region, city, phone,
              telegram: telegram || '', instagram: instagram || '' }
    });
    if (name) await prisma.user.update({ where: { id: req.session.userId }, data: { name } });
    res.json({ success: true });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/workers/my/calendar — set single calendar day
router.post('/my/calendar', requireApi, requireWorkerApproved, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { date, status } = req.body;
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.status(404).json({ error: 'notFound' });

    const existing = await prisma.workerAvailabilityCalendar.findFirst({
      where: { worker_id: worker.id, date }
    });
    if (existing) {
      await prisma.workerAvailabilityCalendar.update({
        where: { id: existing.id }, data: { status }
      });
    } else {
      await prisma.workerAvailabilityCalendar.create({
        data: { worker_id: worker.id, date, status }
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/workers/me/availability/calendar — replace all marked days at once
router.post('/me/availability/calendar', requireApi, requireWorkerApproved, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { dates } = req.body;
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.status(404).json({ error: 'notFound' });

    await prisma.$transaction(async (tx) => {
      await tx.workerAvailabilityCalendar.deleteMany({ where: { worker_id: worker.id } });
      if (Array.isArray(dates)) {
        for (const d of dates) {
          if (d.date && d.status) {
            await tx.workerAvailabilityCalendar.create({
              data: { worker_id: worker.id, date: d.date, status: d.status }
            });
          }
        }
      }
    });

    const today = new Date().toISOString().slice(0, 10);
    const busyToday = Array.isArray(dates) && dates.some(d => d.date === today && d.status === 'busy');
    await prisma.worker.update({
      where: { id: worker.id },
      data: { availability_status: busyToday ? 'busy' : 'available' }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Calendar save error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/workers/my/portfolio — upload portfolio image
router.post('/my/portfolio', requireApi, requireWorkerApproved, upload.single('image'), async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    if (!req.file) return res.status(400).json({ error: 'noFile' });
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const count = await prisma.workerPortfolio.count({ where: { worker_id: worker.id } });
    if (count >= 5) return res.status(400).json({ error: 'maxPortfolio' });
    const imageUrl = '/uploads/portfolio/' + req.file.filename;
    await prisma.workerPortfolio.create({ data: { worker_id: worker.id, image_url: imageUrl } });
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    console.error('Portfolio upload error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// DELETE /api/workers/my/portfolio/:id
router.delete('/my/portfolio/:id', requireApi, requireWorkerApproved, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const img = await prisma.workerPortfolio.findFirst({
      where: { id: parseInt(req.params.id), worker_id: worker.id }
    });
    if (!img) return res.status(404).json({ error: 'notFound' });
    try {
      const filePath = path.join(__dirname, '..', 'public', img.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch(e) {}
    await prisma.workerPortfolio.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error('Portfolio delete error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
