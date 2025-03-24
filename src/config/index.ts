import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Server configuration
const SERVER = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// AWS configuration
const AWS = {
  REGION: process.env.AWS_REGION || 'us-east-1',
  ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

// DynamoDB configuration
const DYNAMODB = {
  TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'tasks',
};

// S3 configuration
const S3 = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'task-attachments',
};

// External API configuration
const EXTERNAL_API = {
  URL: process.env.EXTERNAL_API_URL || 'https://jsonplaceholder.typicode.com',
  CACHE_TTL: parseInt(process.env.API_CACHE_TTL || '300', 10), // 5 minutes in seconds
};

// Validate required environment variables
const validateEnv = (): void => {
  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DYNAMODB_TABLE_NAME',
    'S3_BUCKET_NAME',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
};

export default {
  SERVER,
  AWS,
  DYNAMODB,
  S3,
  EXTERNAL_API,
  validateEnv,
};