import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors.array(),
    });
  }
  next();
};

export const registerTenantValidator = [
  body('tenantName').trim().notEmpty().withMessage('tenantName is required'),

  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('subdomain is required')
    .isLength({ min: 3, max: 63 })
    .withMessage('subdomain must be 3-63 characters')
    .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .withMessage('subdomain must be lowercase alphanumeric and may contain internal hyphens only'),

  body('adminEmail').isEmail().withMessage('Valid adminEmail is required'),

  body('adminPassword')
    .isLength({ min: 8 })
    .withMessage('adminPassword must be at least 8 characters'),

  body('adminFullName').trim().notEmpty().withMessage('adminFullName is required'),

  handleValidationErrors,
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),

  body('password').notEmpty().withMessage('Password is required'),

  body('tenantSubdomain')
    .optional()
    .isString()
    .withMessage('tenantSubdomain must be a string'),

  body('tenantId')
    .optional()
    .isUUID()
    .withMessage('tenantId must be a valid UUID'),

  handleValidationErrors,
];

export const updateMeValidator = [
  body('fullName')
    .optional()
    .isString()
    .withMessage('fullName must be a string')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('fullName must be 2-120 characters'),

  body('currentPassword')
    .optional()
    .isString()
    .withMessage('currentPassword must be a string')
    .notEmpty()
    .withMessage('currentPassword cannot be empty'),

  body('newPassword')
    .optional()
    .isString()
    .withMessage('newPassword must be a string')
    .isLength({ min: 8, max: 128 })
    .withMessage('newPassword must be 8-128 characters'),

  body().custom((value) => {
    const hasFullName = Object.prototype.hasOwnProperty.call(value, 'fullName');
    const hasCurrentPassword = Object.prototype.hasOwnProperty.call(value, 'currentPassword');
    const hasNewPassword = Object.prototype.hasOwnProperty.call(value, 'newPassword');

    if (!hasFullName && !hasCurrentPassword && !hasNewPassword) {
      throw new Error('At least one field is required: fullName or password fields');
    }

    if (hasCurrentPassword !== hasNewPassword) {
      throw new Error('Both currentPassword and newPassword are required for password change');
    }

    return true;
  }),

  handleValidationErrors,
];

export const updatePreferencesValidator = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be boolean'),

  body('taskDueReminders')
    .optional()
    .isBoolean()
    .withMessage('taskDueReminders must be boolean'),

  body('weeklySummary')
    .optional()
    .isBoolean()
    .withMessage('weeklySummary must be boolean'),

  body('defaultTaskView')
    .optional()
    .isIn(['board', 'list'])
    .withMessage('defaultTaskView must be board or list'),

  body().custom((value) => {
    const keys = ['emailNotifications', 'taskDueReminders', 'weeklySummary', 'defaultTaskView'];
    const hasAny = keys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
    if (!hasAny) {
      throw new Error('At least one preference field is required');
    }
    return true;
  }),

  handleValidationErrors,
];
