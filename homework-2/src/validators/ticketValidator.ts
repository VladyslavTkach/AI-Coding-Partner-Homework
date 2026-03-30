import Joi from 'joi';
import { CreateTicketDTO, UpdateTicketDTO } from '../types';
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  SOURCES,
  DEVICE_TYPES,
  SUBJECT_MIN_LENGTH,
  SUBJECT_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  DESCRIPTION_MAX_LENGTH
} from '../utils/constants';

const metadataSchema = Joi.object({
  source: Joi.string().valid(...SOURCES).optional(),
  browser: Joi.string().optional(),
  device_type: Joi.string().valid(...DEVICE_TYPES).optional()
}).optional();

const createTicketSchema = Joi.object({
  customer_id: Joi.string().required().messages({
    'string.empty': 'customer_id is required',
    'any.required': 'customer_id is required'
  }),
  customer_email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'customer_email is required',
    'any.required': 'customer_email is required'
  }),
  customer_name: Joi.string().required().messages({
    'string.empty': 'customer_name is required',
    'any.required': 'customer_name is required'
  }),
  subject: Joi.string()
    .min(SUBJECT_MIN_LENGTH)
    .max(SUBJECT_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Subject must be at least ${SUBJECT_MIN_LENGTH} character`,
      'string.max': `Subject must be at most ${SUBJECT_MAX_LENGTH} characters`,
      'string.empty': 'Subject is required',
      'any.required': 'Subject is required'
    }),
  description: Joi.string()
    .min(DESCRIPTION_MIN_LENGTH)
    .max(DESCRIPTION_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`,
      'string.max': `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
      'string.empty': 'Description is required',
      'any.required': 'Description is required'
    }),
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
    'any.required': 'Category is required'
  }),
  priority: Joi.string().valid(...PRIORITIES).required().messages({
    'any.only': `Priority must be one of: ${PRIORITIES.join(', ')}`,
    'any.required': 'Priority is required'
  }),
  status: Joi.string().valid(...STATUSES).optional().messages({
    'any.only': `Status must be one of: ${STATUSES.join(', ')}`
  }),
  assigned_to: Joi.string().allow(null).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: metadataSchema
});

const updateTicketSchema = Joi.object({
  customer_id: Joi.string().optional(),
  customer_email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email format'
  }),
  customer_name: Joi.string().optional(),
  subject: Joi.string()
    .min(SUBJECT_MIN_LENGTH)
    .max(SUBJECT_MAX_LENGTH)
    .optional()
    .messages({
      'string.min': `Subject must be at least ${SUBJECT_MIN_LENGTH} character`,
      'string.max': `Subject must be at most ${SUBJECT_MAX_LENGTH} characters`
    }),
  description: Joi.string()
    .min(DESCRIPTION_MIN_LENGTH)
    .max(DESCRIPTION_MAX_LENGTH)
    .optional()
    .messages({
      'string.min': `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`,
      'string.max': `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`
    }),
  category: Joi.string().valid(...CATEGORIES).optional().messages({
    'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`
  }),
  priority: Joi.string().valid(...PRIORITIES).optional().messages({
    'any.only': `Priority must be one of: ${PRIORITIES.join(', ')}`
  }),
  status: Joi.string().valid(...STATUSES).optional().messages({
    'any.only': `Status must be one of: ${STATUSES.join(', ')}`
  }),
  assigned_to: Joi.string().allow(null).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: metadataSchema
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export function validateTicket(data: unknown): { error?: Joi.ValidationError; value: CreateTicketDTO } {
  return createTicketSchema.validate(data, { abortEarly: false }) as { error?: Joi.ValidationError; value: CreateTicketDTO };
}

export function validatePartialTicket(data: unknown): { error?: Joi.ValidationError; value: UpdateTicketDTO } {
  return updateTicketSchema.validate(data, { abortEarly: false }) as { error?: Joi.ValidationError; value: UpdateTicketDTO };
}
