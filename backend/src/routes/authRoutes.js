import express from 'express';
import {
  registerTenant,
  login,
  getMe,
  updateMe,
  getMyPreferences,
  updateMyPreferences,
  logout,
} from '../controllers/authController.js';
import {
  registerTenantValidator,
  loginValidator,
  updateMeValidator,
  updatePreferencesValidator,
} from '../validators/authValidators.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-tenant', registerTenantValidator, registerTenant);
router.post('/login', loginValidator, login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMeValidator, updateMe);
router.get('/preferences', authenticate, getMyPreferences);
router.put('/preferences', authenticate, updatePreferencesValidator, updateMyPreferences);
router.post('/logout', authenticate, logout);

export default router;
