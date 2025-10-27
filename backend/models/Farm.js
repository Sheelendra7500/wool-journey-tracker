const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      maxlength: [200, 'Farm name cannot exceed 200 characters'],
    },
    farmCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated in pre-save hook if not provided
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farm owner is required'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Farm address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
      },
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number'],
      },
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          'Please provide a valid email address',
        ],
      },
      alternatePhone: {
        type: String,
        trim: true,
      },
    },
    certifications: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        issuedBy: {
          type: String,
          trim: true,
        },
        certificateNumber: {
          type: String,
          trim: true,
        },
        issuedDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
        isOrganic: {
          type: Boolean,
          default: false,
        },
        documentUrl: {
          type: String,
          trim: true,
        },
      },
    ],
    totalArea: {
      value: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['acres', 'hectares', 'sq_meters', 'sq_feet'],
        default: 'acres',
      },
    },
    sheepCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    establishedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Admin who approved the farm
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    registrationNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
    },
    images: [
      {
        url: String,
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    statistics: {
      totalBatches: {
        type: Number,
        default: 0,
      },
      totalWoolProduced: {
        type: Number,
        default: 0, // in kg
      },
      lastBatchDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for farm_id queries - critical for batch tracking
farmSchema.index({ _id: 1 });

// Index for owner queries - farmers viewing their farms
farmSchema.index({ ownerId: 1 });

// Index for approval status queries - admin workflows
farmSchema.index({ approvalStatus: 1 });

// Index for active farms
farmSchema.index({ isActive: 1 });

// Compound index for filtering active approved farms
farmSchema.index({ approvalStatus: 1, isActive: 1 });

// Index for location-based queries
farmSchema.index({ 'location.state': 1, 'location.country': 1 });

// Index for farm code lookups
farmSchema.index({ farmCode: 1 });

// Text index for search functionality
farmSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate farm code if not provided
farmSchema.pre('save', async function (next) {
  if (!this.farmCode) {
    // Generate farm code: FARM-{YEAR}-{RANDOM}
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.farmCode = `FARM-${year}-${random}`;
  }
  next();
});

// Method to check if farm has valid organic certification
farmSchema.methods.hasValidOrganicCertification = function () {
  const now = new Date();
  return this.certifications.some(
    (cert) =>
      cert.isOrganic &&
      (!cert.expiryDate || cert.expiryDate > now)
  );
};

// Virtual for full address
farmSchema.virtual('fullAddress').get(function () {
  const loc = this.location;
  return `${loc.address}, ${loc.city}, ${loc.state}, ${loc.country} ${loc.zipCode || ''}`;
});

// Ensure virtuals are included in JSON output
farmSchema.set('toJSON', { virtuals: true });
farmSchema.set('toObject', { virtuals: true });

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;
