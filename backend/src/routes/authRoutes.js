import express from 'express';
import {
  registerTenant,
  login,
  getMe,
  logout,
} from '../controllers/authController.js';
import {
  registerTenantValidator,
  loginValidator,
} from '../validators/authValidators.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-tenant', registerTenantValidator, registerTenant);
router.post('/login', loginValidator, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;