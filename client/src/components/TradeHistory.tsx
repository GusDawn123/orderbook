import type { TradeResult } from '../types';

interface TradeHistoryProps {
  trades: TradeResult[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-white">Trade History</h2>
      </div>

      <div className="grid grid-cols-4 px-4 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
        <span>Bid</span>
        <span>Ask</span>
        <span className="text-right">Price</span>
        <span className="text-right">Qty</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {trades.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--color-text-secondary)]">
            No trades yet
          </div>
        ) : (
          trades.map((trade, index) => (
            <div
              key={`${trade.bidOrderId}-${trade.askOrderId}-${index}`}
              className="grid grid-cols-4 px-4 py-1.5 text-sm border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-light)] transition-colors animate-[fadeIn_0.3s_ease-in]"
            >
              <span className="text-[var(--color-bid)]">#{trade.bidOrderId}</span>
              <span className="text-[var(--color-ask)]">#{trade.askOrderId}</span>
              <span className="text-right text-white font-medium">{trade.price.toLocaleString()}</span>
              <span className="text-right text-[var(--color-text-primary)]">{trade.quantity.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
