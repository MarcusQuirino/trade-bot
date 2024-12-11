import { z } from 'zod';
import type { Config } from '../../types/config';
import { logger } from '../logger/logger';

// Simulated price volatility settings
const PRICE_VOLATILITY = 0.02; // 2% max price change per call
const INITIAL_TOKEN_PRICES = {
  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 300, // WBNB
  '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': 1, // BUSD
  '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82': 4, // CAKE
} as const;

const mockPrices = { ...INITIAL_TOKEN_PRICES };

function getRandomPriceChange(currentPrice: number): number {
  const maxChange = currentPrice * PRICE_VOLATILITY;
  return (Math.random() - 0.5) * 2 * maxChange;
}

export function createMockDexService(config: Config) {
  console.log(config);

  const getTokenPrice = async (tokenAddress: string, baseTokenAddress: string) => {
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const tokenPrices = mockPrices as Record<string, number>;
      if (!tokenPrices[tokenAddress]) {
        tokenPrices[tokenAddress] = 10; // Default price for unknown tokens
      }
      // Simulate price movement
      const tokenPrice = tokenPrices[tokenAddress];
      tokenPrices[tokenAddress] = tokenPrice + getRandomPriceChange(tokenPrice);

      logger.debug(
        {
          tokenAddress,
          price: tokenPrices[tokenAddress],
        },
        'Mock price fetched',
      );

      return tokenPrices[tokenAddress];
    } catch (error) {
      logger.error({ error, tokenAddress }, 'Error getting mock price');
      return 0;
    }
  };

  const createBuyOrder = async (tokenAddress: string, amount: number) => {
    try {
      // Validate inputs
      z.string().uuid().parse(tokenAddress);
      z.number().positive().parse(amount);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockTxHash = `0x${Array.from({ length: 64 })
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('')}`;

      logger.info(
        {
          tokenAddress,
          amount,
          txHash: mockTxHash,
        },
        'Mock buy order created',
      );

      return mockTxHash;
    } catch (error) {
      logger.error({ error, tokenAddress, amount }, 'Error creating mock buy order');
      throw new Error('Failed to create mock buy order');
    }
  };

  const createSellOrder = async (tokenAddress: string, amount: number) => {
    try {
      // Validate inputs
      z.string().uuid().parse(tokenAddress);
      z.number().positive().parse(amount);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockTxHash = `0x${Array.from({ length: 64 })
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('')}`;

      logger.info(
        {
          tokenAddress,
          amount,
          txHash: mockTxHash,
        },
        'Mock sell order created',
      );

      return mockTxHash;
    } catch (error) {
      logger.error({ error, tokenAddress, amount }, 'Error creating mock sell order');
      throw new Error('Failed to create mock sell order');
    }
  };

  const getGasPrice = async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Return a random gas price between 5-15 Gwei
    const mockGasPrice = Math.floor(Math.random() * 10 + 5) * 1e9;

    logger.debug({ gasPrice: mockGasPrice }, 'Mock gas price fetched');

    return mockGasPrice.toString();
  };

  return {
    getTokenPrice,
    createBuyOrder,
    createSellOrder,
    getGasPrice,
  };
}
