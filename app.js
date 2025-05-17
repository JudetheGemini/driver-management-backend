import express from 'express';
import morgan from 'morgan';    
import cors from 'cors';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/error.controller.js';
import driverRouter from './routes/driver.routes.js';
import vehicleRouter from './routes/vehicle.routes.js';
import inspectionRouter from './routes/inspection.routes.js'
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/drivers', driverRouter);
app.use('/api/v1/vehicles', vehicleRouter);
app.use('/api/v1/inspections', inspectionRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

export default app;