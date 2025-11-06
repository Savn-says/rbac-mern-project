const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: 'unknown',
      role: 'unknown',
      action: 'auth:verify',
      outcome: 'fail_no_token'
    }));
    return res.status(401).json({ message: 'No token, authorization denied! 🔒' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    userId: decoded.userId,
    role: decoded.role,
    action: 'auth:verify',
    outcome: 'success'
  }));
  next();
} catch (error) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    userId: 'unknown',
    role: 'unknown',
    action: 'auth:verify',
    outcome: 'fail_invalid_token'
  }));
  res.status(401).json({ message: 'Invalid token! 🔒' });
}
};

module.exports = authMiddleware;