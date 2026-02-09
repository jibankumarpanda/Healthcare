import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import net from 'net';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import diseaseMedicineRoutes from './routes/diseaseMedicineRoutes.js';
import { startAqiScheduler } from './jobs/aqiScheduler.js';

// Load environment variables from the repository root .env
// (when running `cd backend && npm run dev` the working directory is backend/)
dotenv.config({ path: '../../.env' });

// Set default weather API key if not in .env
if (!process.env.WEATHER_API_KEY) {
  process.env.WEATHER_API_KEY = 'd3f36f311e87f456b2c011ac4475c83a';
}

// Set default Air Visual API key (use from env if provided)
if (!process.env.AIR_VISUAL_API_KEY) {
  process.env.AIR_VISUAL_API_KEY = 'ed2e8938-381b-41b5-8afb-23c2fc5fa19c';
}

// Initialize Express app
const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Start AQI scheduler (updates every 5 minutes)
startAqiScheduler();

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Healthcare Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/disease-medicine', diseaseMedicineRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the maximum limit',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Start server on available port
async function startServer() {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    const server = app.listen(availablePort, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🏥 Healthcare Backend Server                        ║
║                                                        ║
║   🚀 Server running on port ${availablePort}                      ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   📡 API Base URL: http://localhost:${availablePort}              ║
║   🌤️ Weather API: ${process.env.WEATHER_API_KEY ? '✅ Configured' : '❌ Not configured'}                    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Catch synchronous exceptions we didn't expect
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
