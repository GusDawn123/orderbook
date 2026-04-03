import type { BookState } from '../types';

interface OrderBookViewProps {
  book: BookState;
  spread: number | null;
}

export function OrderBookView({ book, spread }: OrderBookViewProps) {
  const maxQuantity = Math.max(
    ...book.bids.map((l) => l.quantity),
    ...book.asks.map((l) => l.quantity),
    1,
  );

  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-white">Order Book</h2>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 px-4 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
        <div className="grid grid-cols-2 gap-2">
          <span>Price</span>
          <span className="text-right">Quantity</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pl-4">
          <span>Price</span>
          <span className="text-right">Quantity</span>
        </div>
      </div>

      <div className="grid grid-cols-2 min-h-[350px]">
        {/* Bids (Buy side) */}
        <div className="border-r border-[var(--color-border)]">
          <div className="px-2 py-1 text-xs text-center text-[var(--color-bid)] font-semibold border-b border-[var(--color-border)]">
            BIDS
          </div>
          {book.bids.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--color-text-secondary)]">
              No bids
            </div>
          ) : (
            book.bids.map((level) => (
              <div
                key={level.price}
                className="relative grid grid-cols-2 gap-2 px-4 py-1.5 text-sm hover:bg-[var(--color-bid-bg)] transition-colors"
              >
                <div
                  className="absolute inset-y-0 right-0 bg-[var(--color-bid-bg)] transition-all duration-300"
                  style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
                />
                <span className="relative text-[var(--color-bid)] font-medium">
                  {level.price.toLocaleString()}
                </span>
                <span className="relative text-right text-[var(--color-text-primary)]">
                  {level.quantity.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Asks (Sell side) */}
        <div>
          <div className="px-2 py-1 text-xs text-center text-[var(--color-ask)] font-semibold border-b border-[var(--color-border)]">
            ASKS
          </div>
          {book.asks.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--color-text-secondary)]">
              No asks
            </div>
          ) : (
            book.asks.map((level) => (
              <div
                key={level.price}
                className="relative grid grid-cols-2 gap-2 px-4 py-1.5 text-sm hover:bg-[var(--color-ask-bg)] transition-colors"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-ask-bg)] transition-all duration-300"
                  style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
                />
                <span className="relative text-[var(--color-ask)] font-medium">
                  {level.price.toLocaleString()}
                </span>
                <span className="relative text-right text-[var(--color-text-primary)]">
                  {level.quantity.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spread */}
      {spread !== null && (
        <div className="px-4 py-2 text-center text-xs border-t border-[var(--color-border)] text-[var(--color-text-secondary)]">
          Spread: <span className="text-white font-medium">{spread}</span>
          {' | '}
          Orders: <span className="text-white font-medium">{book.size}</span>
        </div>
      )}
    </div>
  );
}
