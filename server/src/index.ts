import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth';
import characterRoutes from './routes/character';
import gameRoutes from './routes/game';
import analyticsRoutes from './routes/analytics';
import dailyQuestRoutes from './routes/dailyQuest';
import contentManagementRoutes from './routes/contentManagement';
import contentAuthoringRoutes from './routes/contentAuthoring';
import educatorDashboardRoutes from './routes/educatorDashboard';
import monitoringRoutes from './routes/monitoring';
import healthRoutes from './routes/health';
import cssMonitoringRoutes from './routes/css-monitoring';
import testRoutes from './routes/testRoutes';

// Import monitoring and error tracking
import { performanceMonitoring, memoryMonitoring } from './middleware/monitoring';
import { 
  errorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException 
} from './middleware/errorTracking';
import { backupService } from './services/backupService';

// Load environment variables
dotenv.config();

// Set up global error handlers
handleUnhandledRejection();
handleUncaughtException();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs ibia
});
app.use('/api', limiter);

// Monitoring middleware
app.use(performanceMonitoring);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ChemQuest API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quests', dailyQuestRoutes);
app.use('/api/content-management', contentManagementRoutes);
app.use('/api/content-authoring', contentAuthoringRoutes);
app.use('/api/educator-dashboard', educatorDashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/css-monitoring', cssMonitoringRoutes);

// API routes placeholder for other endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    
    // Connect to Redis
    await connectRedis();
    
    // Start memory monitoring
    memoryMonitoring();
    
    // Schedule automatic backups
    backupService.scheduleBackups();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Monitoring: http://localhost:${PORT}/api/monitoring/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/api/monitoring/metrics`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();