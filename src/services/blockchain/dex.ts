import { ethers } from "ethers";
import type { Env } from "../../types/config";
import { logger } from "../logger/logger";

const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
];

export const createDexService = (config: Env) => {
  const provider = new ethers.providers.JsonRpcProvider(config.BSC_NODE);
  const wallet = new ethers.Wallet(config.PRIVATE_KEY, provider);
  const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, wallet);

  logger.info("DEX service initialized");

  const getTokenPrice = async (
    tokenAddress: string,
    baseTokenAddress: string
  ) => {
    try {
      const amountIn = ethers.utils.parseEther("1");
      const path = [tokenAddress, baseTokenAddress];
      const amounts = await router.getAmountsOut(amountIn, path);
      const price = Number.parseFloat(ethers.utils.formatEther(amounts[1]));

      logger.debug(
        { tokenAddress, baseTokenAddress, price },
        "Token price fetched"
      );
      return price;
    } catch (error) {
      logger.error({ error, tokenAddress }, "Error getting price");
      return 0;
    }
  };

  const createBuyOrder = async (tokenAddress: string, amount: number) => {
    logger.info({ tokenAddress, amount }, "Creating buy order");

    const path = [config.TOKENS.BUSD, tokenAddress];
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const amountIn = ethers.utils.parseEther(amount.toString());
    const slippage = 0.05; // 5% slippage

    const expectedOutput = await router.getAmountsOut(amountIn, path);
    const minOutput = expectedOutput[1]
      .mul(ethers.BigNumber.from(100 - Math.floor(slippage * 100)))
      .div(100);

    logger.debug(
      {
        amountIn: amountIn.toString(),
        minOutput: minOutput.toString(),
        deadline,
      },
      "Buy order parameters calculated"
    );

    const tx = await router.swapExactTokensForTokens(
      amountIn,
      minOutput,
      path,
      config.WALLET_ADDRESS,
      deadline,
      { gasLimit: 300000 }
    );

    logger.info({ txHash: tx.hash }, "Buy order created");
    return tx.hash;
  };

  const createSellOrder = async (tokenAddress: string, amount: number) => {
    const path = [tokenAddress, config.TOKENS.BUSD];
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const amountIn = ethers.utils.parseEther(amount.toString());
    const slippage = 0.05;

    const expectedOutput = await router.getAmountsOut(amountIn, path);
    const minOutput = expectedOutput[1]
      .mul(ethers.BigNumber.from(100 - Math.floor(slippage * 100)))
      .div(100);

    const tx = await router.swapExactTokensForTokens(
      amountIn,
      minOutput,
      path,
      config.WALLET_ADDRESS,
      deadline,
      { gasLimit: 300000 }
    );

    return tx.hash;
  };

  const getGasPrice = async () => {
    return (await provider.getGasPrice()).toString();
  };

  return { getTokenPrice, createBuyOrder, createSellOrder, getGasPrice };
};
