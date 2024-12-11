import { z } from "zod";

export const envSchema = z.object({
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  DISCORD_TOKEN: z.string().min(1, "Discord token is required"),
  DISCORD_CHANNEL_ID: z.string().min(1, "Discord channel ID is required"),
  BSC_NODE: z.string().url("BSC node must be a valid URL"),
  WALLET_ADDRESS: z.string().min(1, "Wallet address is required"),
  PRIVATE_KEY: z.string().min(1, "Private key is required"),
  TOKENS: z.record(z.string().min(1, "Token address is required")),
});

export type Env = z.infer<typeof envSchema>;
