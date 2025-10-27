const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // Format: WOOL-YYYYMMDD-XXX
      match: [
        /^WOOL-\d{8}-\d{3,4}$/,
        'Batch code must follow format WOOL-YYYYMMDD-XXX',
      ],
    },
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm reference is required'],
    },
    farmName: {
      type: String,
      trim: true,
      // Denormalized for faster queries
    },
    weight: {
      value: {
        type: Number,
        required: [true, 'Weight value is required'],
        min: [0, 'Weight cannot be negative'],
      },
      unit: {
        type: String,
        enum: ['kg', 'lbs', 'grams'],
        default: 'kg',
      },
    },
    shearingDate: {
      type: Date,
      required: [true, 'Shearing date is required'],
    },
    qualityMetrics: {
      fiberDiameter: {
        value: Number, // in microns
        grade: {
          type: String,
          enum: ['Ultrafine', 'Superfine', 'Fine', 'Medium', 'Strong', 'Coarse'],
        },
      },
      stapleLength: {
        value: Number, // in cm
        unit: String,
      },
      cleanYield: {
        type: Number, // percentage
        min: 0,
        max: 100,
      },
      color: {
        type: String,
        enum: ['White', 'Off-White', 'Cream', 'Brown', 'Black', 'Gray', 'Mixed'],
      },
      strength: {
        value: Number, // N/ktex
        rating: {
          type: String,
          enum: ['Excellent', 'Good', 'Fair', 'Poor'],
        },
      },
      vegetableMatter: {
        type: Number, // percentage
        min: 0,
        max: 100,
      },
      crimp: {
        type: String,
        enum: ['High', 'Medium', 'Low', 'None'],
      },
    },
    currentStage: {
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
      default: 'Shearing',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'In Progress',
        'On Hold',
        'Quality Issue',
        'Delayed',
        'Completed',
        'Cancelled',
      ],
      default: 'In Progress',
      required: true,
    },
    currentLocation: {
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
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    currentProcessor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      company: String,
      contactEmail: String,
      contactPhone: String,
    },
    certifications: [
      {
        type: {
          type: String,
          enum: ['Organic', 'Fair Trade', 'Animal Welfare', 'Sustainability', 'Quality'],
        },
        certifiedBy: String,
        certificateNumber: String,
        issuedDate: Date,
        expiryDate: Date,
        documentUrl: String,
      },
    ],
    qualityIssues: [
      {
        issueType: {
          type: String,
          enum: [
            'Contamination',
            'Low Quality',
            'Damage',
            'Mislabeling',
            'Documentation',
            'Other',
          ],
        },
        description: String,
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        severity: {
          type: String,
          enum: ['Low', 'Medium', 'High', 'Critical'],
        },
        resolved: {
          type: Boolean,
          default: false,
        },
        resolvedAt: Date,
        resolution: String,
      },
    ],
    estimatedCompletionDate: {
      type: Date,
    },
    actualCompletionDate: {
      type: Date,
    },
    revenueEstimate: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    documents: [
      {
        title: String,
        type: {
          type: String,
          enum: ['Certificate', 'Test Report', 'Invoice', 'Photo', 'Other'],
        },
        url: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        fileSize: Number, // in bytes
        mimeType: String,
      },
    ],
    timeline: [
      {
        stage: String,
        startDate: Date,
        endDate: Date,
        duration: Number, // in days
      },
    ],
    isPubliclyVisible: {
      type: Boolean,
      default: true, // Allows end-users to trace the batch
    },
    statistics: {
      totalUpdates: {
        type: Number,
        default: 0,
      },
      lastUpdateDate: {
        type: Date,
      },
      processingDuration: {
        type: Number, // in days
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// CRITICAL INDEX: batch_code for lookups and public tracing
batchSchema.index({ batchCode: 1 });

// CRITICAL INDEX: farm_id for farm-related queries
batchSchema.index({ farmId: 1 });

// Index for current stage queries
batchSchema.index({ currentStage: 1 });

// Index for status queries
batchSchema.index({ status: 1 });

// Compound index for active batches at a stage
batchSchema.index({ currentStage: 1, status: 1 });

// Index for processor queries
batchSchema.index({ 'currentProcessor.userId': 1 });

// Index for date range queries
batchSchema.index({ shearingDate: 1 });
batchSchema.index({ createdAt: 1 });

// Compound index for farm batches by date
batchSchema.index({ farmId: 1, shearingDate: -1 });

// Index for public visibility
batchSchema.index({ isPubliclyVisible: 1 });

// Text index for search functionality
batchSchema.index({ batchCode: 'text', farmName: 'text', notes: 'text' });

// Pre-save middleware to auto-generate batch code if not provided
batchSchema.pre('save', async function (next) {
  if (!this.batchCode) {
    // Generate batch code: WOOL-YYYYMMDD-XXX
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    this.batchCode = `WOOL-${year}${month}${day}-${random}`;
  }
  next();
});

// Method to check if batch has quality issues
batchSchema.methods.hasActiveQualityIssues = function () {
  return this.qualityIssues.some((issue) => !issue.resolved);
};

// Method to calculate processing duration
batchSchema.methods.calculateProcessingDuration = function () {
  if (this.actualCompletionDate) {
    const start = this.shearingDate || this.createdAt;
    const end = this.actualCompletionDate;
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
    return duration;
  }
  return null;
};

// Method to get current stage progress percentage
batchSchema.methods.getProgressPercentage = function () {
  const stages = [
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
  ];
  const currentIndex = stages.indexOf(this.currentStage);
  if (currentIndex === -1) return 0;
  return Math.round(((currentIndex + 1) / stages.length) * 100);
};

// Virtual for weight in kg (for consistent calculations)
batchSchema.virtual('weightInKg').get(function () {
  if (this.weight.unit === 'kg') return this.weight.value;
  if (this.weight.unit === 'lbs') return this.weight.value * 0.453592;
  if (this.weight.unit === 'grams') return this.weight.value / 1000;
  return this.weight.value;
});

// Method to sanitize data for public view
batchSchema.methods.toPublicJSON = function () {
  return {
    batchCode: this.batchCode,
    farmName: this.farmName,
    shearingDate: this.shearingDate,
    currentStage: this.currentStage,
    currentLocation: this.currentLocation,
    qualityMetrics: this.qualityMetrics,
    certifications: this.certifications,
    timeline: this.timeline,
    weight: this.weight,
    createdAt: this.createdAt,
  };
};

// Ensure virtuals are included in JSON output
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
