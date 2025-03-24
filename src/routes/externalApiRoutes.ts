import { Router } from 'express';
import { externalApiController } from '../controllers';

const router = Router();

/**
 * @route   GET /users
 * @desc    Get all users from external API
 * @access  Public
 */
router.get('/', externalApiController.getUsers);

/**
 * @route   GET /users/:id
 * @desc    Get a user by ID from external API
 * @access  Public
 */
router.get('/:id', externalApiController.getUserById);

export default router;