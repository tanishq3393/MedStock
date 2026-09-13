const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const environment = require('./config/environment');
const { checkConnection } = require('./config/supabase');
const abdmConfig = require('./config/abdm');
const logger = require('./utils/logger');

const app = express();

// 1. Security & Core Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    environment.frontendUrl,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
});

// 2. Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const supabaseStatus = await checkConnection();

  return res.status(200).json({
    status: 'healthy',
    product: 'MedEx',
    service: 'MedEx Healthcare Logistics & Inter-Hospital Exchange Backend',
    uptime: Math.round(process.uptime() * 100) / 100,
    timestamp: new Date().toISOString(),
    supabase: {
      configured: supabaseStatus.configured,
      initialized: supabaseStatus.initialized,
      connected: supabaseStatus.connected,
      message: supabaseStatus.message,
    },
    abdm: {
      configured: abdmConfig.isConfigured,
      status: abdmConfig.isConfigured ? 'configured' : 'placeholder_ready',
    },
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    product: 'MedEx',
    message: 'MedEx Inter-Hospital Healthcare Logistics REST API is active.',
    healthEndpoint: '/api/health',
    version: '1.0.0',
  });
});

// 3. Mount MedEx REST API routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// 4. 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
    timestamp: new Date().toISOString(),
  });
});

// 4. Centralized Error Handler
app.use((err, req, res, next) => {
  logger.error(`Error on ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the MedEx server.';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.missingFields && { missingFields: err.missingFields }),
      ...(err.hospital && { hospital: err.hospital }),
      ...(err.rejectionReason && { rejectionReason: err.rejectionReason }),
    },
    timestamp: new Date().toISOString(),
  });
});

// 5. Server Startup
if (require.main === module) {
  const server = app.listen(environment.port, () => {
    logger.info('=======================================================');
    logger.info(`  MedEx Backend running on http://localhost:${environment.port}`);
    logger.info(`  Health Check: http://localhost:${environment.port}/api/health`);
    logger.info(`  Environment: ${environment.nodeEnv}`);
    logger.info(`  Supabase: ${environment.supabase.isConfigured ? 'CONFIGURED' : 'PENDING'}`);
    logger.info(`  ABDM Placeholder: READY`);
    logger.info('=======================================================');
  });

  const handleShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down MedEx server gracefully...`);
    server.close(() => {
      logger.info('MedEx server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

module.exports = app;
