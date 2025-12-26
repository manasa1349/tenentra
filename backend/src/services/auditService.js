import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const logAudit = async ({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  ipAddress,
}) => {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs (
        id, tenant_id, user_id, action, entity_type, entity_id, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        uuidv4(),
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        ipAddress || null,
      ]
    );
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};