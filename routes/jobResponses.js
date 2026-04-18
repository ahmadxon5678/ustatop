const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireApi } = require('../middleware/auth');

// POST /api/job-responses — worker responds to a job request
router.post('/', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });

    const workerRecord = await prisma.worker.findFirst({
      where: { user_id: req.session.userId },
      select: { id: true, approved: true }
    });
    if (!workerRecord || !workerRecord.approved) return res.status(403).json({ error: 'notApproved' });

    const { job_request_id, message, price_from, price_to, price_note } = req.body;
    if (!job_request_id || !message) return res.status(400).json({ error: 'missingFields' });

    const jr = await prisma.jobRequest.findFirst({
      where: { id: parseInt(job_request_id), status: 'active' }
    });
    if (!jr) return res.status(404).json({ error: 'notFound' });

    const existing = await prisma.jobResponse.findFirst({
      where: { job_request_id: parseInt(job_request_id), worker_id: workerRecord.id }
    });
    if (existing) return res.status(400).json({ error: 'alreadyResponded' });

    await prisma.jobResponse.create({
      data: {
        job_request_id: parseInt(job_request_id),
        worker_id: workerRecord.id,
        message,
        price_from: price_from ? parseInt(price_from) : null,
        price_to: price_to ? parseInt(price_to) : null,
        price_note: price_note || null
      }
    });

    try {
      await prisma.notification.create({
        data: {
          user_id: jr.user_id,
          message_uz: `"${jr.title}" buyurtmangizga usta javob berdi`,
          message_ru: `Мастер ответил на вашу заявку "${jr.title}"`
        }
      });
    } catch(_) {}

    res.json({ success: true });
  } catch (err) {
    console.error('Job response error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/job-responses/my — worker's own responses
router.get('/my', requireApi, async (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId }, select: { id: true }
    });
    if (!worker) return res.json({ responses: [] });

    const responses = await prisma.$queryRaw`
      SELECT jres.*, jr.title, jr.description, jr.region, jr.city, jr.phone as requester_phone,
             u.name as requester_name
      FROM job_responses jres
      JOIN job_requests jr ON jr.id = jres.job_request_id
      JOIN users u ON u.id = jr.user_id
      WHERE jres.worker_id = ${worker.id}
      ORDER BY jres.created_at DESC
    `;

    res.json({ responses });
  } catch (err) {
    console.error('My responses error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
