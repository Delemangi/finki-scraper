import { join } from 'node:path';
import { pino } from 'pino';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        destination: join('.', 'logs', 'bot.log'),
      },
      target: 'pino/file',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
export const logger = pino(transport);
