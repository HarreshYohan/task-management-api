import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../src/middlewares/errorHandler';
import { ITask, TaskStatus } from '../../src/models/taskModel';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/util-dynamodb');
jest.mock('uuid');

// Import the service functions after mocking
import { 
  createTask, 
  getTaskById, 
  getTasks, 
  updateTask, 
  deleteTask 
} from '../../src/services/dynamoService';

// Mock task data
const mockTask: ITask = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Task',
  description: 'This is a test task',
  status: TaskStatus.PENDING,
  fileUrl: 'https://task-attachments-task-management.s3.ap-south-1.amazonaws.com/test-file.jpg',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

// Mock task list for getTasks
const mockTaskList: ITask[] = [
  mockTask,
  {
    ...mockTask,
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Another Task',
    fileUrl: undefined // Test a task without file
  },
];

describe('DynamoDB Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock UUID generation
    (uuidv4 as jest.Mock).mockReturnValue(mockTask.id);
    
    // Mock marshall and unmarshall
    (marshall as jest.Mock).mockImplementation((data) => data);
    (unmarshall as jest.Mock).mockImplementation((data) => data);
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({});
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await createTask({
        title: mockTask.title,
        description: mockTask.description,
      });

      // Verify that the correct command was sent to DynamoDB
      expect(sendMock).toHaveBeenCalledWith(expect.any(PutItemCommand));
      
      // Verify the task was created with the correct properties
      expect(result).toHaveProperty('id', mockTask.id);
      expect(result).toHaveProperty('title', mockTask.title);
      expect(result).toHaveProperty('description', mockTask.description);
      expect(result).toHaveProperty('status', TaskStatus.PENDING);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should create a task with file URL', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({});
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await createTask({
        title: mockTask.title,
        description: mockTask.description,
        fileUrl: 'https://task-attachments-task-management.s3.ap-south-1.amazonaws.com/test-file.jpg'
      });

      // Verify the task was created with file URL
      expect(result).toHaveProperty('fileUrl');
      expect(result.fileUrl).toBe('https://task-attachments-task-management.s3.ap-south-1.amazonaws.com/test-file.jpg');
    });

    it('should throw ApiError when DynamoDB operation fails', async () => {
      // Mock DynamoDB client send method to throw an error
      const sendMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      // Verify that the error is properly caught and converted to ApiError
      await expect(createTask({
        title: mockTask.title,
        description: mockTask.description,
      })).rejects.toThrow(ApiError);
      
      // Verify the error status code and message
      await expect(createTask({
        title: mockTask.title,
        description: mockTask.description,
      })).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('Failed to create task')
      });
    });
  });

  describe('getTaskById', () => {
    it('should get a task by ID successfully', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({ Item: mockTask });
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await getTaskById(mockTask.id);

      // Verify that the correct command was sent to DynamoDB
      expect(sendMock).toHaveBeenCalledWith(expect.any(GetItemCommand));
      
      // Verify that the key parameter was correctly constructed
      expect(marshall).toHaveBeenCalledWith({ id: mockTask.id });
      
      // Verify the returned task matches the mock
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      // Mock DynamoDB client send method to return no item
      const sendMock = jest.fn().mockResolvedValue({ Item: null });
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await getTaskById('nonexistent-id');

      // Verify that the correct command was sent to DynamoDB
      expect(sendMock).toHaveBeenCalledWith(expect.any(GetItemCommand));
      
      // Verify null is returned when no item is found
      expect(result).toBeNull();
    });

    it('should throw ApiError when DynamoDB operation fails', async () => {
      // Mock DynamoDB client send method to throw an error
      const sendMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      // Verify that the error is properly caught and converted to ApiError
      await expect(getTaskById(mockTask.id)).rejects.toThrow(ApiError);
      
      // Verify the error status code and message
      await expect(getTaskById(mockTask.id)).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('Failed to fetch task')
      });
    });
  });

  describe('getTasks', () => {
    it('should get all tasks successfully', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({ Items: mockTaskList });
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await getTasks();

      // Verify that the correct command was sent to DynamoDB
      expect(sendMock).toHaveBeenCalledWith(expect.any(ScanCommand));
      
      // Verify that the tasks are returned correctly
      expect(result).toEqual(mockTaskList);
      expect(result.length).toBe(2);
      // Verify that one task has fileUrl and one doesn't
      expect(result[0].fileUrl).toBeDefined();
      expect(result[1].fileUrl).toBeUndefined();
    });

    it('should return empty array when no tasks exist', async () => {
      // Mock DynamoDB client send method to return no items
      const sendMock = jest.fn().mockResolvedValue({ Items: [] });
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await getTasks();

      // Verify that the correct command was sent to DynamoDB
      expect(sendMock).toHaveBeenCalledWith(expect.any(ScanCommand));
      
      // Verify that an empty array is returned
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should throw ApiError when DynamoDB operation fails', async () => {
      // Mock DynamoDB client send method to throw an error
      const sendMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      // Verify that the error is properly caught and converted to ApiError
      await expect(getTasks()).rejects.toThrow(ApiError);
      
      // Verify the error status code and message
      await expect(getTasks()).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('Failed to fetch tasks')
      });
    });
  });

  describe('updateTask', () => {
    beforeEach(() => {
      // Mock getTaskById to simulate finding the task
      jest.spyOn(require('../../src/services/dynamoService'), 'getTaskById')
        .mockResolvedValue(mockTask);
    });

    it('should update a task successfully', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({ 
        Attributes: {
          ...mockTask,
          title: 'Updated Title',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      });
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const updateData = { title: 'Updated Title' };
      const result = await updateTask(mockTask.id, updateData);

      // Verify that the correct command was sent to DynamoDB
     // expect(sendMock).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
      
      // Verify the task was updated with the correct properties
      expect(result).toHaveProperty('title', 'Updated Title');
      expect(result).toHaveProperty('id', mockTask.id);
      expect(result).toHaveProperty('updatedAt');
    });

    it('should update a task with file URL', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({ 
        Attributes: {
          ...mockTask,
          fileUrl: 'https://task-attachments-task-management.s3.ap-south-1.amazonaws.com/new-file.jpg',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      });
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const updateData = { 
        fileUrl: 'https://task-attachments-task-management.s3.ap-south-1.amazonaws.com/new-file.jpg' 
      };
      
      const result = await updateTask(mockTask.id, updateData);

      // Verify the task was updated with file URL
      expect(result).toHaveProperty('fileUrl');
      //expect(result.fileUrl).toBe('https://task-attachments-task-management.s3.ap-south-1.amazonaws.com/new-file.jpg');
    });

    it('should return null when task not found', async () => {
      // Override the mock to simulate task not found
      jest.spyOn(require('../../src/services/dynamoService'), 'getTaskById')
        .mockResolvedValueOnce(null);

      const updateData = { title: 'Updated Title' };
      const result = await updateTask('nonexistent-id', updateData);

      // Verify null is returned when no task is found
      expect(result).toBeNull();
    });

    it('should throw ApiError when DynamoDB operation fails', async () => {
      // Mock DynamoDB client send method to throw an error
      const sendMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const updateData = { title: 'Updated Title' };
      
      // Verify that the error is properly caught and converted to ApiError
      await expect(updateTask(mockTask.id, updateData)).rejects.toThrow(ApiError);
      
      // Verify the error status code and message
      await expect(updateTask(mockTask.id, updateData)).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('Failed to update task')
      });
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      // Mock getTaskById to simulate finding the task
      jest.spyOn(require('../../src/services/dynamoService'), 'getTaskById')
        .mockResolvedValue(mockTask);
    });

    it('should delete a task successfully', async () => {
      // Mock DynamoDB client send method
      const sendMock = jest.fn().mockResolvedValue({});
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;

      const result = await deleteTask(mockTask.id);

      // Verify that the correct command was sent to DynamoDB
      expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
      
      // Verify true is returned when task is deleted
      expect(result).toBe(true);
    });

    it('should return false when task not found', async () => {
      // Override the mock to simulate task not found
      jest.spyOn(require('../../src/services/dynamoService'), 'getTaskById')
        .mockResolvedValueOnce(null);

      const result = await deleteTask('nonexistent-id');

      // Verify false is returned when no task is found
      expect(result).toBe(false);
    });

    it('should throw ApiError when DynamoDB operation fails', async () => {
      // Mock DynamoDB client send method to throw an error
      const sendMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
      (DynamoDBClient.prototype.send as jest.Mock) = sendMock;
      
      // Verify that the error is properly caught and converted to ApiError
      await expect(deleteTask(mockTask.id)).rejects.toThrow(ApiError);
      
      // Verify the error status code and message
      await expect(deleteTask(mockTask.id)).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('Failed to delete task')
      });
    });
  });
});