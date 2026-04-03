import express from 'express';
import cors from 'cors';
import http from 'http';
import { engineBridge } from './services/engineBridge';
import { initWebSocket } from './websocket/handler';
import ordersRouter from './routes/orders';
import tradesRouter from './routes/trades';
import bookRouter from './routes/book';
import simulatorRouter from './routes/simulator';

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/book', bookRouter);
app.use('/api/simulator', simulatorRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initWebSocket(server);
engineBridge.start();

engineBridge.on('exit', (code) => {
  console.error(`Engine exited with code ${code}, restarting...`);
  setTimeout(() => engineBridge.start(), 1000);
});

server.listen(PORT, () => {
  console.log(`Order Book server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  engineBridge.stop();
  server.close();
  process.exit(0);
});
