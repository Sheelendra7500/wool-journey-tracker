const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Farm = require('../models/Farm');
const Batch = require('../models/Batch');
const BatchUpdate = require('../models/BatchUpdate');
const Analytics = require('../models/Analytics');

// Sample Users Data
const users = [
  {
    username: 'admin',
    email: 'admin@wooltracker.com',
    password: 'admin123',
    role: 'admin',
    fullName: 'System Administrator'
  },
  {
    username: 'farmer_john',
    email: 'john@farm.com',
    password: 'farmer123',
    role: 'farmer',
    fullName: 'John Smith'
  },
  {
    username: 'processor_sarah',
    email: 'sarah@processor.com',
    password: 'processor123',
    role: 'processor',
    fullName: 'Sarah Johnson'
  },
  {
    username: 'distributor_mike',
    email: 'mike@distributor.com',
    password: 'distributor123',
    role: 'distributor',
    fullName: 'Mike Wilson'
  },
  {
    username: 'public_user',
    email: 'public@example.com',
    password: 'public123',
    role: 'public',
    fullName: 'Public User'
  }
];

// Sample Farms Data
const farms = [
  {
    name: 'Green Valley Farm',
    location: 'New South Wales, Australia',
    certifications: ['Organic', 'Merino Excellence'],
    contactInfo: {
      phone: '+61-2-1234-5678',
      email: 'contact@greenvalley.com'
    }
  },
  {
    name: 'Highland Wool Estate',
    location: 'Victoria, Australia',
    certifications: ['Sustainable Farming'],
    contactInfo: {
      phone: '+61-3-2345-6789',
      email: 'info@highlandwool.com'
    }
  },
  {
    name: 'Sunrise Sheep Ranch',
    location: 'Queensland, Australia',
    certifications: ['Animal Welfare Approved', 'Organic'],
    contactInfo: {
      phone: '+61-7-3456-7890',
      email: 'hello@sunriseranch.com'
    }
  },
  {
    name: 'Mountain View Merino',
    location: 'South Australia',
    certifications: ['Merino Excellence', 'Sustainable Farming'],
    contactInfo: {
      phone: '+61-8-4567-8901',
      email: 'contact@mountainmerino.com'
    }
  },
  {
    name: 'Coastal Wool Producers',
    location: 'Western Australia',
    certifications: ['Organic', 'Fair Trade'],
    contactInfo: {
      phone: '+61-9-5678-9012',
      email: 'info@coastalwool.com'
    }
  }
];

// Sample Batches Data (will be populated with farm and owner IDs after creation)
const batches = [
  {
    batchNumber: 'WB-2024-001',
    weight: 250,
    quality: 'Premium',
    status: 'Processing',
    shearingDate: new Date('2024-01-15')
  },
  {
    batchNumber: 'WB-2024-002',
    weight: 300,
    quality: 'Standard',
    status: 'Distributed',
    shearingDate: new Date('2024-02-10')
  },
  {
    batchNumber: 'WB-2024-003',
    weight: 200,
    quality: 'Premium',
    status: 'At Farm',
    shearingDate: new Date('2024-03-05')
  },
  {
    batchNumber: 'WB-2024-004',
    weight: 350,
    quality: 'Premium',
    status: 'Processing',
    shearingDate: new Date('2024-03-20')
  },
  {
    batchNumber: 'WB-2024-005',
    weight: 275,
    quality: 'Standard',
    status: 'Processing',
    shearingDate: new Date('2024-04-12')
  },
  {
    batchNumber: 'WB-2024-006',
    weight: 320,
    quality: 'Premium',
    status: 'Distributed',
    shearingDate: new Date('2024-05-08')
  },
  {
    batchNumber: 'WB-2024-007',
    weight: 180,
    quality: 'Standard',
    status: 'At Farm',
    shearingDate: new Date('2024-06-15')
  },
  {
    batchNumber: 'WB-2024-008',
    weight: 290,
    quality: 'Premium',
    status: 'Processing',
    shearingDate: new Date('2024-07-22')
  },
  {
    batchNumber: 'WB-2024-009',
    weight: 310,
    quality: 'Premium',
    status: 'Distributed',
    shearingDate: new Date('2024-08-18')
  },
  {
    batchNumber: 'WB-2024-010',
    weight: 265,
    quality: 'Standard',
    status: 'Processing',
    shearingDate: new Date('2024-09-25')
  }
];

// Function to generate batch updates
const generateBatchUpdates = (batchId, status) => {
  const updates = [];
  const baseDate = new Date();
  
  // Initial update
  updates.push({
    batch: batchId,
    status: 'At Farm',
    location: 'Farm Storage',
    notes: 'Wool sheared and stored at farm',
    timestamp: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000)
  });

  if (status === 'Processing' || status === 'Distributed') {
    updates.push({
      batch: batchId,
      status: 'Processing',
      location: 'Processing Facility',
      notes: 'Batch received at processing facility for cleaning and sorting',
      timestamp: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    });
  }

  if (status === 'Distributed') {
    updates.push({
      batch: batchId,
      status: 'Distributed',
      location: 'Distribution Center',
      notes: 'Processed wool distributed to retailers',
      timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000)
    });
  }

  return updates;
};

// Function to generate analytics data
const generateAnalytics = (farmId, farmName) => {
  return {
    farm: farmId,
    period: 'monthly',
    metrics: {
      totalProduction: Math.floor(Math.random() * 500) + 1000,
      averageQuality: (Math.random() * 2 + 3).toFixed(1),
      batchesProcessed: Math.floor(Math.random() * 20) + 10,
      revenue: Math.floor(Math.random() * 50000) + 100000
    },
    trends: {
      productionGrowth: (Math.random() * 20 - 5).toFixed(1),
      qualityImprovement: (Math.random() * 10).toFixed(1),
      efficiency: (Math.random() * 15 + 85).toFixed(1)
    },
    timestamp: new Date()
  };
};

// Main seeding function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Farm.deleteMany({});
    await Batch.deleteMany({});
    await BatchUpdate.deleteMany({});
    await Analytics.deleteMany({});

    // Create users with hashed passwords
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      createdUsers.push(user);
      console.log(`Created user: ${user.username} (${user.role})`);
    }

    // Create farms
    console.log('\nCreating farms...');
    const createdFarms = [];
    for (let i = 0; i < farms.length; i++) {
      const farm = await Farm.create({
        ...farms[i],
        owner: createdUsers[1]._id // Assign to farmer
      });
      createdFarms.push(farm);
      console.log(`Created farm: ${farm.name}`);
    }

    // Create batches
    console.log('\nCreating batches...');
    const createdBatches = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = await Batch.create({
        ...batches[i],
        farm: createdFarms[i % createdFarms.length]._id,
        owner: createdUsers[1]._id
      });
      createdBatches.push(batch);
      console.log(`Created batch: ${batch.batchNumber} - ${batch.status}`);
    }

    // Create batch updates
    console.log('\nCreating batch updates...');
    let totalUpdates = 0;
    for (const batch of createdBatches) {
      const updates = generateBatchUpdates(batch._id, batch.status);
      await BatchUpdate.insertMany(updates);
      totalUpdates += updates.length;
    }
    console.log(`Created ${totalUpdates} batch updates`);

    // Create analytics data
    console.log('\nCreating analytics data...');
    for (const farm of createdFarms) {
      const analytics = generateAnalytics(farm._id, farm.name);
      await Analytics.create(analytics);
      console.log(`Created analytics for: ${farm.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Farms: ${createdFarms.length}`);
    console.log(`- Batches: ${createdBatches.length}`);
    console.log(`- Batch Updates: ${totalUpdates}`);
    console.log(`- Analytics Records: ${createdFarms.length}`);
    console.log('\nCredentials for testing:');
    users.forEach(u => {
      console.log(`${u.role}: ${u.username} / ${u.password}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

module.exports = seedDatabase;
