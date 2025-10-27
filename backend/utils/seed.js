#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script populates the database with sample data for testing and development.
 * It creates:
 * - 5 users (admin, farmer, processor, distributor, public)
 * - 5 farms with various certifications
 * - 10 wool batches with different statuses
 * - Batch updates tracking the journey of each batch
 * - Analytics data for each farm
 * 
 * Usage:
 *   node backend/utils/seed.js
 *   or
 *   npm run seed (if script is added to package.json)
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedDatabase = require('./seedData');

// MongoDB connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wool-journey-tracker';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Main execution
const runSeeder = async () => {
  console.log('='.repeat(60));
  console.log('🌾 WOOL JOURNEY TRACKER - DATABASE SEEDING');
  console.log('='.repeat(60));
  console.log();

  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    console.log();
    console.log('-'.repeat(60));
    console.log();

    // Run the seeding function
    await seedDatabase();

    console.log();
    console.log('-'.repeat(60));
    console.log();
    console.log('✅ Seeding process completed successfully!');
    console.log();
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('❌ Seeding failed:', error.message);
    console.error();
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('='.repeat(60));
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Execute the seeder
runSeeder();
