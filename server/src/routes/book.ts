import { Router, Request, Response } from 'express';
import { engineBridge } from '../services/engineBridge';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await engineBridge.getSnapshot();
    res.json(response.book);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
