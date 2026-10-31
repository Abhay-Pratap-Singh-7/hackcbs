const Joi = require('joi');

const validateProblemSubmission = (data) => {
  const schema = Joi.object({
    language: Joi.string().valid('English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu').trim().optional().default('English'),
    title: Joi.string().trim().allow('', null).optional(),
    description: Joi.string().trim().min(20).required().messages({
      'string.min': 'Description must be at least 20 characters long describing the ground reality',
      'any.required': 'Description is mandatory'
    }),
    location: Joi.object({
      address: Joi.string().trim().allow('', null).optional(),
      district: Joi.string().trim().required().messages({
        'any.required': 'District location is required'
      }),
      state: Joi.string().trim().required().messages({
        'any.required': 'State location is required'
      }),
      pincode: Joi.string().pattern(/^\d{6}$/).allow('', null).optional(),
      ward: Joi.string().trim().allow('', null).optional(),
      block: Joi.string().trim().allow('', null).optional(),
      village: Joi.string().trim().allow('', null).optional(),
      latitude: Joi.number().min(-90).max(90).allow('', null).optional(),
      longitude: Joi.number().min(-180).max(180).allow('', null).optional(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).allow('', null).optional(),
        longitude: Joi.number().min(-180).max(180).allow('', null).optional()
      }).optional()
    }).required().messages({
      'any.required': 'Location details are mandatory'
    }),
    imagesAndMedia: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        mediaType: Joi.string().valid('image', 'video', 'document', 'audio').default('image'),
        name: Joi.string().allow('', null).optional()
      })
    ).optional(),
    desiredOutcome: Joi.string().trim().allow('', null).optional(),
    supportingInfo: Joi.object({
      affectedPopulation: Joi.string().trim().allow('', null).optional(),
      urgency: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
      existingInterventions: Joi.string().trim().allow('', null).optional()
    }).optional(),
    selfTags: Joi.object({
      suggestedDomain: Joi.string().trim().allow('', null).optional(),
      keywords: Joi.array().items(Joi.string().trim()).optional()
    }).optional()
  });

  return schema.validate(data, { abortEarly: false, allowUnknown: true });
};

module.exports = { validateProblemSubmission };
