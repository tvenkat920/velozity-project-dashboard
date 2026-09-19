import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import createApp from './app';
import { initSocket } from './services/socketService';
import { initCronJobs } from './services/cronService';
import prisma from './config/prisma';

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = createApp();
const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer, FRONTEND_URL);

// Initialize background cron scheduler
initCronJobs();

httpServer.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🚀 Velozity Backend running on port ${PORT}`);
  console.log(`🌐 CORS allowed origin: ${FRONTEND_URL}`);
  console.log(`⚡ WebSocket Server attached`);
  console.log(`=========================================`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  httpServer.close(async () => {
    console.log('[Server] HTTP server closed');
    await prisma.$disconnect();
    console.log('[Prisma] Disconnected from database');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
