import { engineBridge } from '../src/services/engineBridge';

describe('Engine Bridge - Trade Scenarios', () => {
  beforeAll(() => {
    engineBridge.start();
  });

  afterAll(() => {
    engineBridge.stop();
  });

  it('should generate multiple trades across price levels', async () => {
    // Place two asks at different prices
    await engineBridge.addOrder('SELL', 'GTC', 100, 20);
    await engineBridge.addOrder('SELL', 'GTC', 101, 30);

    // Aggressive buy that crosses both levels
    const response = await engineBridge.addOrder('BUY', 'GTC', 101, 40);

    expect(response.trades).toHaveLength(2);
    // First fills the cheaper ask (trade price reported as bid price = 101)
    expect(response.trades[0].quantity).toBe(20);
    // Then fills partially at next level
    expect(response.trades[1].quantity).toBe(20);
  });

  it('should handle FillAndKill partial fill correctly', async () => {
    // There should be 10 remaining on ask at 101 from previous test
    const snapshot = await engineBridge.getSnapshot();
    expect(snapshot.book.asks.length).toBeGreaterThan(0);

    const response = await engineBridge.addOrder('BUY', 'FAK', 101, 100);

    // Should fill whatever is available and cancel the rest
    expect(response.trades.length).toBeGreaterThan(0);
    // FAK order should not be on the book
    const afterSnapshot = await engineBridge.getSnapshot();
    const fakOnBook = afterSnapshot.book.bids.some((b) => b.quantity === 100);
    expect(fakOnBook).toBe(false);
  });
});
