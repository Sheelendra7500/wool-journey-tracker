const mongoose = require('mongoose');

const batchUpdateSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
    },
    batchCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      // Denormalized for faster queries
    },
    stage: {
      type: String,
      enum: [
        'Shearing',
        'Cleaning',
        'Sorting',
        'Carding',
        'Spinning',
        'Weaving',
        'Dyeing',
        'Finishing',
        'Distribution',
        'Completed',
      ],
      required: [true, 'Stage is required'],
    },
    status: {
      type: String,
      enum: [
        'Started',
        'In Progress',
        'Completed',
        'On Hold',
        'Quality Check',
        'Rejected',
        'Approved',
      ],
      required: [true, 'Status is required'],
    },
    location: {
      facilityName: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      city: String,
      state: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    updatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User who made the update is required'],
      },
      name: String,
      role: String,
      company: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    documents: [
      {
        title: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          enum: [
            'Certificate',
            'Test Report',
            'Invoice',
            'Photo',
            'Inspection Report',
            'Quality Check',
            'Other',
          ],
        },
        url: {
          type: String,
          required: true,
        },
        fileSize: Number, // in bytes
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    measurements: {
      weight: {
        value: Number,
        unit: String,
        change: Number, // Change from previous measurement
      },
      moisture: {
        value: Number, // percentage
        acceptable: Boolean,
      },
      temperature: {
        value: Number,
        unit: {
          type: String,
          enum: ['Celsius', 'Fahrenheit'],
        },
      },
    },
    qualityCheck: {
      performed: {
        type: Boolean,
        default: false,
      },
      passed: Boolean,
      inspector: String,
      inspectionDate: Date,
      findings: String,
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    processingDetails: {
      machineUsed: String,
      batchSize: Number,
      processingTime: {
        value: Number,
        unit: {
          type: String,
          enum: ['minutes', 'hours', 'days'],
        },
      },
      operator: String,
      energyConsumed: Number, // in kWh
      waterUsed: Number, // in liters
    },
    issues: [
      {
        type: {
          type: String,
          enum: ['Quality', 'Delay', 'Equipment', 'Safety', 'Other'],
        },
        description: String,
        severity: {
          type: String,
          enum: ['Low', 'Medium', 'High', 'Critical'],
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    estimatedCompletionDate: {
      type: Date,
    },
    actualCompletionDate: {
      type: Date,
    },
    previousStage: {
      type: String,
    },
    nextStage: {
      type: String,
    },
    isRealtimeUpdate: {
      type: Boolean,
      default: false,
      // Flag to indicate if this update should trigger real-time notifications
    },
    notificationsSent: {
      type: Boolean,
      default: false,
    },
    stakeholdersNotified: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notifiedAt: Date,
        method: {
          type: String,
          enum: ['Email', 'SMS', 'Push', 'In-App'],
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// CRITICAL INDEX: batchId for batch update queries
batchUpdateSchema.index({ batchId: 1 });

// Index for batch code lookups
batchUpdateSchema.index({ batchCode: 1 });

// Index for stage queries
batchUpdateSchema.index({ stage: 1 });

// Index for timestamp-based queries (chronological order)
batchUpdateSchema.index({ timestamp: -1 });

// Compound index for batch timeline queries
batchUpdateSchema.index({ batchId: 1, timestamp: -1 });

// Index for user activity tracking
batchUpdateSchema.index({ 'updatedBy.userId': 1 });

// Compound index for batch stage updates
batchUpdateSchema.index({ batchId: 1, stage: 1 });

// Index for real-time updates
batchUpdateSchema.index({ isRealtimeUpdate: 1, notificationsSent: 1 });

// Index for quality check queries
batchUpdateSchema.index({ 'qualityCheck.performed': 1, 'qualityCheck.passed': 1 });

// Pre-save middleware to auto-populate denormalized fields
batchUpdateSchema.pre('save', async function (next) {
  try {
    // If batchCode is not provided, fetch it from the batch
    if (!this.batchCode && this.batchId) {
      const Batch = mongoose.model('Batch');
      const batch = await Batch.findById(this.batchId).select('batchCode');
      if (batch) {
        this.batchCode = batch.batchCode;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update batch statistics
batchUpdateSchema.post('save', async function (doc) {
  try {
    const Batch = mongoose.model('Batch');
    await Batch.findByIdAndUpdate(doc.batchId, {
      $inc: { 'statistics.totalUpdates': 1 },
      $set: {
        'statistics.lastUpdateDate': doc.timestamp,
        currentStage: doc.stage,
        currentLocation: doc.location,
      },
    });
  } catch (error) {
    console.error('Error updating batch statistics:', error);
  }
});

// Method to check if update has unresolved issues
batchUpdateSchema.methods.hasUnresolvedIssues = function () {
  return this.issues.some((issue) => !issue.resolved);
};

// Static method to get updates for a specific batch
batchUpdateSchema.statics.getBatchTimeline = async function (batchId) {
  return this.find({ batchId })
    .sort({ timestamp: 1 })
    .populate('updatedBy.userId', 'name email')
    .lean();
};

// Static method to get recent updates
batchUpdateSchema.statics.getRecentUpdates = async function (limit = 10) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('batchId', 'batchCode farmName')
    .populate('updatedBy.userId', 'name')
    .lean();
};

const BatchUpdate = mongoose.model('BatchUpdate', batchUpdateSchema);

module.exports = BatchUpdate;
