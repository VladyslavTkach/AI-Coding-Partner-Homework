import express, { Application } from 'express';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Also mount routes at root for convenience
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
