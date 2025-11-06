// Role & Permission Matrix (simple object—easy to expand)
const permissions = {
  Viewer: ['posts:read'],  // Can only read
  Editor: ['posts:read', 'posts:create', 'posts:update:own', 'posts:delete:own'],  // Own content only
  Admin: ['posts:read', 'posts:create', 'posts:update', 'posts:delete', 'users:manage']  // Full access
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: 'unknown',
        role: 'unknown',
        action: `perm:${permission}`,
        outcome: 'fail_no_user'
      }));
      return res.status(401).json({ message: 'User not authenticated!' });
    }

    const userRole = req.user.role;
    const allowed = permissions[userRole] || [];

    const hasPerm = allowed.some(p => {
      if (p === permission) return true;
      if (!permission.endsWith(':own') && p === permission + ':own') return true;
      if (permission.endsWith(':own') && p === permission.split(':own')[0]) return true;
      return false;
    });

    if (!hasPerm) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: userRole,
        action: `perm:${permission}`,
        outcome: 'fail_denied'
      }));
      return res.status(403).json({ message: `Access denied: ${permission} not allowed for ${userRole}! 🚫` });
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: userRole,
      action: `perm:${permission}`,
      outcome: 'success'
    }));
    next();
  };
};

module.exports = checkPermission;