import { useState, useCallback, useEffect } from 'react';
import type { BookState, TradeResult, BookUpdateMessage } from '../types';
import { useWebSocket } from './useWebSocket';
import { getBookSnapshot } from '../services/api';

export function useOrderBook() {
  const [book, setBook] = useState<BookState>({ bids: [], asks: [], size: 0 });
  const [trades, setTrades] = useState<TradeResult[]>([]);

  const handleMessage = useCallback((data: BookUpdateMessage) => {
    if (data.type === 'book_update') {
      setBook(data.book);
      if (data.trades.length > 0) {
        setTrades((prev) => [...data.trades, ...prev].slice(0, 100));
      }
    }
  }, []);

  const { connected } = useWebSocket(handleMessage);

  useEffect(() => {
    getBookSnapshot()
      .then(setBook)
      .catch(() => {});
  }, []);

  const spread = book.bids.length > 0 && book.asks.length > 0
    ? book.asks[0].price - book.bids[0].price
    : null;

  return { book, trades, connected, spread };
}
