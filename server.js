require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');

const app = express();

// ── Session store ──
const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: process.env.DATA_DIR || './' }),
  secret: process.env.SESSION_SECRET || 'ustatop-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 * 7 } // 7 days
}));

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// When DATA_DIR is set (production), also serve uploads from the persistent volume
if (process.env.DATA_DIR) {
  const fs = require('fs');
  const uploadsDir = path.join(process.env.DATA_DIR, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
}

// ── Routes ──
const authRoutes = require('./routes/auth');
const workersRoutes = require('./routes/workers');
const productsRoutes = require('./routes/products');
const jobRequestsRoutes = require('./routes/jobRequests');
const jobResponsesRoutes = require('./routes/jobResponses');
const ratingsRoutes = require('./routes/ratings');
const bookmarksRoutes = require('./routes/bookmarks');
const notificationsRoutes = require('./routes/notifications');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/job-requests', jobRequestsRoutes);
app.use('/api/job-responses', jobResponsesRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// ── Page routes ──
const { requireLogin, requireCustomer, requireWorker, requireShop } = require('./middleware/auth');
const { requireAdmin } = require('./middleware/adminAuth');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'intro.html')));

app.get('/dashboard', requireLogin, (req, res) => {
  const t = req.session.userType;
  if (t === 'customer') return res.redirect('/dashboard/customer');
  if (t === 'worker')   return res.redirect('/dashboard/worker');
  if (t === 'shop')     return res.redirect('/dashboard/shop');
  res.redirect('/');
});

app.get('/dashboard/customer', requireLogin, requireCustomer, (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'dashboard-customer.html')));

app.get('/dashboard/worker', requireLogin, requireWorker, (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'dashboard-worker.html')));

app.get('/dashboard/shop', requireLogin, requireShop, (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'dashboard-shop.html')));

app.get('/workers', (req, res) => res.sendFile(path.join(__dirname, 'views', 'workers.html')));
app.get('/workers/:id', (req, res) => res.sendFile(path.join(__dirname, 'views', 'worker-profile.html')));
app.get('/marketplace', (req, res) => res.sendFile(path.join(__dirname, 'views', 'marketplace.html')));

app.get('/admin-ustatop-secure-2024', requireAdmin, (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// ── Job expiry check ──
function expireOldRequests() {
  try {
    const result = db.prepare(
      "UPDATE job_requests SET status = 'expired' WHERE expires_at < datetime('now') AND status = 'active'"
    ).run();
    if (result.changes > 0) console.log(`Expired ${result.changes} job request(s)`);
  } catch (err) {
    console.error('Expiry check error:', err);
  }
}

expireOldRequests();
setInterval(expireOldRequests, 24 * 60 * 60 * 1000);

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: 'serverError' });
  } else {
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Usta TOP server running: http://localhost:${PORT}`);
});
