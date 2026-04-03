import { Router, Request, Response } from 'express';
import { getRecentTrades } from '../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const result = await getRecentTrades(limit);
    res.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
