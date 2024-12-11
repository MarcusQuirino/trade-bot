import type { Indicators } from '../../types/trading';

export const createAnalysisService = () => {
  const priceHistory = new Map<string, number[]>();

  const addPrice = (token: string, price: number) => {
    if (!priceHistory.has(token)) {
      priceHistory.set(token, []);
    }
    const prices = priceHistory.get(token)!;
    prices.push(price);
    if (prices.length > 30) prices.shift();
  };

  const calculateIndicators = (prices: number[]): Indicators | null => {
    if (prices.length < 30) return null;

    const deltas = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = deltas.filter(d => d >= 0);
    const losses = deltas.filter(d => d < 0).map(d => -d);
    
    const avgGain = gains.length ? gains.reduce((a, b) => a + b) / gains.length : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b) / losses.length : 0;
    
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
    const ema12 = prices.slice(-12).reduce((a, b) => a + b) / 12;
    const ema26 = prices.slice(-26).reduce((a, b) => a + b) / 26;

    return {
      rsi,
      ema12,
      ema26,
      currentPrice: prices[prices.length - 1]
    };
  };

  return { addPrice, calculateIndicators };
}; 