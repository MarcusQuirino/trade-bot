import { config } from './config';
// import { createDexService } from './services/blockchain/dex';
import { createMockDexService } from './services/blockchain/mock-dex';
import { createAnalysisService } from './services/analysis/indicators';
import { createDiscordBot } from './services/discord/bot';
import { logger } from './services/logger/logger';

const startBot = async () => {
  logger.info('Initializing trade bot services...');
  
  const dexService = createMockDexService(config);
  logger.info('Mock DEX service initialized');
  
  const analysisService = createAnalysisService();
  logger.info('Analysis service initialized');
  
  const bot = createDiscordBot(config, dexService, analysisService);
  logger.info('Discord bot created');
  
  await bot.start();
  logger.info('Bot started successfully');
};

startBot().catch((error) => {
  logger.error({ error }, 'Failed to start the bot');
  process.exit(1);
}); 