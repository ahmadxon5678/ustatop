const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireApi } = require('../middleware/auth');

// POST /api/job-responses — worker responds to a job request
router.post('/', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });

    // Check approval from DB (not session cache)
    const workerRecord = db.prepare('SELECT id, approved FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!workerRecord || workerRecord.approved !== 1) return res.status(403).json({ error: 'notApproved' });

    const { job_request_id, message, price_from, price_to, price_note } = req.body;
    if (!job_request_id || !message) return res.status(400).json({ error: 'missingFields' });

    const jr = db.prepare("SELECT * FROM job_requests WHERE id = ? AND status = 'active'").get(job_request_id);
    if (!jr) return res.status(404).json({ error: 'notFound' });

    // Check not already responded
    const existing = db.prepare('SELECT id FROM job_responses WHERE job_request_id = ? AND worker_id = ?')
      .get(job_request_id, workerRecord.id);
    if (existing) return res.status(400).json({ error: 'alreadyResponded' });

    db.prepare('INSERT INTO job_responses (job_request_id, worker_id, message, price_from, price_to, price_note) VALUES (?, ?, ?, ?, ?, ?)')
      .run(job_request_id, workerRecord.id, message,
        price_from ? parseInt(price_from) : null,
        price_to ? parseInt(price_to) : null,
        price_note || null);

    // Notify the job poster
    try {
      db.prepare(
        'INSERT INTO notifications (user_id, message_uz, message_ru) VALUES (?, ?, ?)'
      ).run(jr.user_id,
        `"${jr.title}" buyurtmangizga usta javob berdi`,
        `Мастер ответил на вашу заявку "${jr.title}"`
      );
    } catch(_) {}

    res.json({ success: true });
  } catch (err) {
    console.error('Job response error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// GET /api/job-responses/my — worker's own responses
router.get('/my', requireApi, (req, res) => {
  try {
    if (req.session.userType !== 'worker') return res.status(403).json({ error: 'forbidden' });
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.session.userId);
    if (!worker) return res.json({ responses: [] });

    const responses = db.prepare(`
      SELECT jres.*, jr.title, jr.description, jr.region, jr.city, jr.phone as requester_phone,
             u.name as requester_name
      FROM job_responses jres
      JOIN job_requests jr ON jr.id = jres.job_request_id
      JOIN users u ON u.id = jr.user_id
      WHERE jres.worker_id = ?
      ORDER BY jres.created_at DESC
    `).all(worker.id);

    res.json({ responses });
  } catch (err) {
    console.error('My responses error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

module.exports = router;
