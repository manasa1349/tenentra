import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { logAudit } from '../services/auditService.js';

const PLAN_LIMITS = {
  free: { maxUsers: 5, maxProjects: 3 },
  pro: { maxUsers: 25, maxProjects: 15 },
  enterprise: { maxUsers: 100, maxProjects: 50 },
};

/**
 * API 5: Get Tenant Details
 */
export const getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const tenantResult = await pool.query(
      `
      SELECT id, name, subdomain, status, subscription_plan,
             max_users, max_projects, created_at
      FROM tenants
      WHERE id = $1
      `,
      [tenantId]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
        data: null,
      });
    }

    const stats = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) AS total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) AS total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) AS total_tasks
      `,
      [tenantId]
    );

    const tenant = tenantResult.rows[0];
    const summary = stats.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Tenant details fetched successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: Number(summary.total_users),
          totalProjects: Number(summary.total_projects),
          totalTasks: Number(summary.total_tasks),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 6: Update Tenant
 */
export const updateTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
    const requester = req.user;

    const tenantResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
        data: null,
      });
    }

    if (requester.role === 'tenant_admin') {
      const hasRestrictedField =
        status !== undefined ||
        subscriptionPlan !== undefined ||
        maxUsers !== undefined ||
        maxProjects !== undefined;

      if (hasRestrictedField) {
        return res.status(403).json({
          success: false,
          message: 'Tenant admins can only update tenant name',
          data: null,
        });
      }
    }

    const current = tenantResult.rows[0];

    const nextPlan = subscriptionPlan || current.subscription_plan;
    const defaultLimitsForPlan = PLAN_LIMITS[nextPlan] || {
      maxUsers: current.max_users,
      maxProjects: current.max_projects,
    };

    const updatedValues = {
      name: name ?? current.name,
      status: requester.role === 'super_admin' ? status ?? current.status : current.status,
      subscriptionPlan:
        requester.role === 'super_admin'
          ? subscriptionPlan ?? current.subscription_plan
          : current.subscription_plan,
      maxUsers:
        requester.role === 'super_admin'
          ? maxUsers ?? (subscriptionPlan ? defaultLimitsForPlan.maxUsers : current.max_users)
          : current.max_users,
      maxProjects:
        requester.role === 'super_admin'
          ? maxProjects ?? (subscriptionPlan ? defaultLimitsForPlan.maxProjects : current.max_projects)
          : current.max_projects,
    };

    const result = await pool.query(
      `
      UPDATE tenants
      SET
        name = $1,
        status = $2,
        subscription_plan = $3,
        max_users = $4,
        max_projects = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, updated_at
      `,
      [
        updatedValues.name,
        updatedValues.status,
        updatedValues.subscriptionPlan,
        updatedValues.maxUsers,
        updatedValues.maxProjects,
        tenantId,
      ]
    );

    await logAudit({
      tenantId,
      userId: requester.id,
      action: 'UPDATE_TENANT',
      entityType: 'tenant',
      entityId: tenantId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 7: List All Tenants (super_admin)
 */
export const listTenants = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const { status, subscriptionPlan } = req.query;

    const filters = [];
    const params = [];
    let index = 1;

    if (status) {
      filters.push(`t.status = $${index++}`);
      params.push(status);
    }

    if (subscriptionPlan) {
      filters.push(`t.subscription_plan = $${index++}`);
      params.push(subscriptionPlan);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tenants t ${whereClause}`,
      params
    );

    params.push(limit, offset);

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        t.subdomain,
        t.status,
        t.subscription_plan,
        t.created_at,
        COUNT(DISTINCT u.id)::int AS total_users,
        COUNT(DISTINCT p.id)::int AS total_projects
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN projects p ON p.tenant_id = t.id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      params
    );

    const totalTenants = countResult.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(totalTenants / limit));

    return res.status(200).json({
      success: true,
      message: 'Tenants fetched successfully',
      data: {
        tenants: result.rows.map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status,
          subscriptionPlan: tenant.subscription_plan,
          totalUsers: tenant.total_users,
          totalProjects: tenant.total_projects,
          createdAt: tenant.created_at,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalTenants,
          limit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 8: Add User
 */
export const addUser = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { email, password, fullName, role = 'user' } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'email, password and fullName are required',
        data: null,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        data: null,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
        data: null,
      });
    }

    if (!['user', 'tenant_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed: user, tenant_admin',
        data: null,
      });
    }

    const tenantResult = await pool.query(
      'SELECT id, max_users, status FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
        data: null,
      });
    }

    if (tenantResult.rows[0].status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active',
        data: null,
      });
    }

    const usersCountResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    const currentUsers = usersCountResult.rows[0].count;
    const maxUsers = tenantResult.rows[0].max_users;

    if (currentUsers >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: 'Subscription limit reached for users',
        data: null,
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant',
        data: null,
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, tenant_id, email, full_name, role, is_active, created_at
      `,
      [uuidv4(), tenantId, normalizedEmail, hash, fullName.trim(), role]
    );

    const created = result.rows[0];

    await logAudit({
      tenantId,
      userId: req.user.id,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: created.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: created.id,
        email: created.email,
        fullName: created.full_name,
        role: created.role,
        tenantId: created.tenant_id,
        isActive: created.is_active,
        createdAt: created.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 9: List Tenant Users
 */
export const listTenantUsers = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const search = (req.query.search || '').trim();
    const role = req.query.role;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const filters = ['tenant_id = $1'];
    const params = [tenantId];
    let index = 2;

    if (search) {
      filters.push(`(full_name ILIKE $${index} OR email ILIKE $${index})`);
      params.push(`%${search}%`);
      index += 1;
    }

    if (role) {
      filters.push(`role = $${index}`);
      params.push(role);
      index += 1;
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
      params
    );

    params.push(limit, offset);

    const result = await pool.query(
      `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      params
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users: result.rows.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
        })),
        total,
        pagination: {
          currentPage: page,
          totalPages,
          limit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
