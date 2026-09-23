function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  
  res.redirect('/login');
}

module.exports = { requireAuth };
