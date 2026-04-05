function requireAdmin(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return res.redirect('/');
  }
  next();
}

module.exports = { requireAdmin };
