import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { translateTime: 'SYS:standard' }
  },
  level: process.env.LOG_LEVEL || 'info'
});
