/**
 * MongoDB Mongoose Models for Wool Journey Tracker
 * 
 * This file exports all the Mongoose models used in the application:
 * - User: User accounts with role-based access (Admin, Farmer, Processor, Distributor, Public)
 * - Farm: Farm registration and management with approval workflow
 * - Batch: Wool batch tracking from shearing to fabric with quality metrics
 * - BatchUpdate: Real-time updates for batch status and location changes
 * - Analytics: Pre-aggregated analytics data for dashboards and reporting
 * 
 * All models include appropriate indexes for performance optimization:
 * - User: email index for authentication
 * - Farm: farm_id and approval status indexes
 * - Batch: batch_code and farm_id indexes for tracking and queries
 * - BatchUpdate: batch_id and timestamp indexes for timeline queries
 * - Analytics: date and period indexes for time-series dashboard queries
 */

const User = require('./User');
const Farm = require('./Farm');
const Batch = require('./Batch');
const BatchUpdate = require('./BatchUpdate');
const Analytics = require('./Analytics');

module.exports = {
  User,
  Farm,
  Batch,
  BatchUpdate,
  Analytics,
};
