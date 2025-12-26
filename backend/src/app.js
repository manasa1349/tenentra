import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { pool } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

/**
 * ======================
 * Global Middleware
 * ======================
 */
app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "http://frontend:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow curl/postman
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin:'http://localhost:3000',
//     // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   })
// );

/**
 * ======================
 * API Routes
 * ======================
 */
console.log('Registering routes...');
console.log('Mounting /api/auth');
app.use('/api/auth', authRoutes);

console.log('Mounting /api/tenants');
app.use('/api/tenants', tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/users', userRoutes);

/**
 * ======================
 * Health Check (MANDATORY)
 * ======================
 */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
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

/**
 * ======================
 * 404 Handler
 * ======================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

/**
 * ======================
 * Global Error Handler
 * ======================
 */
app.use(errorHandler);

export default app;
