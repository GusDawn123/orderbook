import { engineBridge, AddOrderResponse, SnapshotResponse } from '../src/services/engineBridge';

describe('Engine Bridge - Order Operations', () => {
  beforeAll(() => {
    engineBridge.start();
  });

  afterAll(() => {
    engineBridge.stop();
  });

  it('should add a buy order and return it on the book', async () => {
    const response = await engineBridge.addOrder('BUY', 'GTC', 100, 50);

    expect(response.orderId).toBe(1);
    expect(response.trades).toEqual([]);
    expect(response.book.bids).toEqual([{ price: 100, quantity: 50 }]);
    expect(response.book.asks).toEqual([]);
  });

  it('should add a sell order and generate a trade when matching', async () => {
    const response = await engineBridge.addOrder('SELL', 'GTC', 100, 30);

    expect(response.orderId).toBe(2);
    expect(response.trades).toHaveLength(1);
    expect(response.trades[0]).toEqual({
      bidOrderId: 1,
      askOrderId: 2,
      price: 100,
      quantity: 30,
    });
    // Remaining: 20 on bid
    expect(response.book.bids).toEqual([{ price: 100, quantity: 20 }]);
  });

  it('should return correct snapshot after operations', async () => {
    const response: SnapshotResponse = await engineBridge.getSnapshot();

    expect(response.book.bids).toEqual([{ price: 100, quantity: 20 }]);
    expect(response.book.asks).toEqual([]);
    expect(response.book.size).toBe(1);
  });

  it('should cancel an order', async () => {
    const response = await engineBridge.cancelOrder(1);

    expect(response.cancelled).toBe(1);
    expect(response.book.size).toBe(0);
    expect(response.book.bids).toEqual([]);
  });

  it('should handle FillAndKill with no match', async () => {
    const response = await engineBridge.addOrder('BUY', 'FAK', 50, 100);

    // FAK with no asks should result in empty book
    expect(response.trades).toEqual([]);
    expect(response.book.size).toBe(0);
  });

  it('should return error for cancelling non-existent order', async () => {
    await expect(engineBridge.cancelOrder(999)).rejects.toThrow();
  });
});
