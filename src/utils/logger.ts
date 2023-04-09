import { join } from 'node:path';
import { pino } from 'pino';

const transport = pino.transport({
  targets: [
    {
      level: 'info',
      options: {
        colorize: true,
        translateTime: true,
      },
      target: 'pino-pretty',
    },
    {
      level: 'info',
      options: {
        destination: join('.', 'bot.log'),
      },
      target: 'pino/file',
    },
  ],
});

export const logger = pino(transport);
