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
// Accepts: target_id, target_type ('worker'|'material'), stars, review, photo
// Also accepts legacy: worker_id (treated as target_type='worker')
router.post('/', requireApi, upload.single('photo'), (req, res) => {
  try {
    const { target_type, stars, review, job_response_id } = req.body;
    const target_id = parseInt(req.body.target_id || req.body.worker_id);
    const resolvedType = target_type || 'worker';

    if (!target_id || !stars || !review) {
      return res.status(400).json({ error: 'missingFields' });
    }
    if (parseInt(stars) < 1 || parseInt(stars) > 5) {
      return res.status(400).json({ error: 'invalidStars' });
    }
    if (!['worker', 'material'].includes(resolvedType)) {
      return res.status(400).json({ error: 'invalidTargetType' });
    }

    const photoUrl = req.file ? '/uploads/reviews/' + req.file.filename : null;

    if (resolvedType === 'worker') {
      return handleWorkerReview(req, res, target_id, parseInt(stars), review, photoUrl, job_response_id);
    } else {
      return handleMaterialReview(req, res, target_id, parseInt(stars), review, photoUrl);
    }
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

function handleWorkerReview(req, res, workerId, stars, review, photoUrl, jobResponseId) {
  // Fetch worker to validate existence and check self-rating
  const worker = db.prepare('SELECT id, user_id FROM workers WHERE id = ?').get(workerId);
  if (!worker) return res.status(404).json({ error: 'notFound' });

  // Self-rating guard
  if (worker.user_id === req.session.userId) {
    return res.status(403).json({ error: 'You cannot rate your own profile.' });
  }

  // Optional: verify job_response belongs to this worker+customer pair
  if (jobResponseId) {
    const jres = db.prepare(`
      SELECT jres.id FROM job_responses jres
      JOIN job_requests jr ON jr.id = jres.job_request_id
      WHERE jres.id = ? AND jres.worker_id = ? AND jr.user_id = ?
    `).get(jobResponseId, workerId, req.session.userId);
    if (!jres) return res.status(403).json({ error: 'notAllowed' });
  }

  // Duplicate guard
  const existing = db.prepare('SELECT id FROM ratings WHERE worker_id = ? AND customer_id = ?')
    .get(workerId, req.session.userId);
  if (existing) return res.status(400).json({ error: 'alreadyRated' });

  // Insert review
  db.prepare(
    `INSERT INTO ratings (worker_id, customer_id, job_response_id, stars, review, photo)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(workerId, req.session.userId, jobResponseId || null, stars, review, photoUrl);

  // Recalculate average and update workers.rating
  const avg = db.prepare('SELECT AVG(stars) as avg FROM ratings WHERE worker_id = ?').get(workerId);
  db.prepare('UPDATE workers SET rating = ? WHERE id = ?').run(
    Math.round((avg.avg || 0) * 10) / 10,
    workerId
  );

  // Notify worker
  try {
    db.prepare('INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)')
      .run(worker.user_id, 'Yangi sharh va baho oldingiz!', 'Вы получили новый отзыв!');
  } catch (_) {}

  return res.json({ success: true });
}

function handleMaterialReview(req, res, productId, stars, review, photoUrl) {
  // Fetch product + shop owner to validate existence and check owner-rating
  const product = db.prepare(`
    SELECT p.id, s.user_id AS shop_user_id
    FROM products p
    LEFT JOIN shops s ON s.id = p.shop_id
    WHERE p.id = ?
  `).get(productId);
  if (!product) return res.status(404).json({ error: 'notFound' });

  // Material owner guard
  if (product.shop_user_id && product.shop_user_id === req.session.userId) {
    return res.status(403).json({ error: 'You cannot rate your own product.' });
  }

  // Duplicate guard
  const existing = db.prepare('SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?')
    .get(productId, req.session.userId);
  if (existing) return res.status(400).json({ error: 'alreadyRated' });

  // Insert review
  db.prepare(
    `INSERT INTO product_reviews (product_id, user_id, stars, review, photo)
     VALUES (?, ?, ?, ?, ?)`
  ).run(productId, req.session.userId, stars, review, photoUrl);

  // Recalculate average and update products.rating
  const avg = db.prepare('SELECT AVG(stars) as avg FROM product_reviews WHERE product_id = ?').get(productId);
  db.prepare('UPDATE products SET rating = ? WHERE id = ?').run(
    Math.round((avg.avg || 0) * 10) / 10,
    productId
  );

  return res.json({ success: true });
}

// GET /api/ratings/worker/:id — all reviews for a worker
router.get('/worker/:id', (req, res) => {
  try {
    const ratings = db.prepare(`
      SELECT r.*, u.name AS customer_name
      FROM ratings r
      JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/ratings/product/:id — all reviews for a product
router.get('/product/:id', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT pr.*, u.name AS reviewer_name
      FROM product_reviews pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.product_id = ?
      ORDER BY pr.created_at DESC
    `).all(req.params.id);
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/ratings/my — worker's received reviews
router.get('/my', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.json({ ratings: [] });
    const ratings = db.prepare(`
      SELECT r.*, u.name AS customer_name
      FROM ratings r
      JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ?
      ORDER BY r.created_at DESC
    `).all(worker.id);
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
