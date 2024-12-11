import pino from 'pino';
import { config } from '../../config';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
});

export const logger = pino(
  {
    level: config.LOG_LEVEL,
    base: undefined,
  },
  transport,
);
