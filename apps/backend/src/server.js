import app from './app.js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { logger } from './config/logger.js';

dotenv.config();

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`API escuchando en http://localhost:${PORT}`);
});
