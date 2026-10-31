const Joi = require('joi');

const teamRegistrationSchema = Joi.object({
  problemStatementId: Joi.string().required().messages({
    'string.empty': 'Problem Statement ID is required.'
  }),
  teamName: Joi.string().trim().required().messages({
    'string.empty': 'Team Name is required.'
  }),
  leaderName: Joi.string().trim().required().messages({
    'string.empty': 'Leader Name is required.'
  }),
  leaderGender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
    'any.only': 'Leader Gender must be Male, Female, or Other.'
  }),
  mentorName: Joi.string().trim().required().messages({
    'string.empty': 'Mentor Name is required.'
  }),
  members: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      gender: Joi.string().valid('Male', 'Female', 'Other').required()
    })
  ).required()
}).custom((value, helpers) => {
  // Check team size: Leader + Members (4 to 6 total)
  const totalMembers = 1 + (value.members ? value.members.length : 0);
  if (totalMembers < 4 || totalMembers > 6) {
    return helpers.message(`Team must have between 4 and 6 members including the leader. Currently has ${totalMembers}.`);
  }

  // Check gender diversity: At least 1 female
  let hasFemale = false;
  if (value.leaderGender === 'Female') hasFemale = true;
  if (!hasFemale && value.members) {
    hasFemale = value.members.some(member => member.gender === 'Female');
  }

  if (!hasFemale) {
    return helpers.message('Team must have at least one female member to ensure gender diversity.');
  }

  return value;
}, 'Team Registration Validation');

const solutionSubmissionSchema = Joi.object({
  docxLink: Joi.string().uri().required().messages({
    'string.uri': 'DOCX Link must be a valid URL.',
    'string.empty': 'DOCX Link is required.'
  }),
  demoVideoLink: Joi.string().uri().allow('', null).optional(),
  prototypeLink: Joi.string().uri().allow('', null).optional(),
  description: Joi.string().trim().required().messages({
    'string.empty': 'Solution description is required.'
  })
});

const validateTeamRegistration = (data) => teamRegistrationSchema.validate(data, { abortEarly: false });
const validateSolutionSubmission = (data) => solutionSubmissionSchema.validate(data, { abortEarly: false });

module.exports = {
  validateTeamRegistration,
  validateSolutionSubmission
};
