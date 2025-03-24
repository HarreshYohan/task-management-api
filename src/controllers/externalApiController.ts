import { Request, Response, NextFunction } from 'express';
import { externalApiService } from '../services';
import { ApiError } from '../middlewares/errorHandlers';

/**
 * Get all users from external API
 * @route GET /users
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await externalApiService.fetchUsers();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a user by ID from external API
 * @route GET /users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid user ID, must be a number');
    }
    
    const user = await externalApiService.fetchUserById(id);
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};