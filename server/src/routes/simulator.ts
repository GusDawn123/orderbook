import { Router, Request, Response } from 'express';
import { marketSimulator } from '../services/marketSimulator';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(marketSimulator.getStatus());
});

router.post('/start', (_req: Request, res: Response) => {
  marketSimulator.start();
  res.json(marketSimulator.getStatus());
});

router.post('/stop', async (_req: Request, res: Response) => {
  await marketSimulator.stop();
  res.json(marketSimulator.getStatus());
});

router.put('/config', (req: Request, res: Response) => {
  marketSimulator.updateConfig(req.body);
  res.json(marketSimulator.getStatus());
});

export default router;
