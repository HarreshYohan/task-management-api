import request from 'supertest';
import app from '../../src/server';
import { ITask, TaskStatus } from '../../src/models/taskModel';
import { dynamoService, s3Service } from '../../src/services';
import { v4 as uuidv4 } from 'uuid';

// Mock the services
jest.mock('../../src/services/dynamoService');
jest.mock('../../src/services/s3Service');

describe('Task API Endpoints', () => {
  let mockTask: ITask;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock task data
    mockTask = {
      id: uuidv4(),
      title: 'Test Task',
      description: 'This is a test task',
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Set up mock implementations
    (dynamoService.createTask as jest.Mock).mockResolvedValue(mockTask);
    (dynamoService.getTasks as jest.Mock).mockResolvedValue([mockTask]);
    (dynamoService.getTaskById as jest.Mock).mockResolvedValue(mockTask);
    (dynamoService.updateTask as jest.Mock).mockResolvedValue({
      ...mockTask,
      title: 'Updated Task',
      updatedAt: new Date().toISOString()
    });
    (dynamoService.deleteTask as jest.Mock).mockResolvedValue(true);
    
    (s3Service.generateUploadUrl as jest.Mock).mockResolvedValue({
      uploadUrl: 'https://fake-upload-url.com',
      fileKey: 'fake-file-key'
    });
    (s3Service.getPublicFileUrl as jest.Mock).mockReturnValue('https://fake-s3-url.com/fake-file-key');
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'This is a test task'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task).toHaveProperty('id');
      expect(res.body.data.task.title).toBe('Test Task');
      expect(dynamoService.createTask).toHaveBeenCalledTimes(1);
    });
    
    it('should create a task with file upload request', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task with Upload',
          description: 'This task requests a file upload',
          requestFileUpload: true,
          fileType: 'image/jpeg'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data).toHaveProperty('fileKey');
      expect(s3Service.generateUploadUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks', async () => {
      const res = await request(app).get('/api/tasks');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(dynamoService.getTasks).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a task by ID', async () => {
      const res = await request(app).get(`/api/tasks/${mockTask.id}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockTask.id);
      expect(dynamoService.getTaskById).toHaveBeenCalledWith(mockTask.id);
    });
    
    it('should return 404 if task not found', async () => {
      (dynamoService.getTaskById as jest.Mock).mockResolvedValue(null);
      
      const res = await request(app).get('/api/tasks/non-existent-id');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${mockTask.id}`)
        .send({
          title: 'Updated Task'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Updated Task');
      expect(dynamoService.updateTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app).delete(`/api/tasks/${mockTask.id}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(dynamoService.deleteTask).toHaveBeenCalledWith(mockTask.id);
    });
  });

  describe('POST /api/tasks/upload', () => {
    it('should generate a pre-signed URL for file upload', async () => {
      const res = await request(app)
        .post('/api/tasks/upload')
        .send({
          fileType: 'image/jpeg'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data).toHaveProperty('fileKey');
      expect(res.body.data).toHaveProperty('fileUrl');
      expect(s3Service.generateUploadUrl).toHaveBeenCalledTimes(1);
    });
    
    it('should return 400 if fileType is missing', async () => {
      const res = await request(app)
        .post('/api/tasks/upload')
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});