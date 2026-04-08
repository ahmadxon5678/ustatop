const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');

// GET /api/job-requests
router.get('/', requireApi, (req, res) => {
  try {
    const { profession, region, mine } = req.query;
    let query, params = [];

    if (mine === '1') {
      query = `SELECT jr.*, u.name as poster_name,
        (SELECT COUNT(*) FROM job_responses jresp WHERE jresp.job_request_id = jr.id) as response_count
        FROM job_requests jr JOIN users u ON u.id = jr.user_id
        WHERE jr.user_id = ? AND jr.status IN ('active','completed')
        ORDER BY jr.created_at DESC`;
      params.push(req.session.userId);
    } else {
      // Workers see all active requests with response count, urgent first
      query = `SELECT jr.*, u.name as poster_name,
        u.instagram_username as poster_instagram, u.telegram_username as poster_telegram,
        (SELECT COUNT(*) FROM job_responses jresp WHERE jresp.job_request_id = jr.id) as response_count
        FROM job_requests jr JOIN users u ON u.id = jr.user_id
        WHERE jr.status = 'active'`;
      if (profession) { query += ' AND jr.profession_needed = ?'; params.push(profession); }
      if (region) { query += ' AND jr.region = ?'; params.push(region); }
      query += ' ORDER BY jr.is_urgent DESC, jr.created_at DESC';
    }

    const requests = db.prepare(query).all(...params);

    // For each request, get responses if viewing own
    const result = requests.map(jr => {
      const responses = db.prepare(`
        SELECT jres.*, w.name as worker_name, w.profession, w.phone as worker_phone
        FROM job_responses jres
        JOIN workers w ON w.id = jres.worker_id
        WHERE jres.job_request_id = ?
      `).all(jr.id);
      // Check if current user has already rated any worker from this request
      const canRate = responses.map(r => {
        const hasRated = db.prepare('SELECT id FROM ratings WHERE worker_id = ? AND customer_id = ?')
          .get(r.worker_id, req.session.userId);
        return { ...r, hasRated: !!hasRated };
      });
      return { ...jr, responses: canRate };
    });

    res.json({ requests: result });
  } catch (err) {
    console.error('Job requests error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/job-requests
router.post('/', requireApi, (req, res) => {
  try {
    const { title, description, profession_needed, region, city, phone, is_urgent, budget_from, budget_to } = req.body;
    if (!title) return res.status(400).json({ error: 'missingFields' });

    const user = db.prepare('SELECT phone, region, city FROM users WHERE id = ?').get(req.session.userId);
    const finalPhone = phone || (user && user.phone) || '';
    const finalRegion = region || (user && user.region) || '';
    const finalCity = city || (user && user.city) || '';

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      `INSERT INTO job_requests (user_id, title, description, profession_needed, region, city, phone, expires_at, is_urgent, budget_from, budget_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.session.userId, title, description || '', profession_needed || '', finalRegion, finalCity, finalPhone, expiresAt,
      is_urgent ? 1 : 0,
      budget_from ? parseInt(budget_from) : null,
      budget_to ? parseInt(budget_to) : null
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Post job request error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/job-requests/:id/complete
router.put('/:id/complete', requireApi, (req, res) => {
  try {
    const jr = db.prepare('SELECT * FROM job_requests WHERE id = ?').get(req.params.id);
    if (!jr) return res.status(404).json({ error: 'notFound' });
    if (jr.user_id !== req.session.userId) return res.status(403).json({ error: 'forbidden' });
    db.prepare("UPDATE job_requests SET status = 'completed' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Complete job request error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// DELETE /api/job-requests/:id
router.delete('/:id', requireApi, (req, res) => {
  try {
    const jr = db.prepare('SELECT * FROM job_requests WHERE id = ?').get(req.params.id);
    if (!jr) return res.status(404).json({ error: 'notFound' });
    if (jr.user_id !== req.session.userId) return res.status(403).json({ error: 'forbidden' });
    db.prepare("UPDATE job_requests SET status = 'deleted' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete job request error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
