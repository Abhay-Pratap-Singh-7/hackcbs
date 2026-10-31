const Joi = require('joi');
const { ROLES } = require('../models/User');

// Common password rule (min 6 characters)
const passwordSchema = Joi.string().min(6).required().messages({
  'string.min': 'Password must be at least 6 characters long',
  'any.required': 'Password is required'
});

// Role A: Individual Citizen Schema
const individualCitizenSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  district: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Pincode must be a valid 6-digit number'
  })
});

// Role B: NGO / Community Schema
const ngoCommunitySchema = Joi.object({
  organizationName: Joi.string().trim().required(),
  authorizedRepresentativeName: Joi.string().trim().required(),
  designation: Joi.string().trim().required(),
  focusAreas: Joi.string().trim().required(),
  officeAddress: Joi.string().trim().required(),
  district: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required()
});

// Role C: Local Body Schema
const localBodySchema = Joi.object({
  localBodyType: Joi.string().valid('Gram Panchayat', 'Municipal Council', 'Municipal Corporation', 'Block').required(),
  localBodyName: Joi.string().trim().required(),
  lgdCode: Joi.string().trim().required(),
  authorizedOfficialName: Joi.string().trim().required(),
  officialDesignation: Joi.string().valid('Sarpanch', 'Ward Officer', 'Commissioner', 'Block Development Officer', 'Other').required(),
  district: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required()
});

// Role D: Government Officer Schema (Requires @gov.in or @nic.in)
const govtOfficerSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  officialGovEmail: Joi.string().email().required(),
  employeeId: Joi.string().trim().required(),
  departmentMinistry: Joi.string().trim().required(),
  designation: Joi.string().trim().required(),
  jurisdictionState: Joi.string().trim().required(),
  jurisdictionDistrict: Joi.string().trim().required()
});

// Role E: Institute Admin Schema
const instituteAdminSchema = Joi.object({
  institutionName: Joi.string().trim().required(),
  aisheCode: Joi.string().trim().required(),
  institutionType: Joi.string().valid('Central', 'State', 'Autonomous', 'Private').required(),
  authorizedContactPersonName: Joi.string().trim().required(),
  designation: Joi.string().trim().required(),
  officialInstituteEmail: Joi.string().email().required(),
  website: Joi.string().uri().allow('', null).optional(),
  campusCity: Joi.string().trim().required(),
  district: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required()
});

// Role F: Faculty Mentor Schema
const facultyMentorSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  facultyEmployeeId: Joi.string().trim().required(),
  associatedInstitution: Joi.string().trim().required(),
  aisheCode: Joi.string().trim().optional().allow(''),
  department: Joi.string().trim().required(),
  designation: Joi.string().trim().required(),
  researchDomains: Joi.string().trim().required(),
  officialInstitutionalEmail: Joi.string().email().required()
});

// Role G: Student / Innovator Schema
const studentInnovatorSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  rollNumber: Joi.string().trim().required(),
  collegeName: Joi.string().trim().required(),
  currentDegreeProgram: Joi.string().trim().required(),
  branchSpecialization: Joi.string().trim().required(),
  graduationYear: Joi.number().integer().min(2020).max(2035).required(),
  technicalSkills: Joi.string().trim().required()
});

// Role H: Industry Partner Schema
const industryPartnerSchema = Joi.object({
  companyName: Joi.string().trim().required(),
  cin: Joi.string().trim().required(),
  panNumber: Joi.string().trim().uppercase().required(),
  industrySector: Joi.string().trim().required(),
  primarySpocName: Joi.string().trim().required(),
  spocDesignation: Joi.string().trim().required(),
  officialWorkEmail: Joi.string().email().required(),
  companyWebsite: Joi.string().uri().allow('', null).optional(),
  headquartersCity: Joi.string().trim().required(),
  headquartersState: Joi.string().trim().required()
});

// Map of role to schema
const roleSchemas = {
  [ROLES.INDIVIDUAL_CITIZEN]: individualCitizenSchema,
  [ROLES.NGO_COMMUNITY]: ngoCommunitySchema,
  [ROLES.LOCAL_BODY]: localBodySchema,
  [ROLES.GOVT_OFFICER]: govtOfficerSchema,
  [ROLES.INSTITUTE_ADMIN]: instituteAdminSchema,
  [ROLES.FACULTY_MENTOR]: facultyMentorSchema,
  [ROLES.STUDENT_INNOVATOR]: studentInnovatorSchema,
  [ROLES.INDUSTRY_PARTNER]: industryPartnerSchema
};

// Comprehensive Signup Validator
const validateSignup = (data) => {
  // Common Fields
  const baseSchema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Confirm password must match password'
    }),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
    recaptchaToken: Joi.string().optional().allow(''),
    preferredLanguage: Joi.string().valid('English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu').trim().optional().default('English'),
    profileDetails: Joi.object().required().messages({
      'any.required': 'Profile details matching selected role are required'
    })
  });

  const baseValidation = baseSchema.validate(data, { abortEarly: false, allowUnknown: true });
  if (baseValidation.error) {
    return baseValidation;
  }

  // Role Specific Schema Validation
  const roleSchema = roleSchemas[data.role];
  if (!roleSchema) {
    return { error: { details: [{ message: `Invalid role specified: ${data.role}` }] } };
  }

  const roleValidation = roleSchema.validate(data.profileDetails, { abortEarly: false, allowUnknown: true });
  return roleValidation;
};

// Login Validation Schema
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
    recaptchaToken: Joi.string().optional().allow('')
  });
  return schema.validate(data, { abortEarly: false });
};

// OTP Verification Validation
const validateOtpVerification = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().length(6).required(),
    purpose: Joi.string().valid('SIGNUP_VERIFY', 'LOGIN_VERIFY', 'PASSWORD_RESET').default('SIGNUP_VERIFY')
  });
  return schema.validate(data, { abortEarly: false });
};

// Resend OTP Validation
const validateResendOtp = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    purpose: Joi.string().valid('SIGNUP_VERIFY', 'LOGIN_VERIFY', 'PASSWORD_RESET').default('SIGNUP_VERIFY')
  });
  return schema.validate(data, { abortEarly: false });
};

// Refresh Token Validation
const validateRefreshToken = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required()
  });
  return schema.validate(data, { abortEarly: false });
};

// Forgot Password Validation
const validateForgotPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required()
  });
  return schema.validate(data, { abortEarly: false });
};

// Reset Password Validation
const validateResetPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().length(6).required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match'
    })
  });
  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  validateSignup,
  validateLogin,
  validateOtpVerification,
  validateResendOtp,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword
};
