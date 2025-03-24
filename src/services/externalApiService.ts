import fetch from 'node-fetch';
import config from '../config';
import { IUser } from '../models/taskModel';
import { ApiError } from '../middlewares/errorHandlers';
import { storeCache, getCache } from './dynamoService';

const API_URL = config.EXTERNAL_API.URL;
const CACHE_TTL = config.EXTERNAL_API.CACHE_TTL;

/**
 * Fetch users from the external API
 * @returns Array of users
 */
export const fetchUsers = async (): Promise<IUser[]> => {
  try {
    // Check cache first
    const cachedUsers = await getCache<IUser[]>('users');
    
    if (cachedUsers) {
      console.log('Returning users from cache');
      return cachedUsers;
    }
    
    // If not in cache, fetch from external API
    console.log('Fetching users from external API');
    const response = await fetch(`${API_URL}/users`);
    
    if (!response.ok) {
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }
    
    const users = await response.json() as IUser[];
    
    // Store in cache
    await storeCache('users', users, CACHE_TTL);
    
    return users;
  } catch (error) {
    console.error('Error fetching users from external API:', error);
    throw new ApiError(500, 'Failed to fetch users from external service');
  }
};

/**
 * Fetch a user by ID from the external API
 * @param id User ID
 * @returns User if found
 */
export const fetchUserById = async (id: number): Promise<IUser> => {
  try {
    // Check cache first
    const cachedUsers = await getCache<IUser[]>('users');
    
    if (cachedUsers) {
      const cachedUser = cachedUsers.find(user => user.id === id);
      if (cachedUser) {
        console.log(`Returning user ${id} from cache`);
        return cachedUser;
      }
    }
    
    // If not in cache, fetch from external API
    console.log(`Fetching user ${id} from external API`);
    const response = await fetch(`${API_URL}/users/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(404, `User with ID ${id} not found`);
      }
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as IUser;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Error fetching user with ID ${id} from external API:`, error);
    throw new ApiError(500, 'Failed to fetch user from external service');
  }
};