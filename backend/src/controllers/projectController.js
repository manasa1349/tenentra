import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../services/auditService.js';

/**
 * API 12: Create Project
 * POST /api/projects
 */
export const createProject = async (req, res, next) => {
  try {
    const { name, description, status = 'active' } = req.body;
    const tenantId = req.user.tenantId;
    const createdBy = req.user.id;
    const requesterRole = req.user.role;

    if (requesterRole === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can create projects',
        data: null,
      });
    }

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Super admin cannot create tenant project without tenant context',
        data: null,
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
        data: null,
      });
    }

    if (!['active', 'archived', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project status',
        data: null,
      });
    }

    const tenantRes = await pool.query(
      'SELECT max_projects, status FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
        data: null,
      });
    }

    if (tenantRes.rows[0].status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active',
        data: null,
      });
    }

    const projectCountRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM projects WHERE tenant_id = $1',
      [tenantId]
    );

    if (projectCountRes.rows[0].count >= tenantRes.rows[0].max_projects) {
      return res.status(403).json({
        success: false,
        message: 'Project limit reached for current subscription plan',
        data: null,
      });
    }

    const projectId = uuidv4();

    const result = await pool.query(
      `
      INSERT INTO projects (
        id,
        tenant_id,
        name,
        description,
        status,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, tenant_id, name, description, status, created_by, created_at
      `,
      [projectId, tenantId, name.trim(), description || null, status, createdBy]
    );

    const created = result.rows[0];

    await logAudit({
      tenantId,
      userId: createdBy,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        id: created.id,
        tenantId: created.tenant_id,
        name: created.name,
        description: created.description,
        status: created.status,
        createdBy: created.created_by,
        createdAt: created.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 13: List Projects
 */
export const listProjects = async (req, res, next) => {
  try {
    const { tenantId, role } = req.user;
    const { status, search } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    if (!tenantId && role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Tenant context is required',
        data: null,
      });
    }

    const filters = [];
    const params = [];
    let index = 1;

    if (role !== 'super_admin') {
      filters.push(`p.tenant_id = $${index++}`);
      params.push(tenantId);
    }

    if (status) {
      filters.push(`p.status = $${index++}`);
      params.push(status);
    }

    if (search) {
      filters.push(`p.name ILIKE $${index++}`);
      params.push(`%${search.trim()}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM projects p ${whereClause}`,
      params
    );

    params.push(limit, offset);

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        p.updated_at,
        u.id AS creator_id,
        u.full_name AS creator_name,
        COUNT(t.id)::int AS task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::int AS completed_task_count
      FROM projects p
      JOIN users u ON u.id = p.created_by
      LEFT JOIN tasks t ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      params
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      message: 'Projects fetched successfully',
      data: {
        projects: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          status: row.status,
          createdBy: {
            id: row.creator_id,
            fullName: row.creator_name,
          },
          taskCount: row.task_count,
          completedTaskCount: row.completed_task_count,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
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

/**
 * API 14: Update Project
 */
export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, id: userId, role } = req.user;

    const projectRes = await pool.query(
      `
      SELECT id, tenant_id, created_by
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    const project = projectRes.rows[0];

    const hasTenantAccess = role === 'super_admin' || project.tenant_id === tenantId;
    if (!hasTenantAccess) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    if (role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can update projects',
        data: null,
      });
    }

    if (role !== 'tenant_admin' && role !== 'super_admin' && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project',
        data: null,
      });
    }

    if (status !== undefined && !['active', 'archived', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project status',
        data: null,
      });
    }

    const result = await pool.query(
      `
      UPDATE projects
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, description, status, updated_at
      `,
      [name ?? null, description ?? null, status ?? null, projectId]
    );

    await logAudit({
      tenantId: project.tenant_id,
      userId,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip,
    });

    const updated = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        updatedAt: updated.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 15: Delete Project
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { tenantId, id: userId, role } = req.user;

    const projectRes = await pool.query(
      `
      SELECT id, tenant_id, created_by
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    const project = projectRes.rows[0];

    const hasTenantAccess = role === 'super_admin' || project.tenant_id === tenantId;
    if (!hasTenantAccess) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    if (role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can delete projects',
        data: null,
      });
    }

    if (role !== 'tenant_admin' && role !== 'super_admin' && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project',
        data: null,
      });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

    await logAudit({
      tenantId: project.tenant_id,
      userId,
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  const { projectId } = req.params;
  const { tenantId, role } = req.user;

  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.tenant_id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        p.updated_at,
        u.id AS creator_id,
        u.full_name AS creator_name
      FROM projects p
      JOIN users u ON u.id = p.created_by
      WHERE p.id = $1
      `,
      [projectId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    const project = result.rows[0];

    if (role !== 'super_admin' && project.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project fetched successfully',
      data: {
        id: project.id,
        tenantId: project.tenant_id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdBy: {
          id: project.creator_id,
          fullName: project.creator_name,
        },
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};
