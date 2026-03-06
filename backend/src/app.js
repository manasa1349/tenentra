import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { pool } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const allowedOrigins = env.frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed'));
    },
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/users', userRoutes);

/**
 * Health Check (ready only after DB + seed essentials exist)
 */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    const seedCheck = await pool.query(
      `
      SELECT
        EXISTS (SELECT 1 FROM users WHERE role = 'super_admin') AS has_super_admin,
        EXISTS (SELECT 1 FROM tenants WHERE status = 'active') AS has_active_tenant,
        EXISTS (SELECT 1 FROM projects) AS has_projects,
        EXISTS (SELECT 1 FROM tasks) AS has_tasks
      `
    );

    const checks = seedCheck.rows[0];
    const ready =
      checks.has_super_admin &&
      checks.has_active_tenant &&
      checks.has_projects &&
      checks.has_tasks;

    if (!ready) {
      return res.status(503).json({
        status: 'error',
        database: 'connected',
      });
    }

    return res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    data: null,
  });
});

app.use(errorHandler);

export default app;
