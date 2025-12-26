export const tenantIsolation = (req, res, next) => {
  const { tenantId, role } = req.user;
  const requestedTenantId =
    req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (role === 'super_admin') {
    return next();
  }

  if (!requestedTenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant context missing',
    });
  }

  if (requestedTenantId !== tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: cross-tenant request',
    });
  }

  next();
};