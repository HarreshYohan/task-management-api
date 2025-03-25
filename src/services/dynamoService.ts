import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  AttributeValue
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { ITask, ICreateTaskDto, IUpdateTaskDto, IUserCacheEntry, TaskStatus } from '../models/taskModel';
import { ApiError } from '../middlewares/errorHandlers';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: config.AWS.REGION,
  credentials: {
    accessKeyId: config.AWS.ACCESS_KEY_ID!,
    secretAccessKey: config.AWS.SECRET_ACCESS_KEY!,
  }
});

const tableName = config.DYNAMODB.TABLE_NAME;

/**
 * Create a new task in DynamoDB
 * @param taskData Task data for creation
 * @returns The created task
 */
export const createTask = async (taskData: ICreateTaskDto): Promise<ITask> => {
  try {
    const now = new Date().toISOString();
    const task: ITask = {
      id: uuidv4(),
      ...taskData,
      status: taskData.status || TaskStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    const params = {
      TableName: tableName,
      Item: marshall(task),
    };

    await dynamoClient.send(new PutItemCommand(params));
    return task;
  } catch (error) {
    console.error('Error creating task in DynamoDB:', error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to create task in database');
  }
};

/**
 * Get all tasks from DynamoDB
 * @returns Array of tasks
 */
export const getTasks = async (): Promise<ITask[]> => {
  try {
    const params = {
      TableName: tableName,
    };

    const { Items } = await dynamoClient.send(new ScanCommand(params));
    
    return Items ? Items.map(item => unmarshall(item) as ITask) : [];
  } catch (error) {
    console.error('Error fetching tasks from DynamoDB:', error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to fetch tasks from database');
  }
};

/**
 * Get a task by ID from DynamoDB
 * @param id Task ID
 * @returns The task if found, null otherwise
 */
export const getTaskById = async (id: string): Promise<ITask | null> => {
  try {
    const params = {
      TableName: tableName,
      Key: marshall({ id }),
    };

    const { Item } = await dynamoClient.send(new GetItemCommand(params));
    
    if (!Item) {
      return null;
    }

    return unmarshall(Item) as ITask;
  } catch (error) {
    console.error(`Error fetching task with ID ${id} from DynamoDB:`, error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to fetch task from database');
  }
};

export const updateTask = async (id: string, updateData: IUpdateTaskDto): Promise<ITask | null> => {
  try {
    // First, check if the task exists
    const existingTask = await getTaskById(id);
    
    if (!existingTask) {
      return null;
    }

    // Create a new task object with updated fields
    const updatedTask = {
      ...existingTask,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Put the entire updated item
    const params = {
      TableName: tableName,
      Item: marshall(updatedTask)
    };

    await dynamoClient.send(new PutItemCommand(params));
    return updatedTask;
  } catch (error) {
    console.error(`Error updating task with ID ${id} in DynamoDB:`, error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to update task in database');
  }
};

/**
 * Delete a task from DynamoDB
 * @param id Task ID
 * @returns True if deleted, false if not found
 */
export const deleteTask = async (id: string): Promise<boolean> => {
  try {
    // First, check if the task exists
    const existingTask = await getTaskById(id);
    
    if (!existingTask) {
      return false;
    }

    const params = {
      TableName: tableName,
      Key: marshall({ id }),
    };

    await dynamoClient.send(new DeleteItemCommand(params));
    return true;
  } catch (error) {
    console.error(`Error deleting task with ID ${id} from DynamoDB:`, error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to delete task from database');
  }
};

/**
 * Store external API cache in DynamoDB with TTL
 * @param cacheKey Unique identifier for the cached data
 * @param data Data to cache
 * @param ttlInSeconds Time-to-live in seconds
 */
export const storeCache = async (
  cacheKey: string,
  data: any,
  ttlInSeconds: number
): Promise<void> => {
  try {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const expiresAt = now + ttlInSeconds;

    const cacheItem: IUserCacheEntry = {
      id: `cache:${cacheKey}`,
      data,
      expiresAt,
    };

    const params = {
      TableName: tableName,
      Item: marshall(cacheItem),
    };

    await dynamoClient.send(new PutItemCommand(params));
  } catch (error) {
    console.error(`Error storing cache with key ${cacheKey} in DynamoDB:`, error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to store cache in database');
  }
};

/**
 * Get cached data from DynamoDB
 * @param cacheKey Unique identifier for the cached data
 * @returns Cached data if found and not expired, null otherwise
 */
export const getCache = async <T>(cacheKey: string): Promise<T | null> => {
  try {
    const params = {
      TableName: tableName,
      Key: marshall({ id: `cache:${cacheKey}` }),
    };

    const { Item } = await dynamoClient.send(new GetItemCommand(params));
    
    if (!Item) {
      return null;
    }

    const cacheEntry = unmarshall(Item) as IUserCacheEntry;
    const now = Math.floor(Date.now() / 1000);
    
    // Check if cache is expired
    if (cacheEntry.expiresAt < now) {
      return null;
    }

    return cacheEntry.data as T;
  } catch (error) {
    console.error(`Error fetching cache with key ${cacheKey} from DynamoDB:`, error instanceof Error ? error.message : error);
    throw new ApiError(500, 'Failed to fetch cache from database');
  }
};