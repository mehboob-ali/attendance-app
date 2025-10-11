import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import geofenceRoutes from './routes/geofences.routes.js';
import punchRoutes from './routes/punch.routes.js';
import reportRoutes from './routes/report.routes.js';
import exceptionRoutes from './routes/exception.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import errorHandler from './middleware/error.js';

dotenv.config();
connectDB();

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300 
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/punch', punchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/employees', employeeRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

export default app;
