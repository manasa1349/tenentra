import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { logAudit } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const PLAN_LIMITS = {
  free: { maxUsers: 5, maxProjects: 3 },
  pro: { maxUsers: 25, maxProjects: 15 },
  enterprise: { maxUsers: 100, maxProjects: 50 },
};

const mapPreferences = (row) => ({
  emailNotifications: row.email_notifications,
  taskDueReminders: row.task_due_reminders,
  weeklySummary: row.weekly_summary,
  defaultTaskView: row.default_task_view,
  updatedAt: row.updated_at,
});

const ensureUserPreferencesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_notifications BOOLEAN NOT NULL DEFAULT true,
      task_due_reminders BOOLEAN NOT NULL DEFAULT true,
      weekly_summary BOOLEAN NOT NULL DEFAULT false,
      default_task_view VARCHAR(20) NOT NULL DEFAULT 'board',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_default_task_view CHECK (default_task_view IN ('board', 'list'))
    )
  `);
};

const toTokenExpirySeconds = (expiresIn) => {
  if (typeof expiresIn === 'number') return expiresIn;
  if (typeof expiresIn !== 'string') return 86400;

  const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return 86400;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 's') return value;
  if (unit === 'm') return value * 60;
  if (unit === 'h') return value * 3600;
  if (unit === 'd') return value * 86400;

  return 86400;
};

/**
 * API 1: Register Tenant
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

    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE subdomain = $1',
      [normalizedSubdomain]
    );

    if (existingTenant.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists',
        data: null,
      });
    }

    const tenantId = uuidv4();
    const adminUserId = uuidv4();
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await client.query(
      `
      INSERT INTO tenants (
        id, name, subdomain, status, subscription_plan, max_users, max_projects
      )
      VALUES ($1, $2, $3, 'active', 'free', $4, $5)
      `,
      [tenantId, tenantName.trim(), normalizedSubdomain, PLAN_LIMITS.free.maxUsers, PLAN_LIMITS.free.maxProjects]
    );

    await client.query(
      `
      INSERT INTO users (
        id, tenant_id, email, password_hash, full_name, role
      )
      VALUES ($1, $2, $3, $4, $5, 'tenant_admin')
      `,
      [adminUserId, tenantId, normalizedEmail, passwordHash, adminFullName.trim()]
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
          fullName: adminFullName.trim(),
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
 * API 2: Login
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

  const { email, password, tenantSubdomain, tenantId } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Super admin path
    const superAdminResult = await pool.query(
      `
      SELECT id, email, password_hash, full_name, role, tenant_id, is_active
      FROM users
      WHERE email = $1
        AND role = 'super_admin'
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (superAdminResult.rowCount > 0) {
      const superAdmin = superAdminResult.rows[0];

      if (!superAdmin.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive',
          data: null,
        });
      }

      const passwordMatch = await bcrypt.compare(password, superAdmin.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          data: null,
        });
      }

      const token = jwt.sign(
        {
          userId: superAdmin.id,
          tenantId: null,
          role: superAdmin.role,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: superAdmin.id,
            email: superAdmin.email,
            fullName: superAdmin.full_name,
            role: superAdmin.role,
            tenantId: null,
          },
          token,
          expiresIn: toTokenExpirySeconds(env.jwt.expiresIn),
        },
      });
    }

    if (!tenantSubdomain && !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantSubdomain or tenantId is required',
        data: null,
      });
    }

    let tenantQuery = 'SELECT * FROM tenants WHERE id = $1';
    let tenantQueryParam = tenantId;

    if (tenantSubdomain) {
      tenantQuery = 'SELECT * FROM tenants WHERE subdomain = $1';
      tenantQueryParam = tenantSubdomain.trim().toLowerCase();
    }

    const tenantResult = await pool.query(tenantQuery, [tenantQueryParam]);

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
        data: null,
      });
    }

    const tenant = tenantResult.rows[0];

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is suspended or inactive',
        data: null,
      });
    }

    const userResult = await pool.query(
      `
      SELECT id, tenant_id, email, password_hash, full_name, role, is_active
      FROM users
      WHERE email = $1
        AND tenant_id = $2
      LIMIT 1
      `,
      [normalizedEmail, tenant.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
        data: null,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null,
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
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
        },
        token,
        expiresIn: toTokenExpirySeconds(env.jwt.expiresIn),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API 3: Get Current User
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
        data: null,
      });
    }

    const row = userResult.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
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
 * API 3b: Update Current User Profile
 * PUT /api/auth/me
 */
export const updateMe = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors.array(),
    });
  }

  try {
    const { fullName, currentPassword, newPassword } = req.body;
    const currentUserId = req.user.id;

    const userResult = await pool.query(
      `
      SELECT id, tenant_id, email, full_name, role, password_hash, is_active
      FROM users
      WHERE id = $1
      `,
      [currentUserId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
        data: null,
      });
    }

    let passwordHash = null;

    if (currentPassword && newPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          data: null,
        });
      }
      passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updatedResult = await pool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        password_hash = COALESCE($2, password_hash),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, full_name, role, tenant_id, is_active, updated_at
      `,
      [fullName ? fullName.trim() : null, passwordHash, currentUserId]
    );

    if (user.tenant_id) {
      await logAudit({
        tenantId: user.tenant_id,
        userId: currentUserId,
        action: 'UPDATE_PROFILE',
        entityType: 'user',
        entityId: currentUserId,
        ipAddress: req.ip,
      });
    }

    const updated = updatedResult.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.id,
        email: updated.email,
        fullName: updated.full_name,
        role: updated.role,
        tenantId: updated.tenant_id,
        isActive: updated.is_active,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API 3c: Get Current User Preferences
 * GET /api/auth/preferences
 */
export const getMyPreferences = async (req, res, next) => {
  try {
    await ensureUserPreferencesTable();

    await pool.query(
      `
      INSERT INTO user_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [req.user.id]
    );

    const result = await pool.query(
      `
      SELECT email_notifications, task_due_reminders, weekly_summary, default_task_view, updated_at
      FROM user_preferences
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Preferences fetched successfully',
      data: mapPreferences(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API 3d: Update Current User Preferences
 * PUT /api/auth/preferences
 */
export const updateMyPreferences = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors.array(),
    });
  }

  try {
    await ensureUserPreferencesTable();

    const { emailNotifications, taskDueReminders, weeklySummary, defaultTaskView } = req.body;

    const result = await pool.query(
      `
      INSERT INTO user_preferences (
        user_id,
        email_notifications,
        task_due_reminders,
        weekly_summary,
        default_task_view,
        updated_at
      )
      VALUES (
        $1,
        COALESCE($2, true),
        COALESCE($3, true),
        COALESCE($4, false),
        COALESCE($5, 'board'),
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        email_notifications = COALESCE($2, user_preferences.email_notifications),
        task_due_reminders = COALESCE($3, user_preferences.task_due_reminders),
        weekly_summary = COALESCE($4, user_preferences.weekly_summary),
        default_task_view = COALESCE($5, user_preferences.default_task_view),
        updated_at = CURRENT_TIMESTAMP
      RETURNING email_notifications, task_due_reminders, weekly_summary, default_task_view, updated_at
      `,
      [req.user.id, emailNotifications, taskDueReminders, weeklySummary, defaultTaskView]
    );

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: mapPreferences(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API 4: Logout
 */
export const logout = async (req, res) => {
  if (req.user.tenantId) {
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
};
