const db = require('../config/database');

function getCorrectDashboard(userType) {
  if (userType === 'customer') return '/dashboard/customer';
  if (userType === 'worker')   return '/dashboard/worker';
  if (userType === 'shop')     return '/dashboard/shop';
  return '/';
}

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'notLoggedIn' });
    }
    return res.redirect('/');
  }
  next();
}

function requireCustomer(req, res, next) {
  if (req.session.userType !== 'customer') {
    return res.redirect(getCorrectDashboard(req.session.userType));
  }
  next();
}

function requireWorker(req, res, next) {
  if (req.session.userType !== 'worker') {
    return res.redirect(getCorrectDashboard(req.session.userType));
  }
  next();
}

function requireShop(req, res, next) {
  if (req.session.userType !== 'shop') {
    return res.redirect(getCorrectDashboard(req.session.userType));
  }
  next();
}

function requireApi(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'notLoggedIn' });
  }
  next();
}

function requireWorkerApproved(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'notLoggedIn' });
  }
  const worker = db.prepare('SELECT approved FROM workers WHERE user_id = ?').get(req.session.userId);
  if (!worker || worker.approved !== 1) {
    return res.status(403).json({ error: 'notApproved' });
  }
  next();
}

module.exports = { requireLogin, requireCustomer, requireWorker, requireShop, requireApi, requireWorkerApproved, getCorrectDashboard };
