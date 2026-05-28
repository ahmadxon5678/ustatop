const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { Prisma } = require('@prisma/client');
const { requireApi } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function uploadsBaseDir() {
  return process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR, 'uploads')
    : path.join(__dirname, '..', 'public', 'uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsBaseDir(), 'products');
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

function productImageUrl(file) {
  return '/uploads/products/' + file.filename;
}

async function deleteProductImageFiles(productId) {
  const images = await prisma.productImage.findMany({ where: { product_id: productId } });
  images.forEach(img => {
    if (!img.image_url || !img.image_url.startsWith('/uploads/products/')) return;
    const filename = path.basename(img.image_url);
    const filePath = path.join(uploadsBaseDir(), 'products', filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
  });
}

// GET /api/products/shop/info — must be before /:id
router.get('/shop/info', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'shop') return res.status(403).json({ error: 'forbidden' });
    const shop = await prisma.shop.findFirst({ where: { user_id: req.session.userId } });
    if (!shop) return res.status(404).json({ error: 'notFound' });
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/products/my — must be before /:id
router.get('/my', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'shop') return res.status(403).json({ error: 'forbidden' });
    const shop = await prisma.shop.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!shop) return res.json({ products: [] });
    const products = await prisma.product.findMany({
      where: { shop_id: shop.id },
      orderBy: { created_at: 'desc' },
      include: { images: { orderBy: { sort_order: 'asc' } } }
    });
    res.json({ products });
  } catch (err) {
    console.error('My products error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { type, region, sort } = req.query;

    let whereClause = Prisma.sql`1=1`;
    if (type) whereClause = Prisma.sql`${whereClause} AND p.product_type = ${type}`;
    if (region) whereClause = Prisma.sql`${whereClause} AND (s.region = ${region} OR p.shop_id IS NULL)`;

    let orderClause;
    if (sort === 'cheapest') {
      orderClause = Prisma.sql`ORDER BY CAST(p.price AS REAL) ASC`;
    } else if (sort === 'expensive') {
      orderClause = Prisma.sql`ORDER BY CAST(p.price AS REAL) DESC`;
    } else {
      orderClause = Prisma.sql`ORDER BY p.created_at DESC`;
    }

    const products = await prisma.$queryRaw`
      SELECT p.*, s.shop_name as seller, s.region as shop_region, s.city as shop_city,
        s.telegram as shop_telegram, s.instagram as shop_instagram, s.phone as shop_phone
      FROM products p LEFT JOIN shops s ON s.id = p.shop_id
      WHERE ${whereClause}
      ${orderClause}
    `;

    const productIds = products.map(p => Number(p.id));
    const imageRows = productIds.length > 0
      ? await prisma.productImage.findMany({
          where: { product_id: { in: productIds } },
          orderBy: { sort_order: 'asc' }
        })
      : [];
    const imagesByProduct = {};
    imageRows.forEach(img => {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      imagesByProduct[img.product_id].push(img.image_url);
    });

    const isLoggedIn = req.session && req.session.userId;
    const result = products.map(p => ({
      ...p,
      seller_phone: isLoggedIn ? (p.shop_phone || p.seller_phone) : null,
      shop_phone: isLoggedIn ? p.shop_phone : null,
      shop_telegram: p.shop_telegram || null,
      shop_instagram: p.shop_instagram || null,
      images: imagesByProduct[Number(p.id)] || []
    }));
    res.json({ products: result });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/products — approved shops or admin only
router.post('/', requireApi, upload.array('images', 3), async (req, res) => {
  try {
    const { product_name, price, description, product_type } = req.body;
    if (!product_name || !price) return res.status(400).json({ error: 'missingFields' });

    let shopId = null;
    if (req.session.userType === 'shop') {
      if (!req.session.shopApproved) return res.status(403).json({ error: 'notApproved' });
      const shop = await prisma.shop.findFirst({
        where: { user_id: req.session.userId }, select: { id: true }
      });
      if (!shop) return res.status(403).json({ error: 'notFound' });
      shopId = shop.id;
    }

    await prisma.product.create({
      data: {
        shop_id: shopId, product_name, price,
        description: description || '', product_type: product_type || '',
        seller_phone: '',
        images: {
          create: (req.files || []).map((file, index) => ({
            image_url: productImageUrl(file),
            sort_order: index
          }))
        }
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/products/shop/info
router.put('/shop/info', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'shop') return res.status(403).json({ error: 'forbidden' });
    const { shop_name, owner_name, phone, telegram, instagram, region, city, description } = req.body;
    await prisma.shop.update({
      where: { user_id: req.session.userId },
      data: { shop_name, owner_name, phone, telegram, instagram: instagram || '', region, city, description }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/products/:id
router.put('/:id', requireApi, upload.array('images', 3), async (req, res) => {
  try {
    const { product_name, price, description, product_type } = req.body;
    const productId = parseInt(req.params.id);
    const product = await prisma.product.findFirst({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'notFound' });

    if (req.session.userType === 'shop') {
      const shop = await prisma.shop.findFirst({
        where: { user_id: req.session.userId }, select: { id: true }
      });
      if (!shop || product.shop_id !== shop.id) return res.status(403).json({ error: 'forbidden' });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { product_name, price, description, product_type }
    });
    if (req.files && req.files.length > 0) {
      await deleteProductImageFiles(productId);
      await prisma.productImage.deleteMany({ where: { product_id: productId } });
      await prisma.productImage.createMany({
        data: req.files.map((file, index) => ({
          product_id: productId,
          image_url: productImageUrl(file),
          sort_order: index
        }))
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireApi, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'notFound' });

    if (req.session.userType === 'shop') {
      const shop = await prisma.shop.findFirst({
        where: { user_id: req.session.userId }, select: { id: true }
      });
      if (!shop || product.shop_id !== shop.id) return res.status(403).json({ error: 'forbidden' });
    }

    await deleteProductImageFiles(parseInt(req.params.id));
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
