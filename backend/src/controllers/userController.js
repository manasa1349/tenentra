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

    const userRes = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Self can update only fullName
    if (userId === currentUserId) {
      await pool.query(
        `UPDATE users SET full_name = $1 WHERE id = $2`,
        [fullName, userId]
      );
    } 
    // tenant_admin can update all
    else if (currentRole === 'tenant_admin') {
      await pool.query(
        `
        UPDATE users
        SET
          full_name = COALESCE($1, full_name),
          role = COALESCE($2, role),
          is_active = COALESCE($3, is_active)
        WHERE id = $4
        `,
        [fullName, role, isActive, userId]
      );
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await logAudit({
      tenantId,
      userId: currentUserId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { id: userId },
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

    if (userId === currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself',
      });
    }

    if (role !== 'tenant_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAudit({
      tenantId,
      userId: currentUserId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
