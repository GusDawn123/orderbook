import { useState, useEffect, useCallback } from 'react';
import {
  getSimulatorStatus,
  startSimulator,
  stopSimulator,
  updateSimulatorConfig,
  type SimulatorStatus,
} from '../services/api';

export function SimulatorPanel() {
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const [tickRateMs, setTickRateMs] = useState(500);
  const [volatility, setVolatility] = useState(0.3);
  const [aggressiveness, setAggressiveness] = useState(0.15);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getSimulatorStatus();
      setStatus(data);
    } catch { /* server not ready */ }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!status?.running) return;
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [status?.running, fetchStatus]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (status?.running) {
        const data = await stopSimulator();
        setStatus(data);
      } else {
        await updateSimulatorConfig({ tickRateMs, volatility, aggressiveness });
        const data = await startSimulator();
        setStatus(data);
      }
    } catch { /* error */ }
    setLoading(false);
  };

  const handleConfigChange = async (key: string, value: number) => {
    if (key === 'tickRateMs') setTickRateMs(value);
    if (key === 'volatility') setVolatility(value);
    if (key === 'aggressiveness') setAggressiveness(value);

    if (status?.running) {
      try {
        const data = await updateSimulatorConfig({ [key]: value });
        setStatus(data);
      } catch { /* error */ }
    }
  };

  const isRunning = status?.running ?? false;

  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-surface-light)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Market Simulator</h2>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              isRunning
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Start / Stop */}
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${
              isRunning
                ? 'bg-[var(--color-ask)] hover:bg-red-600 text-white'
                : 'bg-[var(--color-bid)] hover:bg-green-600 text-white'
            }`}
          >
            {loading ? 'Working...' : isRunning ? 'STOP SIMULATOR' : 'START SIMULATOR'}
          </button>

          {/* Sliders */}
          <div className="space-y-3">
            <SliderControl
              label="Speed"
              value={tickRateMs}
              min={100}
              max={2000}
              step={100}
              displayValue={tickRateMs <= 200 ? 'Fast' : tickRateMs <= 700 ? 'Normal' : 'Slow'}
              onChange={(v) => handleConfigChange('tickRateMs', v)}
              invert
            />
            <SliderControl
              label="Volatility"
              value={volatility}
              min={0}
              max={1}
              step={0.05}
              displayValue={`${Math.round(volatility * 100)}%`}
              onChange={(v) => handleConfigChange('volatility', v)}
            />
            <SliderControl
              label="Aggressiveness"
              value={aggressiveness}
              min={0}
              max={1}
              step={0.05}
              displayValue={`${Math.round(aggressiveness * 100)}%`}
              onChange={(v) => handleConfigChange('aggressiveness', v)}
            />
          </div>

          {/* Live Stats */}
          {isRunning && status && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--color-border)]">
              <StatBox label="Mid Price" value={status.stats.currentMidPrice.toLocaleString()} />
              <StatBox label="Ticks" value={status.stats.tickCount.toLocaleString()} />
              <StatBox label="Orders" value={status.stats.trackedOrders.toString()} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  invert,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
  invert?: boolean;
}) {
  const sliderValue = invert ? max + min - value : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    onChange(invert ? max + min - raw : raw);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-xs font-mono text-white">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={handleChange}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--color-surface-light)] accent-[var(--color-surface-lighter)]"
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[var(--color-text-secondary)]">{label}</div>
      <div className="text-sm font-mono text-white">{value}</div>
    </div>
  );
}
