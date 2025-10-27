/**
 * Middleware for role-based access control
 * Checks if the authenticated user has the required role(s)
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Authorization error.',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = checkRole('admin');

/**
 * Middleware to check if user is farmer
 */
const isFarmer = checkRole('farmer');

/**
 * Middleware to check if user is processor
 */
const isProcessor = checkRole('processor');

/**
 * Middleware to check if user is distributor
 */
const isDistributor = checkRole('distributor');

/**
 * Middleware to check if user is admin or farmer
 */
const isAdminOrFarmer = checkRole('admin', 'farmer');

/**
 * Middleware to check if user is part of supply chain (processor or distributor)
 */
const isSupplyChainMember = checkRole('processor', 'distributor');

/**
 * Middleware to check if user has access to batch operations
 * (admin, farmer, processor, distributor)
 */
const hasBatchAccess = checkRole('admin', 'farmer', 'processor', 'distributor');

/**
 * Middleware to check if user owns the resource
 * Compares user id with resource owner id
 */
const isOwner = (resourceOwnerField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Get resource owner id from various possible locations
      const resourceOwnerId = 
        req.params[resourceOwnerField] || 
        req.body[resourceOwnerField] || 
        req.query[resourceOwnerField];

      if (!resourceOwnerId) {
        return res.status(400).json({
          success: false,
          message: 'Resource owner information not found.'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      if (req.user._id.toString() !== resourceOwnerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Authorization error.',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if farm is approved
 * Used for farmers to ensure their farm is approved before certain actions
 */
const isFarmApproved = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin bypass
    if (req.user.role === 'admin') {
      return next();
    }

    // Only check for farmers
    if (req.user.role === 'farmer') {
      const Farm = require('../models/Farm');
      const farm = await Farm.findOne({ userId: req.user._id });

      if (!farm) {
        return res.status(404).json({
          success: false,
          message: 'Farm not found. Please register your farm.'
        });
      }

      if (farm.approvalStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Your farm must be approved before performing this action.'
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Farm approval check error.',
      error: error.message
    });
  }
};

module.exports = {
  checkRole,
  isAdmin,
  isFarmer,
  isProcessor,
  isDistributor,
  isAdminOrFarmer,
  isSupplyChainMember,
  hasBatchAccess,
  isOwner,
  isFarmApproved
};
