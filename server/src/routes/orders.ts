import { Router, Request, Response } from 'express';
import { engineBridge } from '../services/engineBridge';
import { insertOrder, insertTrade, updateOrderStatus, getActiveOrders } from '../services/db';
import { broadcast } from '../websocket/handler';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await getActiveOrders();
    res.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { side, type, price, quantity } = req.body;

    if (!side || !type || !price || !quantity) {
      res.status(400).json({ error: 'Missing required fields: side, type, price, quantity' });
      return;
    }

    const engineSide = side.toUpperCase() as 'BUY' | 'SELL';
    const engineType = type === 'FillAndKill' ? 'FAK' : 'GTC';

    const response = await engineBridge.addOrder(engineSide, engineType, price, quantity);

    await insertOrder(response.orderId, type, side, price, quantity);

    for (const trade of response.trades) {
      await insertTrade(trade.bidOrderId, trade.askOrderId, trade.price, trade.quantity);
      await updateOrderStatus(trade.bidOrderId, 'filled', 0);
      await updateOrderStatus(trade.askOrderId, 'filled', 0);
    }

    broadcast({
      type: 'book_update',
      book: response.book,
      trades: response.trades,
    });

    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string, 10);
    const response = await engineBridge.cancelOrder(orderId);

    await updateOrderStatus(orderId, 'cancelled');

    broadcast({
      type: 'book_update',
      book: response.book,
      trades: [],
    });

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string, 10);
    const { side, price, quantity } = req.body;

    const engineSide = side.toUpperCase() as 'BUY' | 'SELL';
    const response = await engineBridge.modifyOrder(orderId, engineSide, price, quantity);

    for (const trade of response.trades) {
      await insertTrade(trade.bidOrderId, trade.askOrderId, trade.price, trade.quantity);
    }

    broadcast({
      type: 'book_update',
      book: response.book,
      trades: response.trades,
    });

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
