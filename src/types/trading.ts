import { z } from 'zod';

export const tradeSchema = z.object({
  type: z.enum(['BUY', 'SELL']),
  token: z.string(),
  amount: z.number(),
  price: z.number(),
  totalValue: z.number(),
  gasPrice: z.string()
});

export const indicatorsSchema = z.object({
  rsi: z.number(),
  ema12: z.number(), 
  ema26: z.number(),
  currentPrice: z.number()
});

export type Trade = z.infer<typeof tradeSchema>;
export type Indicators = z.infer<typeof indicatorsSchema>;