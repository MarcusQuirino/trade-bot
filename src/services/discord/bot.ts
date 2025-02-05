import {
  Client,
  Events,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import type { Env } from "../../types/config";
import type { Trade } from "../../types/trading";
import type { createAnalysisService } from "../analysis/indicators";
import type { createDexService } from "../blockchain/dex";
import { logger } from "../logger/logger";

export const createDiscordBot = (
  config: Env,
  dexService: ReturnType<typeof createDexService>,
  analysisService: ReturnType<typeof createAnalysisService>
) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  let isMonitoring = false;

  client.once(Events.ClientReady, () => {
    logger.info("Discord bot is ready!");
  });

  client.on(Events.Error, (error) => {
    logger.error("Discord client error:", error);
  });

  const requestTradeApproval = async (
    channel: TextChannel,
    trade: Trade
  ): Promise<boolean> => {
    const embed = new EmbedBuilder()
      .setTitle("Trade Approval Required")
      .setColor("#0099ff")
      .addFields([
        { name: "Type", value: trade.type },
        { name: "Token", value: trade.token },
        { name: "Amount", value: trade.amount.toFixed(4) },
        { name: "Price", value: `$${trade.price.toFixed(4)}` },
        { name: "Total Value", value: `$${trade.totalValue.toFixed(2)}` },
        { name: "Gas Price", value: trade.gasPrice },
      ]);

    const message = await channel.send({ embeds: [embed] });
    await message.react("✅");
    await message.react("❌");

    try {
      const collected = await message.awaitReactions({
        filter: (reaction, user) => {
          const emojiName = reaction.emoji.name;
          if (!emojiName) return false;
          return ["✅", "❌"].includes(emojiName) && !user.bot;
        },
        max: 1,
        time: 300000,
      });

      const reaction = collected.first();
      if (!reaction) return false;

      const approved = reaction.emoji.name === "✅";
      await message.reply(
        `Trade ${approved ? "approved" : "rejected"} by ${
          reaction.users.cache.last()?.tag
        }`
      );
      return approved;
    } catch {
      await message.reply("Trade approval timed out");
      return false;
    }
  };

  const executeTrade = async (channel: TextChannel, trade: Trade) => {
    try {
      const txHash = await (trade.type === "BUY"
        ? dexService.createBuyOrder(config.TOKENS[trade.token], trade.amount)
        : dexService.createSellOrder(config.TOKENS[trade.token], trade.amount));

      await channel.send(
        `Trade executed! Transaction hash: ${txHash}\n` +
          `View on BSCScan: https://bscscan.com/tx/${txHash}`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      await channel.send(`Error executing trade: ${errorMessage}`);
    }
  };

  const monitorMarkets = async (channel: TextChannel) => {
    while (isMonitoring) {
      try {
        for (const [tokenName, tokenAddress] of Object.entries(config.TOKENS)) {
          if (tokenName === "BUSD") continue;

          logger.debug({ tokenName }, "Monitoring token");
          const price = await dexService.getTokenPrice(
            tokenAddress,
            config.TOKENS.BUSD
          );

          analysisService.addPrice(tokenName, price);
          const indicators = analysisService.calculateIndicators([price]);

          if (!indicators) {
            logger.debug(
              { tokenName },
              "Skipping token due to insufficient data"
            );
            continue;
          }

          logger.debug(
            {
              tokenName,
              price,
              rsi: indicators.rsi,
              ema12: indicators.ema12,
              ema26: indicators.ema26,
            },
            "Token indicators calculated"
          );

          // Oversold condition - Buy signal
          if (indicators.rsi < 30) {
            const trade: Trade = {
              type: "BUY",
              token: tokenName,
              amount: 1.0,
              price,
              totalValue: price,
              gasPrice: await dexService.getGasPrice(),
            };

            if (await requestTradeApproval(channel, trade)) {
              await executeTrade(channel, trade);
            }
          }
          // Overbought condition - Sell signal
          else if (indicators.ema12 < indicators.ema26 && indicators.rsi > 70) {
            const trade: Trade = {
              type: "SELL",
              token: tokenName,
              amount: 1.0,
              price,
              totalValue: price,
              gasPrice: await dexService.getGasPrice(),
            };

            if (await requestTradeApproval(channel, trade)) {
              await executeTrade(channel, trade);
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 300000)); // 5 min
      } catch (error) {
        console.error("Error in market monitoring:", error);
        await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 min on error
      }
    }
  };

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const channel = client.channels.cache.get(
      config.DISCORD_CHANNEL_ID
    ) as TextChannel;

    switch (message.content) {
      case "!start": {
        if (isMonitoring) {
          await message.reply("Already monitoring markets!");
          return;
        }
        isMonitoring = true;
        await message.reply("Started monitoring markets. Use !stop to halt.");
        await monitorMarkets(channel);
        break;
      }

      case "!stop": {
        isMonitoring = false;
        await message.reply("Stopping market monitoring...");
        break;
      }

      case "!status": {
        if (!isMonitoring) {
          await message.reply(
            "Bot is inactive. Use !start to begin monitoring."
          );
          return;
        }

        const statusMessage = await Object.entries(config.TOKENS)
          .filter(([name]) => name !== "BUSD")
          .reduce(async (promise, [tokenName, tokenAddress]) => {
            const msg = await promise;
            const price = await dexService.getTokenPrice(
              tokenAddress,
              config.TOKENS.BUSD
            );
            return `${msg}${tokenName}: $${price.toFixed(4)}\n`;
          }, Promise.resolve("Current Market Status:\n"));

        await message.reply(statusMessage);
        break;
      }
    }
  });

  return {
    start: async () => {
      try {
        logger.debug("discord token", config.DISCORD_TOKEN);
        if (!config.DISCORD_TOKEN) {
          throw new Error("Discord token is not configured");
        }

        await client.login(config.DISCORD_TOKEN);
        logger.info("Discord bot started successfully");

        const channel = client.channels.cache.get(config.DISCORD_CHANNEL_ID);
        if (!channel || !(channel instanceof TextChannel)) {
          throw new Error(
            `Could not find Discord channel with ID: ${config.DISCORD_CHANNEL_ID}`
          );
        }

        return true;
      } catch (error) {
        logger.error("Failed to start Discord bot:", error);
        throw error;
      }
    },
    stop: async () => {
      try {
        isMonitoring = false;
        await client.destroy();
        logger.info("Discord bot stopped successfully");
      } catch (error) {
        logger.error("Error stopping Discord bot:", error);
        throw error;
      }
    },
  };
};
