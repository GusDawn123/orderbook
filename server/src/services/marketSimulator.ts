import { engineBridge, AddOrderResponse, TradeResult } from './engineBridge';
import { broadcast } from '../websocket/handler';

export interface SimulatorConfig {
  tickRateMs: number;
  midPrice: number;
  spreadTicks: number;
  depthLevels: number;
  volatility: number;
  aggressiveness: number;
  meanReversion: number;
  maxTrackedOrders: number;
}

interface SimulatorState {
  running: boolean;
  currentMidPrice: number;
  initialMidPrice: number;
  trackedBidOrderIds: number[];
  trackedAskOrderIds: number[];
  tickCount: number;
}

const DEFAULT_CONFIG: SimulatorConfig = {
  tickRateMs: 500,
  midPrice: 10000,
  spreadTicks: 5,
  depthLevels: 8,
  volatility: 0.3,
  aggressiveness: 0.15,
  meanReversion: 0.05,
  maxTrackedOrders: 200,
};

class MarketSimulator {
  private config: SimulatorConfig = { ...DEFAULT_CONFIG };
  private state: SimulatorState = {
    running: false,
    currentMidPrice: DEFAULT_CONFIG.midPrice,
    initialMidPrice: DEFAULT_CONFIG.midPrice,
    trackedBidOrderIds: [],
    trackedAskOrderIds: [],
    tickCount: 0,
  };
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking: boolean = false;

  start(): void {
    if (this.state.running) return;

    this.state = {
      running: true,
      currentMidPrice: this.config.midPrice,
      initialMidPrice: this.config.midPrice,
      trackedBidOrderIds: [],
      trackedAskOrderIds: [],
      tickCount: 0,
    };

    this.intervalHandle = setInterval(() => this.tick(), this.config.tickRateMs);
  }

  async stop(): Promise<void> {
    if (!this.state.running) return;

    this.state.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    await this.cancelAllTrackedOrders();
  }

  updateConfig(partial: Partial<SimulatorConfig>): void {
    this.config = { ...this.config, ...partial };

    if (this.state.running && partial.tickRateMs !== undefined && this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = setInterval(() => this.tick(), this.config.tickRateMs);
    }
  }

  getStatus() {
    return {
      running: this.state.running,
      config: { ...this.config },
      stats: {
        tickCount: this.state.tickCount,
        trackedOrders: this.state.trackedBidOrderIds.length + this.state.trackedAskOrderIds.length,
        currentMidPrice: this.state.currentMidPrice,
      },
    };
  }

  private async tick(): Promise<void> {
    if (this.ticking || !this.state.running) return;
    this.ticking = true;

    try {
      const allTrades: TradeResult[] = [];

      this.driftPrice();
      await this.cancelStaleOrders();
      const quoteTrades = await this.placeMarketMakerQuotes();
      allTrades.push(...quoteTrades);

      const crossingTrades = await this.placeAggressiveOrders();
      allTrades.push(...crossingTrades);

      const snapshot = await engineBridge.getSnapshot();
      broadcast({
        type: 'book_update',
        book: snapshot.book,
        trades: allTrades,
      });

      this.state.tickCount++;
    } catch (error) {
      console.error('[Simulator] tick error:', error);
    } finally {
      this.ticking = false;
    }
  }

  private driftPrice(): void {
    const { volatility, meanReversion, spreadTicks } = this.config;
    const { currentMidPrice, initialMidPrice } = this.state;

    const randomComponent = (Math.random() - 0.5) * 2 * volatility * spreadTicks;
    const reversionComponent = meanReversion * (currentMidPrice - initialMidPrice);
    const drift = randomComponent - reversionComponent;

    this.state.currentMidPrice = Math.max(1, Math.round(currentMidPrice + drift));
  }

  private async cancelStaleOrders(): Promise<void> {
    const cancelRatio = 0.15 + Math.random() * 0.15;

    const bidCancelCount = Math.ceil(this.state.trackedBidOrderIds.length * cancelRatio);
    const askCancelCount = Math.ceil(this.state.trackedAskOrderIds.length * cancelRatio);

    const bidIndicesToCancel = this.pickRandomIndices(this.state.trackedBidOrderIds.length, bidCancelCount);
    const askIndicesToCancel = this.pickRandomIndices(this.state.trackedAskOrderIds.length, askCancelCount);

    const bidIdsToCancel = bidIndicesToCancel.map(i => this.state.trackedBidOrderIds[i]);
    const askIdsToCancel = askIndicesToCancel.map(i => this.state.trackedAskOrderIds[i]);

    for (const id of bidIdsToCancel) {
      try { await engineBridge.cancelOrder(id); } catch { /* already filled or cancelled */ }
    }
    for (const id of askIdsToCancel) {
      try { await engineBridge.cancelOrder(id); } catch { /* already filled or cancelled */ }
    }

    this.state.trackedBidOrderIds = this.state.trackedBidOrderIds.filter(id => !bidIdsToCancel.includes(id));
    this.state.trackedAskOrderIds = this.state.trackedAskOrderIds.filter(id => !askIdsToCancel.includes(id));
  }

  private async placeMarketMakerQuotes(): Promise<TradeResult[]> {
    const { spreadTicks, depthLevels, maxTrackedOrders } = this.config;
    const { currentMidPrice } = this.state;
    const totalTracked = this.state.trackedBidOrderIds.length + this.state.trackedAskOrderIds.length;
    const trades: TradeResult[] = [];

    if (totalTracked >= maxTrackedOrders) return trades;

    const levelsToPlace = Math.min(depthLevels, Math.floor((maxTrackedOrders - totalTracked) / 2));

    for (let i = 0; i < levelsToPlace; i++) {
      const bidPrice = currentMidPrice - spreadTicks - i;
      const askPrice = currentMidPrice + spreadTicks + i;
      const quantity = Math.ceil(50 / (i + 1) * (0.5 + Math.random()));

      try {
        const bidResponse = await engineBridge.addOrder('BUY', 'GTC', bidPrice, quantity);
        this.state.trackedBidOrderIds.push(bidResponse.orderId);
        trades.push(...bidResponse.trades);
      } catch { /* engine error */ }

      try {
        const askResponse = await engineBridge.addOrder('SELL', 'GTC', askPrice, quantity);
        this.state.trackedAskOrderIds.push(askResponse.orderId);
        trades.push(...askResponse.trades);
      } catch { /* engine error */ }
    }

    return trades;
  }

  private async placeAggressiveOrders(): Promise<TradeResult[]> {
    const trades: TradeResult[] = [];

    if (Math.random() > this.config.aggressiveness) return trades;

    const { currentMidPrice, trackedAskOrderIds, trackedBidOrderIds } = this.state;
    const isBuy = Math.random() > 0.5;
    const quantity = Math.ceil(Math.random() * 20);

    const crossPrice = isBuy
      ? currentMidPrice + this.config.spreadTicks + 2
      : currentMidPrice - this.config.spreadTicks - 2;

    try {
      const side = isBuy ? 'BUY' : 'SELL';
      const response: AddOrderResponse = await engineBridge.addOrder(side, 'FAK', crossPrice, quantity);
      trades.push(...response.trades);

      // Remove filled orders from tracking
      for (const trade of response.trades) {
        this.state.trackedBidOrderIds = this.state.trackedBidOrderIds.filter(id => id !== trade.bidOrderId);
        this.state.trackedAskOrderIds = this.state.trackedAskOrderIds.filter(id => id !== trade.askOrderId);
      }
    } catch { /* engine error */ }

    return trades;
  }

  private async cancelAllTrackedOrders(): Promise<void> {
    const allIds = [...this.state.trackedBidOrderIds, ...this.state.trackedAskOrderIds];

    for (const id of allIds) {
      try { await engineBridge.cancelOrder(id); } catch { /* already gone */ }
    }

    this.state.trackedBidOrderIds = [];
    this.state.trackedAskOrderIds = [];

    try {
      const snapshot = await engineBridge.getSnapshot();
      broadcast({ type: 'book_update', book: snapshot.book, trades: [] });
    } catch { /* engine may be down */ }
  }

  private pickRandomIndices(length: number, count: number): number[] {
    if (count >= length) return Array.from({ length }, (_, i) => i);
    const indices = new Set<number>();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * length));
    }
    return Array.from(indices);
  }
}

export const marketSimulator = new MarketSimulator();
