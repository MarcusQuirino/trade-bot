import { config } from "./config";
import { createAnalysisService } from "./services/analysis/indicators";
// import { createDexService } from './services/blockchain/dex';
import { createMockDexService } from "./services/blockchain/mock-dex";
import { createDiscordBot } from "./services/discord/bot";
import { logger } from "./services/logger/logger";

async function main() {
  try {
    logger.info("Initializing trade bot services...");

    const dexService = createMockDexService(config);
    logger.info("Mock DEX service initialized");

    const analysisService = createAnalysisService();
    logger.info("Analysis service initialized");

    const bot = createDiscordBot(config, dexService, analysisService);
    await bot.start();
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Failed to start application:", error.message);
    } else {
      logger.error("Failed to start application:", error);
    }
    process.exit(1);
  }
}

main();
