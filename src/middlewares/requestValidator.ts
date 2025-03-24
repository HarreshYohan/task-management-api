import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from './errorHandlers';

/**
 * Validation middleware factory
 * @param schema Joi schema for validation
 * @param property Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!error) {
      return next();
    }

    const validationErrors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    next(
      new ApiError(
        400,
        'Validation error: ' + error.details.map(x => x.message).join(', ')
      )
    );
  };
};

/**
 * Task validation schema
 */
export const taskSchema = Joi.object({
  title: Joi.string().required().min(1).max(100),
  description: Joi.string().required().min(1).max(1000),
  status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending'),
  fileUrl: Joi.string().uri().optional(),
});

/**
 * Task update validation schema (all fields optional)
 */
export const taskUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(100).optional(),
  description: Joi.string().min(1).max(1000).optional(),
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  fileUrl: Joi.string().uri().optional(),
}).min(1); // At least one field must be provided