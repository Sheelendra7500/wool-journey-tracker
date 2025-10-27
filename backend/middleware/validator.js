const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['farmer', 'processor', 'distributor', 'admin']).withMessage('Invalid role'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Farm registration validation
 */
const validateFarmRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Farm name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Farm name must be between 2 and 200 characters'),
  
  body('location')
    .notEmpty().withMessage('Location is required'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  
  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('location.state')
    .trim()
    .notEmpty().withMessage('State is required'),
  
  body('location.country')
    .trim()
    .notEmpty().withMessage('Country is required'),
  
  body('location.pincode')
    .optional()
    .trim()
    .matches(/^[0-9]{5,10}$/).withMessage('Invalid pincode'),
  
  body('contactInfo.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[+]?[0-9]{10,15}$/).withMessage('Invalid phone number'),
  
  body('contactInfo.email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('certifications')
    .optional()
    .isArray().withMessage('Certifications must be an array'),
  
  handleValidationErrors
];

/**
 * Batch creation validation
 */
const validateBatchCreation = [
  body('farmId')
    .notEmpty().withMessage('Farm ID is required')
    .isMongoId().withMessage('Invalid Farm ID'),
  
  body('weight')
    .notEmpty().withMessage('Weight is required')
    .isFloat({ min: 0.1 }).withMessage('Weight must be a positive number'),
  
  body('qualityMetrics')
    .optional()
    .isObject().withMessage('Quality metrics must be an object'),
  
  body('qualityMetrics.grade')
    .optional()
    .isIn(['A', 'B', 'C', 'D']).withMessage('Invalid quality grade'),
  
  body('qualityMetrics.micronCount')
    .optional()
    .isFloat({ min: 10, max: 50 }).withMessage('Micron count must be between 10 and 50'),
  
  body('qualityMetrics.cleanYield')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Clean yield must be between 0 and 100'),
  
  body('shearingDate')
    .optional()
    .isISO8601().withMessage('Invalid shearing date'),
  
  handleValidationErrors
];

/**
 * Batch update validation
 */
const validateBatchUpdate = [
  body('stage')
    .optional()
    .isIn(['shearing', 'cleaning', 'spinning', 'weaving', 'dyeing', 'distribution', 'completed'])
    .withMessage('Invalid stage'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'quality-issue', 'rejected'])
    .withMessage('Invalid status'),
  
  body('location')
    .optional()
    .isObject().withMessage('Location must be an object'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Batch ID parameter validation
 */
const validateBatchId = [
  param('id')
    .notEmpty().withMessage('Batch ID is required')
    .isMongoId().withMessage('Invalid Batch ID'),
  
  handleValidationErrors
];

/**
 * Farm ID parameter validation
 */
const validateFarmId = [
  param('id')
    .notEmpty().withMessage('Farm ID is required')
    .isMongoId().withMessage('Invalid Farm ID'),
  
  handleValidationErrors
];

/**
 * User ID parameter validation
 */
const validateUserId = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid User ID'),
  
  handleValidationErrors
];

/**
 * Farm approval validation
 */
const validateFarmApproval = [
  body('approvalStatus')
    .notEmpty().withMessage('Approval status is required')
    .isIn(['pending', 'approved', 'rejected']).withMessage('Invalid approval status'),
  
  body('rejectionReason')
    .if(body('approvalStatus').equals('rejected'))
    .notEmpty().withMessage('Rejection reason is required when rejecting a farm')
    .trim()
    .isLength({ max: 500 }).withMessage('Rejection reason must not exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Batch code query validation
 */
const validateBatchCodeQuery = [
  query('batchCode')
    .notEmpty().withMessage('Batch code is required')
    .trim()
    .isLength({ min: 5, max: 50 }).withMessage('Batch code must be between 5 and 50 characters'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date'),
  
  handleValidationErrors
];

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/<[^>]*>/g, '');
    }
    return str;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateFarmRegistration,
  validateBatchCreation,
  validateBatchUpdate,
  validateBatchId,
  validateFarmId,
  validateUserId,
  validateFarmApproval,
  validateBatchCodeQuery,
  validatePagination,
  validateDateRange,
  sanitizeInput
};
