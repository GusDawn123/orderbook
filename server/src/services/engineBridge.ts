import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface BookLevel {
  price: number;
  quantity: number;
}

export interface BookState {
  bids: BookLevel[];
  asks: BookLevel[];
  size: number;
}

export interface TradeResult {
  bidOrderId: number;
  askOrderId: number;
  price: number;
  quantity: number;
}

export interface AddOrderResponse {
  orderId: number;
  trades: TradeResult[];
  book: BookState;
}

export interface CancelOrderResponse {
  cancelled: number;
  book: BookState;
}

export interface ModifyOrderResponse {
  modified: number;
  trades: TradeResult[];
  book: BookState;
}

export interface SnapshotResponse {
  book: BookState;
}

type EngineResponse = AddOrderResponse | CancelOrderResponse | ModifyOrderResponse | SnapshotResponse | { error: string };

class EngineBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private pendingRequests: Array<{
    resolve: (value: EngineResponse) => void;
    reject: (reason: Error) => void;
  }> = [];
  private buffer: string = '';

  start(): void {
    const enginePath = process.env.ENGINE_PATH ||
      path.resolve(__dirname, '../../engine/build/engine/orderbook_server.exe');

    this.process = spawn(enginePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout!.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        const pending = this.pendingRequests.shift();
        if (pending) {
          try {
            const parsed = JSON.parse(line);
            pending.resolve(parsed);
          } catch {
            pending.reject(new Error(`Invalid JSON from engine: ${line}`));
          }
        }
      }
    });

    this.process.stderr!.on('data', (data: Buffer) => {
      console.error(`[Engine stderr]: ${data.toString()}`);
    });

    this.process.on('exit', (code) => {
      console.error(`Engine process exited with code ${code}`);
      for (const pending of this.pendingRequests) {
        pending.reject(new Error('Engine process terminated'));
      }
      this.pendingRequests = [];
      this.emit('exit', code);
    });
  }

  stop(): void {
    if (this.process) {
      this.process.stdin!.end();
      this.process.kill();
      this.process = null;
    }
  }

  private sendCommand(command: string): Promise<EngineResponse> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin!.writable) {
        reject(new Error('Engine process not running'));
        return;
      }
      this.pendingRequests.push({ resolve, reject });
      this.process.stdin!.write(command + '\n');
    });
  }

  async addOrder(side: 'BUY' | 'SELL', type: 'GTC' | 'FAK', price: number, quantity: number): Promise<AddOrderResponse> {
    const response = await this.sendCommand(`ADD ${side} ${type} ${price} ${quantity}`);
    if ('error' in response) throw new Error(response.error);
    return response as AddOrderResponse;
  }

  async cancelOrder(orderId: number): Promise<CancelOrderResponse> {
    const response = await this.sendCommand(`CANCEL ${orderId}`);
    if ('error' in response) throw new Error(response.error);
    return response as CancelOrderResponse;
  }

  async modifyOrder(orderId: number, side: 'BUY' | 'SELL', price: number, quantity: number): Promise<ModifyOrderResponse> {
    const response = await this.sendCommand(`MODIFY ${orderId} ${side} ${price} ${quantity}`);
    if ('error' in response) throw new Error(response.error);
    return response as ModifyOrderResponse;
  }

  async getSnapshot(): Promise<SnapshotResponse> {
    const response = await this.sendCommand('SNAPSHOT');
    if ('error' in response) throw new Error(response.error);
    return response as SnapshotResponse;
  }
}

export const engineBridge = new EngineBridge();
