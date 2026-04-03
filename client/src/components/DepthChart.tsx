import type { BookState } from '../types';

interface DepthChartProps {
  book: BookState;
}

export function DepthChart({ book }: DepthChartProps) {
  // Build cumulative depth data
  const bidDepth: { price: number; cumulative: number }[] = [];
  let cumBid = 0;
  for (const level of book.bids) {
    cumBid += level.quantity;
    bidDepth.push({ price: level.price, cumulative: cumBid });
  }

  const askDepth: { price: number; cumulative: number }[] = [];
  let cumAsk = 0;
  for (const level of book.asks) {
    cumAsk += level.quantity;
    askDepth.push({ price: level.price, cumulative: cumAsk });
  }

  const maxDepth = Math.max(cumBid, cumAsk, 1);
  const allPrices = [...bidDepth.map((d) => d.price), ...askDepth.map((d) => d.price)];
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 100;
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = 100;
  const chartHeight = 100;

  const toX = (price: number) => ((price - minPrice) / priceRange) * chartWidth;
  const toY = (qty: number) => chartHeight - (qty / maxDepth) * chartHeight;

  const bidPath = bidDepth.length > 0
    ? `M ${toX(bidDepth[0].price)} ${toY(bidDepth[0].cumulative)} ` +
      bidDepth.map((d) => `L ${toX(d.price)} ${toY(d.cumulative)}`).join(' ') +
      ` L ${toX(bidDepth[bidDepth.length - 1].price)} ${chartHeight} L ${toX(bidDepth[0].price)} ${chartHeight} Z`
    : '';

  const askPath = askDepth.length > 0
    ? `M ${toX(askDepth[0].price)} ${toY(askDepth[0].cumulative)} ` +
      askDepth.map((d) => `L ${toX(d.price)} ${toY(d.cumulative)}`).join(' ') +
      ` L ${toX(askDepth[askDepth.length - 1].price)} ${chartHeight} L ${toX(askDepth[0].price)} ${chartHeight} Z`
    : '';

  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-white">Depth Chart</h2>
      </div>

      <div className="p-4">
        {allPrices.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-[var(--color-text-secondary)]">
            No data
          </div>
        ) : (
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[200px]" preserveAspectRatio="none">
            {bidPath && (
              <path d={bidPath} fill="rgba(34, 197, 94, 0.2)" stroke="var(--color-bid)" strokeWidth="0.5" />
            )}
            {askPath && (
              <path d={askPath} fill="rgba(239, 68, 68, 0.2)" stroke="var(--color-ask)" strokeWidth="0.5" />
            )}
          </svg>
        )}
      </div>

      {allPrices.length > 0 && (
        <div className="flex justify-between px-4 pb-3 text-xs text-[var(--color-text-secondary)]">
          <span>{minPrice.toLocaleString()}</span>
          <span>{maxPrice.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
