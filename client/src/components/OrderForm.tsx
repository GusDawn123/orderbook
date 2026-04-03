import { useState } from 'react';
import type { Side, OrderType, OrderFormData } from '../types';
import { submitOrder } from '../services/api';

export function OrderForm() {
  const [side, setSide] = useState<Side>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('GoodTillCancel');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data: OrderFormData = {
        side,
        type: orderType,
        price: parseInt(price, 10),
        quantity: parseInt(quantity, 10),
      };
      const result = await submitOrder(data);
      const tradeCount = result.trades.length;
      setMessage({
        text: `Order #${result.orderId} placed${tradeCount > 0 ? ` — ${tradeCount} trade(s)` : ''}`,
        isError: false,
      });
      setPrice('');
      setQuantity('');
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to submit order',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-white">Place Order</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Side Toggle */}
        <div className="grid grid-cols-2 gap-1 bg-[var(--color-surface-light)] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setSide('Buy')}
            className={`py-2 rounded-md text-sm font-semibold transition-colors ${
              side === 'Buy'
                ? 'bg-[var(--color-bid)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide('Sell')}
            className={`py-2 rounded-md text-sm font-semibold transition-colors ${
              side === 'Sell'
                ? 'bg-[var(--color-ask)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            Type
          </label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-surface-lighter)]"
          >
            <option value="GoodTillCancel">Good Till Cancel</option>
            <option value="FillAndKill">Fill And Kill</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            Price
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            required
            min="1"
            className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-white placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-surface-lighter)]"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            required
            min="1"
            className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-white placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-surface-lighter)]"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors ${
            side === 'Buy'
              ? 'bg-[var(--color-bid)] hover:bg-green-600'
              : 'bg-[var(--color-ask)] hover:bg-red-600'
          } text-white disabled:opacity-50`}
        >
          {loading ? 'Submitting...' : `${side.toUpperCase()} ORDER`}
        </button>

        {/* Status Message */}
        {message && (
          <div
            className={`text-xs text-center py-1 ${
              message.isError ? 'text-[var(--color-ask)]' : 'text-[var(--color-bid)]'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
