import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorize.js';
import {
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = express.Router();

// API 10: Update User
router.put('/:userId', authenticate, updateUser);

// API 11: Delete User (tenant_admin only)
router.delete(
  '/:userId',
  authenticate,
  authorize('tenant_admin'),
  deleteUser
);

export default router;