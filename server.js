require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDatabase = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Connect to database on startup (for Render/traditional hosting)
if (process.env.MONGODB_URI) {
  connectDatabase().catch(err => {
    console.error('Initial database connection attempt failed:', err.message);
    console.log('Database will be connected on first request');
  });
} else {
  console.warn('⚠️ MONGODB_URI not set - Database features will be unavailable');
  console.warn('Please set MONGODB_URI in your environment variables');
}

const app = express();

// Trust proxy - Required for Render and other hosting platforms with reverse proxies
// This allows express-rate-limit to correctly identify users behind the proxy
app.set('trust proxy', 1);

// CORS - Must be before other middleware
// Handle CORS_ORIGINS: if not set, empty, or '*', allow all origins
const corsOrigins = process.env.CORS_ORIGINS?.trim();
const corsOptions = {
  origin: (!corsOrigins || corsOrigins === '*') ? '*' : corsOrigins.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// Log CORS configuration (without sensitive data)
console.log(`🌐 CORS configured: ${corsOptions.origin === '*' ? 'All origins allowed' : `Allowed origins: ${corsOptions.origin.join(', ')}`}`);

// Security middleware (configure helmet to work with CORS and admin panel)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "'unsafe-hashes'",
        "https://cdn.tailwindcss.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.tailwindcss.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes with error handling
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/mezmurs', require('./routes/mezmurs'));
  app.use('/api/wallpapers', require('./routes/wallpapers'));
  app.use('/api/ringtones', require('./routes/ringtones'));
  app.use('/api/statistics', require('./routes/statistics'));
} catch (error) {
  console.error('Error loading routes:', error.message);
}

// Serve static files from public directory (admin panels)
app.use(express.static('public', {
  extensions: ['html'],
  index: false // Don't serve index.html by default
}));

// Handle favicon requests (to prevent 404s)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve admin panel routes
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: __dirname + '/public' });
});

app.get('/create-admin', (req, res) => {
  res.sendFile('create_admin.html', { root: __dirname + '/public' });
});

// Health check (always works, even without DB)
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  let dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let dbError = null;

  // If not connected, try to connect
  if (dbStatus === 'disconnected' && process.env.MONGODB_URI) {
    try {
      await connectDatabase();
      // Wait a moment for connection
      await new Promise(resolve => setTimeout(resolve, 500));
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      dbError = error.message;
      console.error('Health check connection attempt failed:', error.message);
    }
  } else if (!process.env.MONGODB_URI) {
    dbError = 'MONGODB_URI environment variable not set';
  }
  
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: dbStatus,
    ...(dbError && { databaseError: dbError }),
    mongoUriSet: !!process.env.MONGODB_URI,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint (for troubleshooting)
app.get('/debug', async (req, res) => {
  const mongoose = require('mongoose');
  const mongoURI = process.env.MONGODB_URI;
  
  const debugInfo = {
    mongoUriSet: !!mongoURI,
    mongoUriPreview: mongoURI ? mongoURI.replace(/:[^:@]+@/, ':****@') : 'NOT SET',
    connectionState: mongoose.connection.readyState,
    connectionStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || 'N/A',
    name: mongoose.connection.name || 'N/A',
  };

  // Try to connect if not connected
  if (mongoURI && mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
      await new Promise(resolve => setTimeout(resolve, 1000));
      debugInfo.connectionState = mongoose.connection.readyState;
      debugInfo.connectionStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
      debugInfo.host = mongoose.connection.host || 'N/A';
      debugInfo.name = mongoose.connection.name || 'N/A';
    } catch (error) {
      debugInfo.connectionError = error.message;
      debugInfo.connectionErrorStack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    }
  }

  res.json(debugInfo);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Tselot Tunes API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      mezmurs: '/api/mezmurs',
      wallpapers: '/api/wallpapers',
      ringtones: '/api/ringtones',
      statistics: '/api/statistics'
    }
  });
});

// Handle 404 (must be before error handler)
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server (for Render, Railway, or local development)
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🎵 Tselot Tunes Backend API Server                 ║
  ║                                                       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
  ║   Server running on port ${PORT}                       ║
  ║   API URL: http://localhost:${PORT}                    ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;

