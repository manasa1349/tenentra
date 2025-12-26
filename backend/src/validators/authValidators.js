import { body, validationResult } from 'express-validator';

/*
 * =========================
 * Shared Validation Handler
 * =========================
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * =========================
 * Register Tenant Validator
 * =========================
 */
export const registerTenantValidator = [
  body('tenantName')
    .notEmpty()
    .withMessage('tenantName is required'),

  body('subdomain')
    .notEmpty()
    .withMessage('subdomain is required')
    .isLowercase()
    .withMessage('subdomain must be lowercase')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('subdomain must contain only letters, numbers, hyphens'),

  body('adminEmail')
    .isEmail()
    .withMessage('Valid adminEmail is required'),

  body('adminPassword')
    .isLength({ min: 8 })
    .withMessage('adminPassword must be at least 8 characters'),

  body('adminFullName')
    .notEmpty()
    .withMessage('adminFullName is required'),

  handleValidationErrors,
];

/**
 * =========================
 * Login Validator
 * =========================
 */
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('tenantSubdomain')
    .optional()
    .isString()
    .withMessage('tenantSubdomain must be a string'),

  handleValidationErrors,
];
