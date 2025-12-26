export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient permissions',
      });
    }

    next();
  };
};
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient permissions',
      });
    }
    next();
  };
};

export const requireTenantAccess = (paramName = 'tenantId') => {
  return (req, res, next) => {
    const tenantIdFromParam = req.params[paramName];

    // super_admin can access any tenant
    if (req.user.role === 'super_admin') {
      return next();
    }

    // tenant users can access only their own tenant
    if (req.user.tenantId !== tenantIdFromParam) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized tenant access',
      });
    }

    next();
  };
};
