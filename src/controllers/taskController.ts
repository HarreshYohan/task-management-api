import { Request, Response, NextFunction } from 'express';
import { dynamoService, s3Service } from '../services';
import { ApiError } from '../middlewares/errorHandler';
import { ICreateTaskDto, IUpdateTaskDto } from '../models/taskModel';

/**
 * Create a new task
 * @route POST /tasks
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskData: ICreateTaskDto = req.body;

    // If file upload is requested, generate a pre-signed URL
    let fileUploadInfo;
    if (req.body.requestFileUpload && req.body.fileType) {
      fileUploadInfo = await s3Service.generateUploadUrl(req.body.fileType);

      taskData.fileUrl = s3Service.getPublicFileUrl(fileUploadInfo.fileKey);
    }

    const task = await dynamoService.createTask(taskData);

    // Return the task data along with the upload URL if applicable
    res.status(201).json({
      success: true,
      data: {
        task,
        ...(fileUploadInfo && {
          uploadUrl: fileUploadInfo.uploadUrl,
          fileKey: fileUploadInfo.fileKey,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tasks
 * @route GET /tasks
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await dynamoService.getTasks();

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single task by ID
 * @route GET /tasks/:id
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const task = await dynamoService.getTaskById(id);

    if (!task) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a task
 * @route PUT /tasks/:id
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData: IUpdateTaskDto = req.body;

    // If file upload is requested, generate a pre-signed URL
    let fileUploadInfo;
    if (req.body.requestFileUpload && req.body.fileType) {
      fileUploadInfo = await s3Service.generateUploadUrl(req.body.fileType);

      // Store the file URL in the update data
      updateData.fileUrl = s3Service.getPublicFileUrl(fileUploadInfo.fileKey);
    }

    const task = await dynamoService.updateTask(id, updateData);

    if (!task) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: {
        task,
        ...(fileUploadInfo && {
          uploadUrl: fileUploadInfo.uploadUrl,
          fileKey: fileUploadInfo.fileKey,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 * @route DELETE /tasks/:id
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // First, get the task to check if it has an associated file
    const task = await dynamoService.getTaskById(id);

    if (!task) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    // If the task has a file, delete it from S3
    if (task.fileUrl) {
      try {
        // Extract file key from the URL
        const fileKey = task.fileUrl.split('/').pop();
        if (fileKey) {
          await s3Service.deleteFile(fileKey);
        }
      } catch (error) {
        console.error(`Failed to delete file for task ${id}:`, error);
        // Continue with task deletion even if file deletion fails
      }
    }

    // Delete the task from DynamoDB
    await dynamoService.deleteTask(id);

    res.status(200).json({
      success: true,
      data: {},
      message: `Task with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a pre-signed URL for file upload
 * @route POST /tasks/upload
 */
export const generateFileUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileType } = req.body;

    if (!fileType) {
      throw new ApiError(400, 'File type is required');
    }

    const { uploadUrl, fileKey } = await s3Service.generateUploadUrl(fileType);

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        fileUrl: s3Service.getPublicFileUrl(fileKey),
      },
    });
  } catch (error) {
    next(error);
  }
};
