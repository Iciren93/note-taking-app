const Joi = require('joi');

const authSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .max(100)
      .required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'string.max': 'Email cannot exceed 100 characters',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 100 characters',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

const noteSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 1 character long',
        'string.max': 'Title cannot exceed 255 characters',
        'any.required': 'Title is required'
      }),
    content: Joi.string()
      .min(1)
      .required()
      .messages({
        'string.min': 'Content must be at least 1 character long',
        'any.required': 'Content is required'
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(1)
      .max(255)
      .optional()
      .messages({
        'string.min': 'Title must be at least 1 character long',
        'string.max': 'Title cannot exceed 255 characters'
      }),
    content: Joi.string()
      .min(1)
      .optional()
      .messages({
        'string.min': 'Content must be at least 1 character long'
      }),
    version: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'Version must be a number',
        'number.integer': 'Version must be an integer',
        'number.min': 'Version must be at least 1',
        'any.required': 'Version is required for optimistic locking'
      })
  }).min(2) // At least title or content plus version
};

module.exports = {
  authSchemas,
  noteSchemas
};

