/**
 * Middleware to enforce user roles and identity checks
 */

// Role-only check (e.g. admin only)
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// Role one-of-many check
const checkAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// Allow only if user is acting on their own ID (e.g. /users/:id)
const isSelf = (paramField = 'id') => {
  return (req, res, next) => {
    if (!req.user || req.user.sub !== req.params[paramField]) {
      return res.status(403).json({ message: 'Access denied: not your resource' });
    }
    next();
  };
};

// Allow if user is acting on self OR is an admin
const isSelfOrAdmin = (paramField = 'id') => {
  return (req, res, next) => {
    if (!req.user) return res.status(403).json({ message: 'Access denied' });
    if (req.user.sub === req.params[paramField] || req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Access denied: not your resource or admin' });
  };
};

// Field-based self check (e.g. body.user_id === req.user.sub)
const isSame = (sourceField = 'user_id', location = 'body') => {
  return (req, res, next) => {
    const target = req[location]?.[sourceField];
    if (req.user?.sub !== target) {
      return res.status(403).json({ message: 'Access denied: not your resource' });
    }
    next();
  };
};

module.exports = {
  checkRole,
  checkAnyRole,
  isSelf,
  isSelfOrAdmin,
  isSame
};
