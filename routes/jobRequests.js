const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { Prisma } = require('@prisma/client');
const { requireApi } = require('../middleware/auth');

// GET /api/job-requests
router.get('/', requireApi, async (req, res) => {
  try {
    const { profession, region, mine } = req.query;
    let requests;

    if (mine === '1') {
      requests = await prisma.$queryRaw`
        SELECT jr.*, u.name as poster_name,
          (SELECT COUNT(*)::int FROM job_responses jresp WHERE jresp.job_request_id = jr.id) as response_count
        FROM job_requests jr JOIN users u ON u.id = jr.user_id
        WHERE jr.user_id = ${req.session.userId} AND jr.status IN ('active','completed')
        ORDER BY jr.created_at DESC
      `;
    } else {
      let whereClause = Prisma.sql`jr.status = 'active'`;
      if (profession) whereClause = Prisma.sql`${whereClause} AND jr.profession_needed = ${profession}`;
      if (region) whereClause = Prisma.sql`${whereClause} AND jr.region = ${region}`;

      requests = await prisma.$queryRaw`
        SELECT jr.*, u.name as poster_name,
          u.instagram_username as poster_instagram, u.telegram_username as poster_telegram,
          (SELECT COUNT(*)::int FROM job_responses jresp WHERE jresp.job_request_id = jr.id) as response_count
        FROM job_requests jr JOIN users u ON u.id = jr.user_id
        WHERE ${whereClause}
        ORDER BY jr.is_urgent DESC, jr.created_at DESC
      `;
    }

    const result = await Promise.all(requests.map(async jr => {
      const responses = await prisma.$queryRaw`
        SELECT jres.*, w.name as worker_name, w.profession, w.phone as worker_phone
        FROM job_responses jres
        JOIN workers w ON w.id = jres.worker_id
        WHERE jres.job_request_id = ${jr.id}
      `;
      const canRate = await Promise.all(responses.map(async r => {
        const hasRated = await prisma.rating.findFirst({
          where: { worker_id: r.worker_id, customer_id: req.session.userId },
          select: { id: true }
        });
        return { ...r, hasRated: !!hasRated };
      }));
      return { ...jr, responses: canRate };
    }));

    res.json({ requests: result });
  } catch (err) {
    console.error('Job requests error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// POST /api/job-requests
router.post('/', requireApi, async (req, res) => {
  try {
    const { title, description, profession_needed, region, city, phone, is_urgent, budget_from, budget_to } = req.body;
    if (!title) return res.status(400).json({ error: 'missingFields' });

    const user = await prisma.user.findFirst({
      where: { id: req.session.userId },
      select: { phone: true, region: true, city: true }
    });
    const finalPhone = phone || (user && user.phone) || '';
    const finalRegion = region || (user && user.region) || '';
    const finalCity = city || (user && user.city) || '';

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.jobRequest.create({
      data: {
        user_id: req.session.userId, title,
        description: description || '',
        profession_needed: profession_needed || '',
        region: finalRegion, city: finalCity, phone: finalPhone,
        expires_at: expiresAt,
        is_urgent: !!is_urgent,
        budget_from: budget_from ? parseInt(budget_from) : null,
        budget_to: budget_to ? parseInt(budget_to) : null
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Post job request error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// PUT /api/job-requests/:id/complete
router.put('/:id/complete', requireApi, async (req, res) => {
  try {
    const jr = await prisma.jobRequest.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!jr) return res.status(404).json({ error: 'notFound' });
    if (jr.user_id !== req.session.userId) return res.status(403).json({ error: 'forbidden' });
    await prisma.jobRequest.update({
      where: { id: parseInt(req.params.id) }, data: { status: 'completed' }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Complete job request error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// DELETE /api/job-requests/:id
router.delete('/:id', requireApi, async (req, res) => {
  try {
    const jr = await prisma.jobRequest.findFirst({ where: { id: parseInt(req.params.id) } });
    if (!jr) return res.status(404).json({ error: 'notFound' });
    if (jr.user_id !== req.session.userId) return res.status(403).json({ error: 'forbidden' });
    await prisma.jobRequest.update({
      where: { id: parseInt(req.params.id) }, data: { status: 'deleted' }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete job request error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
