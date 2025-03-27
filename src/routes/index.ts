import { Router } from 'express';
import taskRoutes from './taskRoutes';
import externalApiRoutes from './externalApiRoutes';
import { notFoundHandler } from '../middlewares';

const router = Router();

// API routes
router.use('/tasks', taskRoutes);
router.use('/users', externalApiRoutes);

// 404 handler for undefined routes
router.use(notFoundHandler);

export default router;
