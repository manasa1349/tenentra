import { pool } from '../config/db.js';
import { logAudit } from '../services/auditService.js';

/**
 * API 10: Update User
 * PUT /api/users/:userId
 */
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const { tenantId, id: currentUserId, role: currentRole } = req.user;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Super admin cannot update tenant user via this endpoint',
        data: null,
      });
    }

    const userRes = await pool.query(
      `
      SELECT id, tenant_id, role, full_name, is_active
      FROM users
      WHERE id = $1 AND tenant_id = $2
      `,
      [userId, tenantId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    const targetUser = userRes.rows[0];

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin users cannot be modified here',
        data: null,
      });
    }

    const isSelf = userId === currentUserId;

    if (isSelf && (role !== undefined || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own fullName',
        data: null,
      });
    }

    if (!isSelf && currentRole !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
        data: null,
      });
    }

    if (role !== undefined && !['user', 'tenant_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value',
        data: null,
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        role = CASE WHEN $2::text IS NULL THEN role ELSE $2::user_role END,
        is_active = COALESCE($3, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, full_name, role, is_active, updated_at
      `,
      [
        fullName ?? null,
        isSelf ? null : role ?? null,
        isSelf ? null : isActive ?? null,
        userId,
      ]
    );

    const updated = result.rows[0];

    await logAudit({
      tenantId,
      userId: currentUserId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updated.id,
        fullName: updated.full_name,
        role: updated.role,
        isActive: updated.is_active,
        updatedAt: updated.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * API 11: Delete User
 * DELETE /api/users/:userId
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tenantId, id: currentUserId, role } = req.user;

    if (!tenantId || role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins can delete users',
        data: null,
      });
    }

    if (userId === currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself',
        data: null,
      });
    }

    const userResult = await pool.query(
      `
      SELECT id, role
      FROM users
      WHERE id = $1 AND tenant_id = $2
      `,
      [userId, tenantId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    if (userResult.rows[0].role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin',
        data: null,
      });
    }

    await pool.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);

    await logAudit({
      tenantId,
      userId: currentUserId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
