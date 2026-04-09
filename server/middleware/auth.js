const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization token' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT_SECRET is missing in .env' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // { id, email, role }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
  return next();
}

module.exports = { requireAuth, requireAdmin };

