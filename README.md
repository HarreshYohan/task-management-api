# Task Management API

A RESTful API for managing tasks with AWS integration, built with Node.js, TypeScript, and AWS services (DynamoDB and S3).

## Features

- CRUD operations for tasks
- File attachment capabilities using AWS S3
- Data persistence with DynamoDB
- External API integration with caching
- Input validation
- Error handling
- Unit and integration tests

## Tech Stack

- Node.js (v22 LTS)
- TypeScript
- Express.js
- AWS SDK (S3, DynamoDB)
- Jest (Testing)
- Joi (Validation)

## Project Structure

```
task-management-api/
├── src/
│   ├── config/         # Environment and configuration settings
│   ├── controllers/    # Request handling logic
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Data models and schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic and external service integrations
│   ├── utils/          # Utility functions
│   └── server.ts       # Application entry point
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── .env                # Environment variables (not in repo)
├── .env.example        # Example environment variables
├── package.json        # Project dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Prerequisites

- Node.js (v22 LTS)
- AWS Account with access to DynamoDB and S3
- AWS CLI configured locally

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your AWS credentials and other settings.

4. Set up AWS resources:
   
   Create DynamoDB table:
   ```bash
   aws dynamodb create-table \
       --table-name tasks \
       --attribute-definitions AttributeName=id,AttributeType=S \
       --key-schema AttributeName=id,KeyType=HASH \
       --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
       --region us-east-1
   ```

   Create S3 bucket:
   ```bash
   aws s3api create-bucket \
       --bucket task-attachments \
       --region us-east-1
   ```

5. Build and run the application:
   ```bash
   npm run build
   npm start
   ```

   For development with hot reloading:
   ```bash
   npm run dev
   ```

## API Endpoints

- **POST /tasks** - Create a new task
- **GET /tasks** - List all tasks
- **GET /tasks/:id** - Get a task by ID
- **PUT /tasks/:id** - Update a task
- **DELETE /tasks/:id** - Delete a task
- **GET /users** - Fetch users from external API (with caching)

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Deployment Options

This application can be deployed using several AWS services:

1. **AWS Lambda with API Gateway** (Serverless)
2. **Elastic Beanstalk**
3. **ECS with Fargate**
4. **EKS**

Detailed deployment instructions for each option are provided in the [Deployment Guide](./DEPLOYMENT.md).

## License

ISC