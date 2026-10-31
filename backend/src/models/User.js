const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = {
  INDIVIDUAL_CITIZEN: 'INDIVIDUAL_CITIZEN',
  NGO_COMMUNITY: 'NGO_COMMUNITY',
  LOCAL_BODY: 'LOCAL_BODY',
  GOVT_OFFICER: 'GOVT_OFFICER',
  INSTITUTE_ADMIN: 'INSTITUTE_ADMIN',
  FACULTY_MENTOR: 'FACULTY_MENTOR',
  STUDENT_INNOVATOR: 'STUDENT_INNOVATOR',
  INDUSTRY_PARTNER: 'INDUSTRY_PARTNER'
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'LOCAL';
      },
      select: false
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: Object.values(ROLES)
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE', 'DIGILOCKER'],
      default: 'LOCAL'
    },
    googleId: {
      type: String,
      default: null
    },
    digilockerId: {
      type: String,
      default: null
    },
    preferredLanguage: {
      type: String,
      enum: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'],
      default: 'English',
      trim: true
    },
    // Role Specific Detailed Profile Data
    profileDetails: {
      // Role A: Individual Citizen
      fullName: String,
      district: String,
      state: String,
      pincode: String,

      // Role B: NGO / Community
      organizationName: String,
      authorizedRepresentativeName: String,
      designation: String,
      focusAreas: String,
      officeAddress: String,

      // Role C: Local Body
      localBodyType: String, // Gram Panchayat, Municipal Council, Municipal Corporation, Block
      localBodyName: String,
      lgdCode: String,
      authorizedOfficialName: String,
      officialDesignation: String,

      // Role D: Government Officer
      officialGovEmail: String,
      employeeId: String,
      departmentMinistry: String,
      jurisdictionState: String,
      jurisdictionDistrict: String,

      // Role E: University / Institute Admin
      institutionName: String,
      aisheCode: String,
      institutionType: String, // Central, State, Autonomous, Private
      authorizedContactPersonName: String,
      officialInstituteEmail: String,
      website: String,
      campusCity: String,

      // Role F: Faculty Mentor
      facultyEmployeeId: String,
      associatedInstitution: String,
      department: String,
      researchDomains: String,
      officialInstitutionalEmail: String,

      // Role G: Student / Innovator
      rollNumber: String,
      collegeName: String,
      currentDegreeProgram: String,
      branchSpecialization: String,
      graduationYear: Number,
      technicalSkills: String,

      // Role H: Industry Partner / CSR Sponsor
      companyName: String,
      cin: String,
      panNumber: String,
      industrySector: String,
      primarySpocName: String,
      spocDesignation: String,
      officialWorkEmail: String,
      companyWebsite: String,
      headquartersCity: String,
      headquartersState: String
    },
    lastKnownLocation: {
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      district: { type: String, trim: true },
      updatedAt: { type: Date, default: Date.now }
    },
    fcmTokens: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

User.User = User;
User.ROLES = ROLES;

module.exports = User;
module.exports.User = User;
module.exports.ROLES = ROLES;
