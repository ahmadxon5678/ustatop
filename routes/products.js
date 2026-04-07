const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { region, type, sort } = req.query;
    let query = `SELECT p.*, s.shop_name as seller, s.region as shop_region, s.city as shop_city,
      s.telegram as shop_telegram, s.instagram as shop_instagram, s.phone as shop_phone
      FROM products p LEFT JOIN shops s ON s.id = p.shop_id WHERE 1=1`;
    const params = [];
    if (type) { query += ' AND p.product_type = ?'; params.push(type); }
    if (region) { query += ' AND (s.region = ? OR p.shop_id IS NULL)'; params.push(region); }
    if (sort === 'cheapest') {
      query += ' ORDER BY CAST(p.price AS REAL) ASC';
    } else if (sort === 'expensive') {
      query += ' ORDER BY CAST(p.price AS REAL) DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }
    const products = db.prepare(query).all(...params);
    const isLoggedIn = req.session && req.session.userId;
    const result = products.map(p => ({
      ...p,
      seller_phone: isLoggedIn ? (p.shop_phone || p.seller_phone) : null,
      shop_phone: isLoggedIn ? p.shop_phone : null,
      shop_telegram: p.shop_telegram || null,
      shop_instagram: p.shop_instagram || null
    }));
    res.json({ products: result });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/products — approved shops or admin only
router.post('/', requireApi, (req, res) => {
  try {
    const { product_name, price, description, product_type } = req.body;
    if (!product_name || !price) return res.status(400).json({ error: 'missingFields' });

    let shopId = null;
    if (req.session.userType === 'shop') {
      if (!req.session.shopApproved) return res.status(403).json({ error: 'notApproved' });
      const shop = db.prepare('SELECT id, phone FROM shops WHERE user_id = ?').get(req.session.userId);
      if (!shop) return res.status(403).json({ error: 'notFound' });
      shopId = shop.id;
      // seller_phone stored for legacy fallback; primary display uses shop JOIN
    }

    db.prepare(
      `INSERT INTO products (shop_id, product_name, price, description, product_type, seller_phone)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(shopId, product_name, price, description || '', product_type || '', '');
    res.json({ success: true });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/products/my — shop's own products
router.get('/my', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'shop') return res.status(403).json({ error: 'forbidden' });
    const shop = db.prepare('SELECT id FROM shops WHERE user_id = ?').get(req.session.userId);
    if (!shop) return res.json({ products: [] });
    const products = db.prepare('SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC').all(shop.id);
    res.json({ products });
  } catch (err) {
    console.error('My products error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/products/:id
router.put('/:id', requireApi, (req, res) => {
  try {
    const { product_name, price, description, product_type } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'notFound' });

    // Check ownership
    if (req.session.userType === 'shop') {
      const shop = db.prepare('SELECT id FROM shops WHERE user_id = ?').get(req.session.userId);
      if (!shop || product.shop_id !== shop.id) return res.status(403).json({ error: 'forbidden' });
    }

    db.prepare(
      `UPDATE products SET product_name=?, price=?, description=?, product_type=? WHERE id=?`
    ).run(product_name, price, description, product_type, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireApi, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'notFound' });

    if (req.session.userType === 'shop') {
      const shop = db.prepare('SELECT id FROM shops WHERE user_id = ?').get(req.session.userId);
      if (!shop || product.shop_id !== shop.id) return res.status(403).json({ error: 'forbidden' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/products/shop/info — shop profile
router.get('/shop/info', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'shop') return res.status(403).json({ error: 'forbidden' });
    const shop = db.prepare('SELECT * FROM shops WHERE user_id = ?').get(req.session.userId);
    if (!shop) return res.status(404).json({ error: 'notFound' });
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/products/shop/info
router.put('/shop/info', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'shop') return res.status(403).json({ error: 'forbidden' });
    const { shop_name, owner_name, phone, telegram, instagram, region, city, description } = req.body;
    db.prepare(
      `UPDATE shops SET shop_name=?, owner_name=?, phone=?, telegram=?, instagram=?, region=?, city=?, description=? WHERE user_id=?`
    ).run(shop_name, owner_name, phone, telegram, instagram || '', region, city, description, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
