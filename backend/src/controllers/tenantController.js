import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { logAudit } from '../services/auditService.js';

/**
 * API 5: Get Tenant Details
 */
export const getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const tenantResult = await pool.query(
      `SELECT id, name, subdomain, status, subscription_plan,
              max_users, max_projects, created_at
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
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

    return res.json({
      success: true,
      data: {
        ...tenantResult.rows[0],
        stats: {
          totalUsers: Number(stats.rows[0].total_users),
          totalProjects: Number(stats.rows[0].total_projects),
          totalTasks: Number(stats.rows[0].total_tasks),
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
    const { name } = req.body;

    const result = await pool.query(
      `UPDATE tenants
       SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, updated_at`,
      [name, tenantId]
    );

    return res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: result.rows[0],
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
    const result = await pool.query(
      `SELECT id, name, subdomain, status, subscription_plan, created_at
       FROM tenants
       ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: { tenants: result.rows },
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

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, role, created_at
      `,
      [uuidv4(), tenantId, email.toLowerCase(), hash, fullName, role]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.rows[0],
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

    const result = await pool.query(
      `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    return res.json({
      success: true,
      data: { users: result.rows },
    });
  } catch (err) {
    next(err);
  }
};