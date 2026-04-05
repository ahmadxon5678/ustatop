const express = require('express');
const router = express.Router();
const db = require('../config/database');
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
router.get('/', (req, res) => {
  try {
    const { region, profession, search, verified } = req.query;
    let query = `SELECT w.*,
      (SELECT COUNT(*) FROM worker_views wv
       WHERE wv.worker_id = w.id
       AND wv.viewed_at > datetime('now', '-7 days')) as weekly_views,
      (SELECT COUNT(*) FROM ratings r WHERE r.worker_id = w.id) as review_count,
      (SELECT COUNT(*) FROM job_responses jr WHERE jr.worker_id = w.id) as total_responses,
      (SELECT AVG(CAST((julianday(jr.created_at) - julianday(jreq.created_at)) * 24 AS REAL))
       FROM job_responses jr JOIN job_requests jreq ON jreq.id = jr.job_request_id
       WHERE jr.worker_id = w.id) as avg_response_hours
      FROM workers w WHERE w.approved = 1`;
    const params = [];
    if (region) { query += ' AND w.region = ?'; params.push(region); }
    if (profession) { query += ' AND w.profession = ?'; params.push(profession); }
    if (verified === '1') { query += ' AND w.is_verified = 1'; }
    query += ' ORDER BY w.is_featured DESC, w.featured_order ASC, w.rating DESC, w.created_at DESC';
    const workers = db.prepare(query).all(...params);

    // Get portfolio thumbnails
    const result = workers.map(w => {
      const thumb = db.prepare('SELECT image_url FROM worker_portfolio WHERE worker_id = ? LIMIT 1').get(w.id);
      return { ...w, thumbnail: thumb ? thumb.image_url : null };
    });
    res.json({ workers: result });
  } catch (err) {
    console.error('Workers list error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/workers/:id — single worker profile
router.get('/:id', (req, res) => {
  try {
    const worker = db.prepare(`
      SELECT w.*,
        (SELECT COUNT(*) FROM worker_views wv
         WHERE wv.worker_id = w.id
         AND wv.viewed_at > datetime('now', '-7 days')) as weekly_views,
        (SELECT COUNT(*) FROM ratings r WHERE r.worker_id = w.id) as review_count,
        (SELECT COUNT(*) FROM job_responses jr WHERE jr.worker_id = w.id) as total_responses,
        (SELECT AVG(CAST((julianday(jr.created_at) - julianday(jreq.created_at)) * 24 AS REAL))
         FROM job_responses jr JOIN job_requests jreq ON jreq.id = jr.job_request_id
         WHERE jr.worker_id = w.id) as avg_response_hours
      FROM workers w WHERE w.id = ? AND w.approved = 1
    `).get(req.params.id);
    if (!worker) return res.status(404).json({ error: 'notFound' });

    const portfolio = db.prepare('SELECT * FROM worker_portfolio WHERE worker_id = ? ORDER BY id DESC').all(worker.id);
    const ratings = db.prepare(`
      SELECT r.*, u.name as customer_name
      FROM ratings r
      JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ?
      ORDER BY r.created_at DESC LIMIT 20
    `).all(worker.id);
    const calendar = db.prepare('SELECT * FROM worker_availability_calendar WHERE worker_id = ?').all(worker.id);

    // Track view if logged in
    if (req.session && req.session.userId) {
      try {
        const alreadyViewed = db.prepare(
          `SELECT id FROM worker_views WHERE worker_id = ? AND user_id = ? AND viewed_at > datetime('now', '-7 days')`
        ).get(worker.id, req.session.userId);
        if (!alreadyViewed) {
          db.prepare('INSERT INTO worker_views (worker_id, user_id) VALUES (?, ?)').run(worker.id, req.session.userId);
        }
      } catch(e) {}
    }

    // Hide contact info from guests
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

// GET /api/workers/my/profile — worker's own profile
router.get('/my/profile', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const portfolio = db.prepare('SELECT * FROM worker_portfolio WHERE worker_id = ? ORDER BY id DESC').all(worker.id);
    const calendar = db.prepare('SELECT * FROM worker_availability_calendar WHERE worker_id = ?').all(worker.id);
    res.json({ worker, portfolio, calendar });
  } catch (err) {
    console.error('My profile error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/workers/my/profile — update worker profile
router.put('/my/profile', requireApi, requireWorkerApproved, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { name, profession, experience, description, region, city, phone, telegram, instagram } = req.body;
    const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    db.prepare(
      `UPDATE workers SET name=?, profession=?, experience=?, description=?, region=?, city=?, phone=?, telegram=?, instagram=? WHERE id=?`
    ).run(name, profession, experience, description, region, city, phone, telegram || '', instagram || '', worker.id);
    if (name) db.prepare('UPDATE users SET name=? WHERE id=?').run(name, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/workers/my/availability — toggle availability
router.put('/my/availability', requireApi, requireWorkerApproved, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { status } = req.body;
    if (!['available','busy'].includes(status)) return res.status(400).json({ error: 'invalid' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    db.prepare('UPDATE workers SET availability_status = ? WHERE id = ?').run(status, worker.id);
    res.json({ success: true, status });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/workers/my/calendar — set calendar day
router.post('/my/calendar', requireApi, requireWorkerApproved, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { date, status } = req.body;
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });

    const existing = db.prepare('SELECT id FROM worker_availability_calendar WHERE worker_id = ? AND date = ?').get(worker.id, date);
    if (existing) {
      db.prepare('UPDATE worker_availability_calendar SET status = ? WHERE id = ?').run(status, existing.id);
    } else {
      db.prepare('INSERT INTO worker_availability_calendar (worker_id, date, status) VALUES (?, ?, ?)').run(worker.id, date, status);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/workers/me/availability/calendar — all saved dates
router.get('/me/availability/calendar', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const dates = db.prepare('SELECT date, status FROM worker_availability_calendar WHERE worker_id = ?').all(worker.id);
    res.json({ dates });
  } catch (err) {
    console.error('Calendar get error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/workers/me/availability/calendar — replace all marked days at once
router.post('/me/availability/calendar', requireApi, requireWorkerApproved, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const { dates } = req.body;
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const del = db.prepare('DELETE FROM worker_availability_calendar WHERE worker_id = ?');
    const ins = db.prepare('INSERT INTO worker_availability_calendar (worker_id, date, status) VALUES (?, ?, ?)');
    const saveAll = db.transaction(function(rows) {
      del.run(worker.id);
      if (Array.isArray(rows)) {
        rows.forEach(function(d) {
          if (d.date && d.status) ins.run(worker.id, d.date, d.status);
        });
      }
    });
    saveAll(dates || []);
    res.json({ success: true });
  } catch (err) {
    console.error('Calendar save error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/workers/my/portfolio — upload portfolio image
router.post('/my/portfolio', requireApi, requireWorkerApproved, upload.single('image'), (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    if (!req.file) return res.status(400).json({ error: 'noFile' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const count = db.prepare('SELECT COUNT(*) as cnt FROM worker_portfolio WHERE worker_id = ?').get(worker.id);
    if (count.cnt >= 5) return res.status(400).json({ error: 'maxPortfolio' });
    const imageUrl = '/uploads/portfolio/' + req.file.filename;
    db.prepare('INSERT INTO worker_portfolio (worker_id, image_url) VALUES (?, ?)').run(worker.id, imageUrl);
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    console.error('Portfolio upload error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// DELETE /api/workers/my/portfolio/:id
router.delete('/my/portfolio/:id', requireApi, requireWorkerApproved, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.status(404).json({ error: 'notFound' });
    const img = db.prepare('SELECT * FROM worker_portfolio WHERE id = ? AND worker_id = ?').get(req.params.id, worker.id);
    if (!img) return res.status(404).json({ error: 'notFound' });
    // Delete file
    try {
      const filePath = path.join(__dirname, '..', 'public', img.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch(e) {}
    db.prepare('DELETE FROM worker_portfolio WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Portfolio delete error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
