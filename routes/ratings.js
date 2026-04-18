const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
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
router.post('/', requireApi, upload.single('photo'), async (req, res) => {
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

async function handleWorkerReview(req, res, workerId, stars, review, photoUrl, jobResponseId) {
  const worker = await prisma.worker.findFirst({
    where: { id: workerId }, select: { id: true, user_id: true }
  });
  if (!worker) return res.status(404).json({ error: 'notFound' });

  if (worker.user_id === req.session.userId) {
    return res.status(403).json({ error: 'You cannot rate your own profile.' });
  }

  if (jobResponseId) {
    const jres = await prisma.$queryRaw`
      SELECT jres.id FROM job_responses jres
      JOIN job_requests jr ON jr.id = jres.job_request_id
      WHERE jres.id = ${parseInt(jobResponseId)} AND jres.worker_id = ${workerId} AND jr.user_id = ${req.session.userId}
      LIMIT 1
    `;
    if (!jres.length) return res.status(403).json({ error: 'notAllowed' });
  }

  const existing = await prisma.rating.findFirst({
    where: { worker_id: workerId, customer_id: req.session.userId }
  });
  if (existing) return res.status(400).json({ error: 'alreadyRated' });

  await prisma.rating.create({
    data: {
      worker_id: workerId,
      customer_id: req.session.userId,
      job_response_id: jobResponseId ? parseInt(jobResponseId) : null,
      stars, review, photo: photoUrl
    }
  });

  const avg = await prisma.rating.aggregate({
    where: { worker_id: workerId }, _avg: { stars: true }
  });
  await prisma.worker.update({
    where: { id: workerId },
    data: { rating: Math.round((avg._avg.stars || 0) * 10) / 10 }
  });

  try {
    await prisma.notification.create({
      data: {
        user_id: worker.user_id,
        message_uz: 'Yangi sharh va baho oldingiz!',
        message_ru: 'Вы получили новый отзыв!'
      }
    });
  } catch (_) {}

  return res.json({ success: true });
}

async function handleMaterialReview(req, res, productId, stars, review, photoUrl) {
  const product = await prisma.$queryRaw`
    SELECT p.id, s.user_id AS shop_user_id
    FROM products p LEFT JOIN shops s ON s.id = p.shop_id
    WHERE p.id = ${productId}
    LIMIT 1
  `;
  if (!product.length) return res.status(404).json({ error: 'notFound' });
  const p = product[0];

  if (p.shop_user_id && p.shop_user_id === req.session.userId) {
    return res.status(403).json({ error: 'You cannot rate your own product.' });
  }

  const existing = await prisma.productReview.findFirst({
    where: { product_id: productId, user_id: req.session.userId }
  });
  if (existing) return res.status(400).json({ error: 'alreadyRated' });

  await prisma.productReview.create({
    data: { product_id: productId, user_id: req.session.userId, stars, review, photo: photoUrl }
  });

  const avg = await prisma.productReview.aggregate({
    where: { product_id: productId }, _avg: { stars: true }
  });
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round((avg._avg.stars || 0) * 10) / 10 }
  });

  return res.json({ success: true });
}

// GET /api/ratings/worker/:id — all reviews for a worker
router.get('/worker/:id', async (req, res) => {
  try {
    const ratings = await prisma.$queryRaw`
      SELECT r.*, u.name AS customer_name
      FROM ratings r JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ${parseInt(req.params.id)}
      ORDER BY r.created_at DESC
    `;
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/ratings/product/:id — all reviews for a product
router.get('/product/:id', async (req, res) => {
  try {
    const reviews = await prisma.$queryRaw`
      SELECT pr.*, u.name AS reviewer_name
      FROM product_reviews pr JOIN users u ON u.id = pr.user_id
      WHERE pr.product_id = ${parseInt(req.params.id)}
      ORDER BY pr.created_at DESC
    `;
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/ratings/my — worker's received reviews
router.get('/my', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.json({ ratings: [] });
    const ratings = await prisma.$queryRaw`
      SELECT r.*, u.name AS customer_name
      FROM ratings r JOIN users u ON u.id = r.customer_id
      WHERE r.worker_id = ${worker.id}
      ORDER BY r.created_at DESC
    `;
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
