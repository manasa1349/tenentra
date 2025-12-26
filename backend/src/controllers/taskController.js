import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../services/auditService.js';

/**
 * API 16: Create Task
 * POST /api/projects/:projectId/tasks
 */
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
    const { tenantId, id: userId } = req.user;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    /**
     * 1 Verify project exists & belongs to user's tenant
     */
    const projectRes = await pool.query(
      `SELECT id, tenant_id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Project does not belong to your tenant',
      });
    }

    const projectTenantId = projectRes.rows[0].tenant_id;

    /**
     * 2 If assignedTo provided → verify user belongs to same tenant
     */
    if (assignedTo) {
      const userRes = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assignedTo, projectTenantId]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant',
        });
      }
    }

    /**
     * 3 Create task
     */
    const taskId = uuidv4();

    const result = await pool.query(
      `
      INSERT INTO tasks (
        id,
        project_id,
        tenant_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date
      )
      VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8)
      RETURNING *
      `,
      [
        taskId,
        projectId,
        projectTenantId,
        title,
        description || null,
        priority,
        assignedTo || null,
        dueDate || null,
      ]
    );

    /**
     * 4 Audit log
     */
    await logAudit({
      tenantId: projectTenantId,
      userId,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        projectId: result.rows[0].project_id,
        tenantId: result.rows[0].tenant_id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        assignedTo: result.rows[0].assigned_to,
        dueDate: result.rows[0].due_date,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
/**
 * API 17: List Project Tasks
 */
export const listProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    const result = await pool.query(
      `
      SELECT
        t.id, t.title, t.description, t.status, t.priority, t.due_date,
        u.id AS user_id, u.full_name, u.email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.project_id = $1 AND t.tenant_id = $2
      ORDER BY t.priority DESC, t.due_date ASC
      `,
      [projectId, tenantId]
    );

    res.json({ success: true, data: { tasks: result.rows } });
  } catch (err) {
    next(err);
  }
};

/**
 * API 18: Update Task Status
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user;

    await pool.query(
      `
      UPDATE tasks
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
      `,
      [status, taskId, tenantId]
    );

    res.json({ success: true, data: { id: taskId, status } });
  } catch (err) {
    next(err);
  }
};

/**
 * API 19: Update Task
 */
export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, assignedTo, dueDate } = req.body;
    const { tenantId } = req.user;

    if (assignedTo) {
      const userRes = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assignedTo, tenantId]
      );
      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant',
        });
      }
    }

    await pool.query(
      `
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        assigned_to = $4,
        due_date = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND tenant_id = $7
      `,
      [title, description, priority, assignedTo || null, dueDate || null, taskId, tenantId]
    );

    res.json({ success: true, message: 'Task updated successfully' });
  } catch (err) {
    next(err);
  }
};
