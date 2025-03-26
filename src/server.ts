import express from 'express';
import cors from 'cors';
import config from './config';
import routes from './routes';
import { errorHandler } from './middlewares';

// Skip environment validation in test environment
if (process.env.NODE_ENV !== 'test') {
  try {
    config.validateEnv();
  } catch (error) {
    // Type check the error or use type assertion to handle the unknown type
    if (error instanceof Error) {
      console.error('Environment validation failed:', error.message);
    } else {
      console.error('Environment validation failed:', error);
    }
    process.exit(1);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// API routes
app.use('/dev', routes);

// Error handling middleware
app.use(errorHandler);

// Start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.SERVER.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.SERVER.NODE_ENV} mode`);
  });
}

export default app;