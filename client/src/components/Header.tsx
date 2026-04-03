interface HeaderProps {
  connected: boolean;
}

export function Header({ connected }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Order Book Engine
        </h1>
        <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-light)] px-2 py-0.5 rounded">
          C++ / React
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          by Gustavo Rosas
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-[var(--color-bid)] animate-pulse' : 'bg-[var(--color-ask)]'
          }`}
        />
        <span className="text-[var(--color-text-secondary)]">
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
    </header>
  );
}
