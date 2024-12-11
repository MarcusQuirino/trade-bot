import { z } from 'zod';
import { type Config, envSchema } from '../types/config';

export const validateEnv = (): Config => {
  try {
    const env = {
      LOG_LEVEL: process.env.LOG_LEVEL,
      DISCORD_TOKEN: process.env.DISCORD_TOKEN,
      DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
      BSC_NODE: process.env.BSC_NODE || 'https://bsc-dataseed.binance.org/',
      WALLET_ADDRESS: process.env.WALLET_ADDRESS,
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      TOKENS: {
        CAKE: process.env.CAKE_ADDRESS || '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        BUSD: process.env.BUSD_ADDRESS || '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      },
    };

    const validatedEnv = envSchema.parse(env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
};
