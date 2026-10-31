const mongoose = require('mongoose');

const problemStatementSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'],
      default: 'English',
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Problem description is mandatory'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters long']
    },
    englishTitle: {
      type: String,
      trim: true
    },
    englishDescription: {
      type: String,
      trim: true
    },
    location: {
      address: { type: String, trim: true },
      district: { type: String, required: [true, 'District location is required'], trim: true },
      state: { type: String, required: [true, 'State location is required'], trim: true },
      pincode: { type: String, trim: true },
      ward: { type: String, trim: true },
      block: { type: String, trim: true },
      village: { type: String, trim: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    imagesAndMedia: [
      {
        url: { type: String, required: true },
        mediaType: { type: String, enum: ['image', 'video', 'document', 'audio'], default: 'image' },
        name: { type: String }
      }
    ],
    desiredOutcome: {
      type: String,
      trim: true
    },
    supportingInfo: {
      affectedPopulation: { type: String, trim: true },
      urgency: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
      },
      existingInterventions: { type: String, trim: true }
    },
    selfTags: {
      suggestedDomain: { type: String, trim: true },
      keywords: [{ type: String, trim: true }]
    },

    // ─── Frame 3: Groq AI Classification Output ───────────────────────────────
    aiAnalysis: {
      summary: String,
      summary_original: String,
      key_points: String,
      problem_classification: String,
      severity: String,
      suggested_solution: String,
      suggested_solution_original: String,
      required_expertise: [String],
      analyzedAt: { type: Date, default: Date.now }
    },

    // ─── Frame 3b: Dense Embedding Vector (1024-d multilingual-e5-large) ──────
    embedding: {
      type: [Number],
      select: false  // Never sent to frontend (large array)
    },

    // ─── Frame 3c: Deduplication Engine Output (FAISS + Haversine) ───────────
    isDuplicate: {
      type: Boolean,
      default: false
    },
    duplicateOf: {
      problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemStatement' },
      similarityScore: { type: Number },
      distanceKm: { type: Number }
    },
    masterTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemStatement'
    },

    // ─── Frame 3d: College Matcher Output (Domain + Geo + Semantic) ───────────
    collegeSuggestions: [
      {
        college_name: { type: String },
        district: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        distance_km: { type: Number },
        domain: { type: String },
        faculty_expertise: { type: String },
        infrastructure: { type: String },
        match_score: { type: Number },
        match_breakdown: {
          domain_score: { type: Number },
          geo_score: { type: Number },
          semantic_score: { type: Number }
        }
      }
    ],

    // ─── Frame 3e: Company / Industry Matcher Output (Domain + Geo + Semantic) ──
    companySuggestions: [
      {
        id: { type: String },
        company_name: { type: String },
        domain: { type: String },
        expertise: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        distance_km: { type: Number },
        is_verified: { type: Boolean, default: true },
        source: { type: String },
        match_score: { type: Number },
        match_breakdown: {
          domain_score: { type: Number },
          geo_score: { type: Number },
          semantic_score: { type: Number }
        }
      }
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acceptedByUniversityName: {
      type: String
    },
    rejectedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'CLASSIFIED',
        'DUPLICATE',
        'ALLOCATED',
        'ACCEPTED',
        'IN_PROGRESS',
        'PROPOSAL',
        'PROTOTYPE',
        'VALIDATED',
        'DEPLOYED'
      ],
      default: 'SUBMITTED'
    },
    upvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    upvotesCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    duplicateReports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String, trim: true },
        masterTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemStatement' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    contentReports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        details: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    flaggedForReview: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate title from description if omitted by user
problemStatementSchema.pre('save', function (next) {
  if (!this.title || this.title.trim() === '') {
    const cleanDesc = this.description.trim().replace(/[\r\n]+/g, ' ');
    const firstSentence = cleanDesc.split('.')[0].trim();
    this.title = firstSentence.length > 0 ? firstSentence : cleanDesc;
  }
  next();
});

const ProblemStatement = mongoose.model('ProblemStatement', problemStatementSchema);

const yugabyteService = require('../services/yugabyteDataService');

const ProblemStatementProxy = new Proxy(ProblemStatement, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop === 'find') return (q) => yugabyteService.problems.find(q);
    if (prop === 'findById') return (id) => yugabyteService.problems.findById(id);
    if (prop === 'create') return (data) => yugabyteService.problems.create(data);
    if (prop === 'countDocuments') return (q) => yugabyteService.problems.countDocuments(q);
    return target[prop];
  }
});

module.exports = ProblemStatementProxy;
