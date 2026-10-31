const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemStatement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemStatement',
    required: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  leaderName: {
    type: String,
    required: true,
    trim: true
  },
  leaderGender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  mentorName: {
    type: String,
    required: true,
    trim: true
  },
  members: [memberSchema],
  solution: {
    docxLink: { type: String },
    demoVideoLink: { type: String },
    prototypeLink: { type: String },
    description: { type: String },
    submittedAt: { type: Date }
  },
  industryAllocation: {
    companyName: { type: String },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' }
  }
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
