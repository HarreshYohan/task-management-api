/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

/**
 * Task interface - represents a task in the application
 */
export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}
/**
 * Task creation DTO - data required to create a new task
 */
export interface ICreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  fileUrl?: string;
}

/**
 * Task update DTO - data that can be updated for a task
 */
export interface IUpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  fileUrl?: string;
}

/**
 * User interface for external API integration
 */
export interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone?: string;
  website?: string;
  company?: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

/**
 * User Cache entry for DynamoDB TTL implementation
 */
export interface IUserCacheEntry {
  id: string;
  data: any;
  expiresAt: number; // Unix timestamp for TTL
}