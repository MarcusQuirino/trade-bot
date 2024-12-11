import { z } from "zod";
import { type Env, envSchema } from "../types/config";

export const validateEnv = (): Env => {
  try {
    const env = {
      LOG_LEVEL: Bun.env.LOG_LEVEL,
      DISCORD_TOKEN: Bun.env.DISCORD_TOKEN,
      DISCORD_CHANNEL_ID: Bun.env.DISCORD_CHANNEL_ID,
      BSC_NODE: Bun.env.BSC_NODE || "https://bsc-dataseed.binance.org/",
      WALLET_ADDRESS: Bun.env.WALLET_ADDRESS,
      PRIVATE_KEY: Bun.env.PRIVATE_KEY,
      TOKENS: {
        CAKE:
          Bun.env.CAKE_ADDRESS || "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
        BUSD:
          Bun.env.BUSD_ADDRESS || "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      },
    };

    const validatedEnv = envSchema.parse(env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join("."));
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(", ")}\n` +
          "Please check your .env file"
      );
    }
    throw error;
  }
};
