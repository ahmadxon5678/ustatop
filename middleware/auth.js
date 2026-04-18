const prisma = require('../config/database');

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

async function requireWorkerApproved(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'notLoggedIn' });
    }
    const worker = await prisma.worker.findFirst({
      where: { user_id: req.session.userId },
      select: { approved: true }
    });
    if (!worker || !worker.approved) {
      return res.status(403).json({ error: 'notApproved' });
    }
    next();
  } catch (err) {
    console.error('requireWorkerApproved error:', err);
    return res.status(500).json({ error: 'serverError' });
  }
}

module.exports = { requireLogin, requireCustomer, requireWorker, requireShop, requireApi, requireWorkerApproved, getCorrectDashboard };
