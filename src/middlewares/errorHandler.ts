import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class with HTTP status code
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  console.error(`Error: ${err.message}`);
  //console.error(err.stack);

  // Determine if this is a known API error or an unexpected error
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // In development mode, include the stack trace
  const response: any = {
    success: false,
    message,
  };
  
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};