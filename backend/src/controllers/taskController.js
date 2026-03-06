import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../services/auditService.js';

const VALID_STATUS = ['todo', 'in_progress', 'completed'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

const getProjectForAccess = async ({ projectId, tenantId, role }) => {
  const projectResult = await pool.query(
    `SELECT id, tenant_id FROM projects WHERE id = $1`,
    [projectId]
  );

  if (projectResult.rowCount === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  if (role !== 'super_admin' && project.tenant_id !== tenantId) {
    return false;
  }

  return project;
};

const mapTaskRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  assignedTo: row.assigned_user_id
    ? {
        id: row.assigned_user_id,
        fullName: row.assigned_user_name,
        email: row.assigned_user_email,
      }
    : null,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * API 16: Create Task
 * POST /api/projects/:projectId/tasks
 */
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      assignedTo,
      priority = 'medium',
      dueDate,
    } = req.body;
    const { tenantId, role, id: userId } = req.user;

    if (role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can create tasks',
        data: null,
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
        data: null,
      });
    }

    if (!VALID_PRIORITY.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value',
        data: null,
      });
    }

    const project = await getProjectForAccess({ projectId, tenantId, role });

    if (project === null) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    if (project === false) {
      return res.status(403).json({
        success: false,
        message: 'Project does not belong to your tenant',
        data: null,
      });
    }

    const projectTenantId = project.tenant_id;

    if (assignedTo) {
      const userRes = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assignedTo, projectTenantId]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant',
          data: null,
        });
      }
    }

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
      RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at
      `,
      [
        taskId,
        projectId,
        projectTenantId,
        title.trim(),
        description || null,
        priority,
        assignedTo || null,
        dueDate || null,
      ]
    );

    await logAudit({
      tenantId: projectTenantId,
      userId,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip,
    });

    const row = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        id: row.id,
        projectId: row.project_id,
        tenantId: row.tenant_id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assigned_to,
        dueDate: row.due_date,
        createdAt: row.created_at,
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
    const { tenantId, role, id: userId } = req.user;
    const { status, assignedTo, priority, search } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const project = await getProjectForAccess({ projectId, tenantId, role });

    if (project === null) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
      });
    }

    if (project === false) {
      return res.status(403).json({
        success: false,
        message: 'Project does not belong to your tenant',
        data: null,
      });
    }

    const filters = ['t.project_id = $1'];
    const params = [projectId];
    let index = 2;

    if (role === 'user') {
      if (assignedTo && assignedTo !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own assigned tasks',
          data: null,
        });
      }
      filters.push(`t.assigned_to = $${index++}`);
      params.push(userId);
    }

    if (status) {
      filters.push(`t.status = $${index++}`);
      params.push(status);
    }

    if (assignedTo) {
      filters.push(`t.assigned_to = $${index++}`);
      params.push(assignedTo);
    }

    if (priority) {
      filters.push(`t.priority = $${index++}`);
      params.push(priority);
    }

    if (search) {
      filters.push(`t.title ILIKE $${index++}`);
      params.push(`%${search.trim()}%`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tasks t ${whereClause}`,
      params
    );

    params.push(limit, offset);

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        t.updated_at,
        u.id AS assigned_user_id,
        u.full_name AS assigned_user_name,
        u.email AS assigned_user_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      ${whereClause}
      ORDER BY
        CASE t.priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      params
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully',
      data: {
        tasks: result.rows.map(mapTaskRow),
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
 * API 18: Update Task Status
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId, role, id: userId } = req.user;

    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status',
        data: null,
      });
    }

    const taskResult = await pool.query(
      `SELECT id, tenant_id, assigned_to FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        data: null,
      });
    }

    const task = taskResult.rows[0];

    if (role !== 'super_admin' && task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Task does not belong to your tenant',
        data: null,
      });
    }

    if (role === 'user' && task.assigned_to !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update status for tasks assigned to you',
        data: null,
      });
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, updated_at
      `,
      [status, taskId]
    );

    await logAudit({
      tenantId: task.tenant_id,
      userId,
      action: 'UPDATE_TASK_STATUS',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at,
      },
    });
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
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId, role, id: userId } = req.user;

    const taskResult = await pool.query(
      `SELECT id, tenant_id, assigned_to FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        data: null,
      });
    }

    const task = taskResult.rows[0];

    if (role !== 'super_admin' && task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Task does not belong to your tenant',
        data: null,
      });
    }

    if (role === 'user') {
      if (task.assigned_to !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you',
          data: null,
        });
      }

      const hasRestrictedFields =
        Object.prototype.hasOwnProperty.call(req.body, 'title') ||
        Object.prototype.hasOwnProperty.call(req.body, 'description') ||
        Object.prototype.hasOwnProperty.call(req.body, 'priority') ||
        Object.prototype.hasOwnProperty.call(req.body, 'assignedTo') ||
        Object.prototype.hasOwnProperty.call(req.body, 'dueDate');

      if (hasRestrictedFields) {
        return res.status(403).json({
          success: false,
          message: 'Users can only update task status',
          data: null,
        });
      }

      if (!Object.prototype.hasOwnProperty.call(req.body, 'status')) {
        return res.status(400).json({
          success: false,
          message: 'status is required',
          data: null,
        });
      }
    }

    if (status !== undefined && !VALID_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status',
        data: null,
      });
    }

    if (priority !== undefined && !VALID_PRIORITY.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task priority',
        data: null,
      });
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const userRes = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assignedTo, task.tenant_id]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to the same tenant',
          data: null,
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = CASE WHEN $5::text IS NULL THEN assigned_to ELSE $5::uuid END,
        due_date = CASE WHEN $6::text IS NULL THEN due_date ELSE $6::date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, title, description, status, priority, assigned_to, due_date, created_at, updated_at
      `,
      [
        title ?? null,
        description ?? null,
        status ?? null,
        priority ?? null,
        Object.prototype.hasOwnProperty.call(req.body, 'assignedTo')
          ? assignedTo
          : null,
        Object.prototype.hasOwnProperty.call(req.body, 'dueDate')
          ? dueDate
          : null,
        taskId,
      ]
    );

    // Explicit unassign / unset handling when null is intentionally passed
    if (Object.prototype.hasOwnProperty.call(req.body, 'assignedTo') && assignedTo === null) {
      await pool.query(
        'UPDATE tasks SET assigned_to = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [taskId]
      );
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate') && dueDate === null) {
      await pool.query(
        'UPDATE tasks SET due_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [taskId]
      );
    }

    const refreshed = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        t.updated_at,
        u.id AS assigned_user_id,
        u.full_name AS assigned_user_name,
        u.email AS assigned_user_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = $1
      `,
      [taskId]
    );

    await logAudit({
      tenantId: task.tenant_id,
      userId,
      action: 'UPDATE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: mapTaskRow(refreshed.rows[0]),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { tenantId, role, id: userId } = req.user;

    if (role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can delete tasks',
        data: null,
      });
    }

    const taskResult = await pool.query(
      'SELECT id, tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        data: null,
      });
    }

    const task = taskResult.rows[0];

    if (role !== 'super_admin' && task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Task does not belong to your tenant',
        data: null,
      });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    await logAudit({
      tenantId: task.tenant_id,
      userId,
      action: 'DELETE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
