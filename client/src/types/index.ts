export type Side = 'Buy' | 'Sell';
export type OrderType = 'GoodTillCancel' | 'FillAndKill';

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
  timestamp?: string;
}

export interface BookUpdateMessage {
  type: 'book_update';
  book: BookState;
  trades: TradeResult[];
}

export interface OrderFormData {
  side: Side;
  type: OrderType;
  price: number;
  quantity: number;
}
