const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      // The date for which these analytics are calculated
    },
    period: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
      required: true,
      default: 'Daily',
    },
    // Farm-related analytics
    farms: {
      total: {
        type: Number,
        default: 0,
      },
      active: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      approved: {
        type: Number,
        default: 0,
      },
      rejected: {
        type: Number,
        default: 0,
      },
      suspended: {
        type: Number,
        default: 0,
      },
      newRegistrations: {
        type: Number,
        default: 0,
      },
      byRegion: [
        {
          country: String,
          state: String,
          count: Number,
        },
      ],
      withOrganicCertification: {
        type: Number,
        default: 0,
      },
    },
    // Batch-related analytics
    batches: {
      total: {
        type: Number,
        default: 0,
      },
      inProgress: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      onHold: {
        type: Number,
        default: 0,
      },
      cancelled: {
        type: Number,
        default: 0,
      },
      withQualityIssues: {
        type: Number,
        default: 0,
      },
      byStage: [
        {
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
          },
          count: Number,
        },
      ],
      newBatches: {
        type: Number,
        default: 0,
      },
      completedBatches: {
        type: Number,
        default: 0,
      },
    },
    // Production metrics
    production: {
      totalWool: {
        value: {
          type: Number,
          default: 0,
        },
        unit: {
          type: String,
          default: 'kg',
        },
      },
      averageBatchWeight: {
        value: Number,
        unit: String,
      },
      topProducingFarms: [
        {
          farmId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Farm',
          },
          farmName: String,
          woolProduced: Number,
        },
      ],
    },
    // Quality metrics
    quality: {
      averageFiberDiameter: Number, // in microns
      averageCleanYield: Number, // percentage
      qualityIssuesReported: {
        type: Number,
        default: 0,
      },
      qualityIssuesResolved: {
        type: Number,
        default: 0,
      },
      qualityChecksPassed: {
        type: Number,
        default: 0,
      },
      qualityChecksFailed: {
        type: Number,
        default: 0,
      },
      issuesByType: [
        {
          type: String,
          count: Number,
        },
      ],
    },
    // Processing metrics
    processing: {
      averageProcessingTime: {
        value: Number, // in days
        unit: String,
      },
      batchesByProcessor: [
        {
          processorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          processorName: String,
          batchCount: Number,
        },
      ],
      delayedBatches: {
        type: Number,
        default: 0,
      },
      onTimeBatches: {
        type: Number,
        default: 0,
      },
    },
    // User activity metrics
    users: {
      total: {
        type: Number,
        default: 0,
      },
      active: {
        type: Number,
        default: 0,
      },
      byRole: [
        {
          role: {
            type: String,
            enum: ['Admin', 'Farmer', 'Processor', 'Distributor', 'Public'],
          },
          count: Number,
        },
      ],
      newUsers: {
        type: Number,
        default: 0,
      },
      lastLogin: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          userName: String,
          lastLoginDate: Date,
        },
      ],
    },
    // Revenue estimates
    revenue: {
      totalEstimated: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD',
        },
      },
      byFarm: [
        {
          farmId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Farm',
          },
          farmName: String,
          estimated: Number,
        },
      ],
      byStage: [
        {
          stage: String,
          value: Number,
        },
      ],
    },
    // System activity
    activity: {
      totalUpdates: {
        type: Number,
        default: 0,
      },
      batchUpdates: {
        type: Number,
        default: 0,
      },
      documentsUploaded: {
        type: Number,
        default: 0,
      },
      certificationsIssued: {
        type: Number,
        default: 0,
      },
      publicTraces: {
        type: Number,
        default: 0,
        // Number of times public users traced batches
      },
    },
    // Efficiency metrics
    efficiency: {
      averageStageCompletionTime: [
        {
          stage: String,
          averageTime: Number, // in days
        },
      ],
      bottlenecks: [
        {
          stage: String,
          batchCount: Number,
          averageDelay: Number, // in days
        },
      ],
    },
    // Sustainability metrics
    sustainability: {
      organicBatches: {
        type: Number,
        default: 0,
      },
      certifiedFarms: {
        type: Number,
        default: 0,
      },
      energyConsumed: {
        value: Number, // in kWh
        unit: String,
      },
      waterUsed: {
        value: Number, // in liters
        unit: String,
      },
    },
    // Metadata
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    calculatedBy: {
      type: String,
      default: 'System',
      // 'System' for automated calculations, or userId for manual
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// CRITICAL INDEX: date for time-series queries
analyticsSchema.index({ date: -1 });

// Index for period-based queries
analyticsSchema.index({ period: 1 });

// Compound index for period and date queries (most common dashboard query)
analyticsSchema.index({ period: 1, date: -1 });

// Index for calculation time queries
analyticsSchema.index({ calculatedAt: -1 });

// Unique compound index to prevent duplicate analytics for same date/period
analyticsSchema.index({ date: 1, period: 1 }, { unique: true });

// Static method to get latest analytics
analyticsSchema.statics.getLatest = async function (period = 'Daily') {
  return this.findOne({ period })
    .sort({ date: -1 })
    .lean();
};

// Static method to get analytics for a date range
analyticsSchema.statics.getDateRange = async function (
  startDate,
  endDate,
  period = 'Daily'
) {
  return this.find({
    period,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ date: 1 })
    .lean();
};

// Static method to get trends (comparison with previous period)
analyticsSchema.statics.getTrends = async function (period = 'Daily') {
  const latest = await this.findOne({ period }).sort({ date: -1 });
  if (!latest) return null;

  let previousDate;
  if (period === 'Daily') {
    previousDate = new Date(latest.date);
    previousDate.setDate(previousDate.getDate() - 1);
  } else if (period === 'Weekly') {
    previousDate = new Date(latest.date);
    previousDate.setDate(previousDate.getDate() - 7);
  } else if (period === 'Monthly') {
    previousDate = new Date(latest.date);
    previousDate.setMonth(previousDate.getMonth() - 1);
  }

  const previous = await this.findOne({ period, date: previousDate });

  return {
    current: latest,
    previous,
    trends: previous
      ? {
          farms: {
            total:
              ((latest.farms.total - previous.farms.total) /
                previous.farms.total) *
              100,
          },
          batches: {
            total:
              ((latest.batches.total - previous.batches.total) /
                previous.batches.total) *
              100,
          },
        }
      : null,
  };
};

// Method to calculate completion rate
analyticsSchema.methods.getCompletionRate = function () {
  if (this.batches.total === 0) return 0;
  return (this.batches.completed / this.batches.total) * 100;
};

// Method to calculate quality pass rate
analyticsSchema.methods.getQualityPassRate = function () {
  const total =
    this.quality.qualityChecksPassed + this.quality.qualityChecksFailed;
  if (total === 0) return 0;
  return (this.quality.qualityChecksPassed / total) * 100;
};

// Virtual for on-time delivery rate
analyticsSchema.virtual('onTimeRate').get(function () {
  const total = this.processing.onTimeBatches + this.processing.delayedBatches;
  if (total === 0) return 0;
  return (this.processing.onTimeBatches / total) * 100;
});

// Ensure virtuals are included in JSON output
analyticsSchema.set('toJSON', { virtuals: true });
analyticsSchema.set('toObject', { virtuals: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
