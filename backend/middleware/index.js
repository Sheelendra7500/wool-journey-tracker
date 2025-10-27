/**
 * Middleware Index
 * Central export point for all middleware modules
 */

const auth = require('./auth');
const roleCheck = require('./roleCheck');
const validator = require('./validator');
const errorHandler = require('./errorHandler');
const upload = require('./upload');

module.exports = {
  // Authentication middleware
  authenticate: auth.authenticate,
  optionalAuthenticate: auth.optionalAuthenticate,

  // Role-based access control middleware
  checkRole: roleCheck.checkRole,
  isAdmin: roleCheck.isAdmin,
  isFarmer: roleCheck.isFarmer,
  isProcessor: roleCheck.isProcessor,
  isDistributor: roleCheck.isDistributor,
  isAdminOrFarmer: roleCheck.isAdminOrFarmer,
  isSupplyChainMember: roleCheck.isSupplyChainMember,
  hasBatchAccess: roleCheck.hasBatchAccess,
  isOwner: roleCheck.isOwner,
  isFarmApproved: roleCheck.isFarmApproved,

  // Validation middleware
  handleValidationErrors: validator.handleValidationErrors,
  validateUserRegistration: validator.validateUserRegistration,
  validateUserLogin: validator.validateUserLogin,
  validateFarmRegistration: validator.validateFarmRegistration,
  validateBatchCreation: validator.validateBatchCreation,
  validateBatchUpdate: validator.validateBatchUpdate,
  validateBatchId: validator.validateBatchId,
  validateFarmId: validator.validateFarmId,
  validateUserId: validator.validateUserId,
  validateFarmApproval: validator.validateFarmApproval,
  validateBatchCodeQuery: validator.validateBatchCodeQuery,
  validatePagination: validator.validatePagination,
  validateDateRange: validator.validateDateRange,
  sanitizeInput: validator.sanitizeInput,

  // Error handling middleware
  AppError: errorHandler.AppError,
  notFound: errorHandler.notFound,
  errorHandler: errorHandler.errorHandler,
  asyncHandler: errorHandler.asyncHandler,
  handleUnhandledRejection: errorHandler.handleUnhandledRejection,
  handleUncaughtException: errorHandler.handleUncaughtException,
  requestTimeout: errorHandler.requestTimeout,
  rateLimitErrorHandler: errorHandler.rateLimitErrorHandler,

  // File upload middleware
  uploadSingleImage: upload.uploadSingleImage,
  uploadSingleDocument: upload.uploadSingleDocument,
  uploadSingleCertificate: upload.uploadSingleCertificate,
  uploadMultipleImages: upload.uploadMultipleImages,
  uploadMultipleCertificates: upload.uploadMultipleCertificates,
  uploadMultipleDocuments: upload.uploadMultipleDocuments,
  uploadFields: upload.uploadFields,
  uploadMemory: upload.uploadMemory,
  cleanupOnError: upload.cleanupOnError,
  deleteFile: upload.deleteFile,
  validateUploadedFile: upload.validateUploadedFile,
  storage: upload.storage,
  memoryStorage: upload.memoryStorage
};
