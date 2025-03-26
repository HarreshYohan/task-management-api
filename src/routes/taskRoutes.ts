import { Router } from 'express';
import { taskController } from '../controllers';
import { validate, taskSchema, taskUpdateSchema } from '../middlewares';

const router = Router();

/**
 * @route   POST /tasks
 * @desc    Create a new task
 * @access  Public
 */
router.post('/', validate(taskSchema), taskController.createTask);

/**
 * @route   GET /tasks
 * @desc    Get all tasks
 * @access  Public
 */
router.get('/', taskController.getTasks);

/**
 * @route   GET /tasks/:id
 * @desc    Get a task by ID
 * @access  Public
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   PUT /tasks/:id
 * @desc    Update a task
 * @access  Public
 */
router.put('/:id', validate(taskUpdateSchema), taskController.updateTask);

/**
 * @route   DELETE /tasks/:id
 * @desc    Delete a task
 * @access  Public
 */
router.delete('/:id', taskController.deleteTask);

/**
 * @route   POST /upload
 * @desc    upload a file
 * @access  Public
 */
router.post('/upload', taskController.generateFileUploadUrl);

export default router;