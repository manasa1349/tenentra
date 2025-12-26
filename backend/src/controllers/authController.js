import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { logAudit } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * =========================
 * API 1: Register Tenant
 * =========================
 */
export const registerTenant = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors.array(),
    });
  }

  const {
    tenantName,
    subdomain,
    adminEmail,
    adminPassword,
    adminFullName,
  } = req.body;

  const normalizedSubdomain = subdomain.trim().toLowerCase();
  const normalizedEmail = adminEmail.trim().toLowerCase();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check subdomain uniqueness
    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE subdomain = $1',
      [normalizedSubdomain]
    );

    if (existingTenant.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists',
      });
    }

    const tenantId = uuidv4();
    const adminUserId = uuidv4();
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create tenant (default FREE plan)
    await client.query(
      `
      INSERT INTO tenants (
        id, name, subdomain, status, subscription_plan, max_users, max_projects
      )
      VALUES ($1, $2, $3, 'active', 'free', 5, 3)
      `,
      [tenantId, tenantName, normalizedSubdomain]
    );

    // Create tenant admin user
    await client.query(
      `
      INSERT INTO users (
        id, tenant_id, email, password_hash, full_name, role
      )
      VALUES ($1, $2, $3, $4, $5, 'tenant_admin')
      `,
      [adminUserId, tenantId, normalizedEmail, passwordHash, adminFullName]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId,
        subdomain: normalizedSubdomain,
        adminUser: {
          id: adminUserId,
          email: normalizedEmail,
          fullName: adminFullName,
          role: 'tenant_admin',
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * =========================
 * API 2: Login (Tenant + Super Admin)
 * =========================
 */
export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors.array(),
    });
  }

  const { email, password, tenantSubdomain } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  try {
    /**
     * =========================
     * SUPER ADMIN LOGIN
     * =========================
     */
    const superAdminResult = await pool.query(
      `
      SELECT * FROM users
      WHERE email = $1
        AND role = 'super_admin'
        AND is_active = true
      `,
      [normalizedEmail]
    );

    if (superAdminResult.rowCount > 0) {
      const user = superAdminResult.rows[0];

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
      console.log('JWT SECRET =', env.jwt.secret);
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenant_id,
          role: user.role,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
      );

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: null,
          },
          token,
          expiresIn: 86400,
        },
      });
    }

    /**
     * =========================
     * TENANT USER LOGIN
     * =========================
     */
    if (!tenantSubdomain) {
      return res.status(400).json({
        success: false,
        message: 'Tenant subdomain is required',
      });
    }

    const normalizedSubdomain = tenantSubdomain.trim().toLowerCase();

    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE subdomain = $1',
      [normalizedSubdomain]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const tenant = tenantResult.rows[0];

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active',
      });
    }

    const userResult = await pool.query(
      `
      SELECT * FROM users
      WHERE email = $1
        AND tenant_id = $2
        AND is_active = true
      `,
      [normalizedEmail, tenant.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    await logAudit({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
        },
        token,
        expiresIn: 86400,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================
 * API 3: Get Current User
 * =========================
 */
export const getMe = async (req, res, next) => {
  try {
    const userResult = await pool.query(
      `
      SELECT u.id, u.email, u.full_name, u.role, u.is_active,
             t.id AS tenant_id, t.name, t.subdomain,
             t.subscription_plan, t.max_users, t.max_projects
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1
      `,
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const row = userResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        isActive: row.is_active,
        tenant: row.tenant_id
          ? {
              id: row.tenant_id,
              name: row.name,
              subdomain: row.subdomain,
              subscriptionPlan: row.subscription_plan,
              maxUsers: row.max_users,
              maxProjects: row.max_projects,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================
 * API 4: Logout
 * =========================
 */
export const logout = async (req, res) => {
  await logAudit({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action: 'LOGOUT',
    entityType: 'user',
    entityId: req.user.id,
    ipAddress: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};