import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, requireTenantAccess } from '../middleware/authorize.js';
import {
  getTenantDetails,
  updateTenant,
  listTenants,
  addUser,
  listTenantUsers,
} from '../controllers/tenantController.js';
console.log('tenantRoutes loaded');

const router = express.Router();

/**
 * Tenant APIs
 */

// API 5: Get Tenant Details
router.get(
  '/:tenantId',
  authenticate,
  requireTenantAccess('tenantId'),
  getTenantDetails
);

// API 6: Update Tenant
router.put(
  '/:tenantId',
  authenticate,
  authorize('tenant_admin', 'super_admin'),
  requireTenantAccess('tenantId'),
  updateTenant
);

// API 7: List All Tenants (super_admin only)
router.get(
  '/',
  authenticate,
  authorize('super_admin'),
  listTenants
);

// API 8: Add User to Tenant
router.post(
  '/:tenantId/users',
  authenticate,
  authorize('tenant_admin'),
  requireTenantAccess('tenantId'),
  addUser
);

// API 9: List Tenant Users
router.get(
  '/:tenantId/users',
  authenticate,
  requireTenantAccess('tenantId'),
  listTenantUsers
);

export default router;