import type { OrderFormData, BookState, TradeResult } from '../types';

const API_BASE = '/api';

export async function submitOrder(order: OrderFormData): Promise<{ orderId: number; trades: TradeResult[]; book: BookState }> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit order');
  }
  return response.json();
}

export async function cancelOrder(orderId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel order');
  }
}

export async function getBookSnapshot(): Promise<BookState> {
  const response = await fetch(`${API_BASE}/book`);
  if (!response.ok) throw new Error('Failed to fetch book');
  return response.json();
}

export async function getRecentTrades(): Promise<TradeResult[]> {
  const response = await fetch(`${API_BASE}/trades`);
  if (!response.ok) throw new Error('Failed to fetch trades');
  return response.json();
}

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

export interface SimulatorStatus {
  running: boolean;
  config: SimulatorConfig;
  stats: {
    tickCount: number;
    trackedOrders: number;
    currentMidPrice: number;
  };
}

export async function getSimulatorStatus(): Promise<SimulatorStatus> {
  const response = await fetch(`${API_BASE}/simulator`);
  if (!response.ok) throw new Error('Failed to fetch simulator status');
  return response.json();
}

export async function startSimulator(): Promise<SimulatorStatus> {
  const response = await fetch(`${API_BASE}/simulator/start`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to start simulator');
  return response.json();
}

export async function stopSimulator(): Promise<SimulatorStatus> {
  const response = await fetch(`${API_BASE}/simulator/stop`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to stop simulator');
  return response.json();
}

export async function updateSimulatorConfig(config: Partial<SimulatorConfig>): Promise<SimulatorStatus> {
  const response = await fetch(`${API_BASE}/simulator/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to update simulator config');
  return response.json();
}
