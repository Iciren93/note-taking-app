require('dotenv').config();
const app = require('./app');
const dbInstance = require('./config/database');
const redisClient = require('./config/redis');

const PORT = process.env.PORT || 3000;

/**
 * Initialize and start the server
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting Note Taking API...');

    // Test database connection
    const dbConnected = await dbInstance.testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database models
    // Use { force: true } to drop and recreate tables (development only)
    // Use { alter: true } to update existing tables
    await dbInstance.syncModels({ 
      alter: process.env.NODE_ENV === 'development' 
    });

    // Connect to Redis
    await redisClient.connect();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          // Close database connection
          await dbInstance.getConnection().close();
          console.log('✅ Database connection closed');
          
          // Close Redis connection
          await redisClient.getClient().quit();
          console.log('✅ Redis connection closed');
          
          console.log('👋 Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

