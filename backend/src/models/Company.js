const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    domain: {
      type: String,
      required: [true, 'Industry domain is required'],
      trim: true
    },
    expertise: {
      type: String,
      required: [true, 'Technical expertise description is required'],
      trim: true
    },
    location: {
      address: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      coordinates: {
        latitude: { type: Number, default: 0.0 },
        longitude: { type: Number, default: 0.0 }
      }
    },
    is_verified: {
      type: Boolean,
      default: true
    },
    contactEmail: {
      type: String,
      trim: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    registeredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);
