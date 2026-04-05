const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : path.join(__dirname, '..', 'public', 'uploads');
    const dir = path.join(base, 'reviews');
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

// POST /api/ratings
router.post('/', requireApi, upload.single('photo'), (req, res) => {
  try {
    const { worker_id, job_response_id, stars, review } = req.body;
    if (!worker_id || !stars || !review) return res.status(400).json({ error: 'missingFields' });
    if (stars < 1 || stars > 5) return res.status(400).json({ error: 'invalidStars' });

    // Verify job_response exists for this worker+customer pair
    if (job_response_id) {
      const jres = db.prepare(`
        SELECT jres.id FROM job_responses jres
        JOIN job_requests jr ON jr.id = jres.job_request_id
        WHERE jres.id = ? AND jres.worker_id = ? AND jr.user_id = ?
      `).get(job_response_id, worker_id, req.session.userId);
      if (!jres) return res.status(403).json({ error: 'notAllowed' });
    }

    const existing = db.prepare('SELECT id FROM ratings WHERE worker_id = ? AND customer_id = ?')
      .get(worker_id, req.session.userId);
    if (existing) return res.status(400).json({ error: 'alreadyRated' });

    const photoUrl = req.file ? '/uploads/reviews/' + req.file.filename : null;
    db.prepare(
      `INSERT INTO ratings (worker_id, customer_id, job_response_id, stars, review, photo)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(worker_id, req.session.userId, job_response_id || null, parseInt(stars), review, photoUrl);

    // Recalculate average rating
    const avg = db.prepare('SELECT AVG(stars) as avg FROM ratings WHERE worker_id = ?').get(worker_id);
    db.prepare('UPDATE workers SET rating = ? WHERE id = ?').run(
      Math.round((avg.avg || 0) * 10) / 10, worker_id
    );

    // Notify worker
    const worker = db.prepare('SELECT user_id FROM workers WHERE id = ?').get(worker_id);
    if (worker) {
      try {
        db.prepare('INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)')
          .run(worker.user_id, 'Yangi sharh va baho oldingiz!', 'Вы получили новый отзыв!');
      } catch(_) {}
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/ratings/worker/:id
router.get('/worker/:id', (req, res) => {
  try {
    const ratings = db.prepare(`
      SELECT r.*, u.name as customer_name
      FROM ratings r JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ? ORDER BY r.created_at DESC
    `).all(req.params.id);
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/ratings/my — worker's received ratings
router.get('/my', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.json({ ratings: [] });
    const ratings = db.prepare(`
      SELECT r.*, u.name as customer_name
      FROM ratings r JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ? ORDER BY r.created_at DESC
    `).all(worker.id);
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
