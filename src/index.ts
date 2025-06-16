#!/usr/bin/env node

import { logger } from './utils/logger.js';
import { validateEnvironmentVariables } from './utils/validators.js';
import CargoPackageReadmeMcpServer from './server.js';

// Validate environment variables on startup
try {
  validateEnvironmentVariables();
} catch (error) {
  logger.error('Environment validation failed', { error });
  process.exit(1);
}

// Create and start the server
const server = new CargoPackageReadmeMcpServer();

// Handle shutdown gracefully
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await server.stop();
    logger.info('Server stopped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// Register signal handlers
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
(async () => {
  try {
    logger.info('Starting Cargo Package README MCP Server...');
    await server.run();
    logger.info('Server started successfully');
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
})();