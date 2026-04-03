import { Header } from './components/Header';
import { OrderBookView } from './components/OrderBookView';
import { OrderForm } from './components/OrderForm';
import { SimulatorPanel } from './components/SimulatorPanel';
import { TradeHistory } from './components/TradeHistory';
import { DepthChart } from './components/DepthChart';
import { useOrderBook } from './hooks/useOrderBook';

function App() {
  const { book, trades, connected, spread } = useOrderBook();

  return (
    <div className="min-h-screen flex flex-col">
      <Header connected={connected} />

      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left: Order Book + Depth Chart (spans 2 cols) */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <OrderBookView book={book} spread={spread} />
            <DepthChart book={book} />
          </div>

          {/* Middle: Simulator + Order Form */}
          <div className="space-y-4 lg:space-y-6">
            <SimulatorPanel />
            <OrderForm />
          </div>

          {/* Right: Trade History */}
          <div>
            <TradeHistory trades={trades} />
          </div>
        </div>
      </main>

      <footer className="px-6 py-3 text-center text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-border)]">
        Built by Gustavo Rosas — C++ Matching Engine / Node.js / React / PostgreSQL
      </footer>
    </div>
  );
}

export default App;
