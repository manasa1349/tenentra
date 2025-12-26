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

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    const projectId = uuidv4();
    const tenantId = req.user.tenantId;
    const createdBy = req.user.id;


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
      RETURNING *
      `,
      [
        projectId,
        tenantId,
        name,
        description || null,
        status,
        createdBy,
      ]
    );

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
      data: {
        id: result.rows[0].id,
        tenantId: result.rows[0].tenant_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        status: result.rows[0].status,
        createdBy: result.rows[0].created_by,
        createdAt: result.rows[0].created_at,
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
    const { tenantId } = req.user;
    const { status, search } = req.query;

    let query = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        u.id AS creator_id,
        u.full_name AS creator_name,
        COUNT(t.id) AS task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_task_count
      FROM projects p
      JOIN users u ON u.id = p.created_by
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.tenant_id = $1
    `;

    const params = [tenantId];
    let idx = 2;

    if (status) {
      query += ` AND p.status = $${idx++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND p.name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        projects: result.rows.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          status: r.status,
          createdBy: {
            id: r.creator_id,
            fullName: r.creator_name,
          },
          taskCount: Number(r.task_count),
          completedTaskCount: Number(r.completed_task_count),
          createdAt: r.created_at,
        })),
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
    const { tenantId, userId, role } = req.user;

    const projectRes = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectRes.rows[0];

    if (role !== 'tenant_admin' && project.created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await pool.query(
      `
      UPDATE projects
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      `,
      [name, description, status, projectId]
    );

    await logAudit({
      tenantId,
      userId,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: projectId,
        updatedAt: new Date(),
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
    const { tenantId, userId, role } = req.user;

    const projectRes = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await pool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);

    await logAudit({
      tenantId,
      userId,
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, role } = req.user;

  try {
    let query = `
      SELECT *
      FROM projects
      WHERE id = $1
    `;
    const params = [projectId];

    if (role !== "super_admin") {
      query += " AND tenant_id = $2";
      params.push(tenantId);
    }

    const { rows } = await pool.query(query, params);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};