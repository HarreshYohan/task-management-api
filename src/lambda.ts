import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverless from 'serverless-http';
import app from './server';

// Create a serverless handler from your Express app
const serverlessHandler = serverless(app);

// Export the Lambda handler function
export const handler = async (
  event: APIGatewayProxyEvent, 
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));
  // Use type assertion to handle the return type
  return await serverlessHandler(event, context) as Promise<APIGatewayProxyResult>;
};