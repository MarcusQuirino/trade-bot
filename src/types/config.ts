import { z } from 'zod';

export const envSchema = z.object({
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    DISCORD_TOKEN: z.string().min(1, 'Discord token is required'),
    DISCORD_CHANNEL_ID: z.string().min(1, 'Discord channel ID is required'),
    BSC_NODE: z.string().url('BSC node must be a valid URL'),
    WALLET_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
    PRIVATE_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid private key format'),
    TOKENS: z.record(z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address format'))
  });
  
export type Config = z.infer<typeof envSchema>;