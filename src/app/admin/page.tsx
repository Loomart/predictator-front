'use client';

import { useState } from 'react';
import {
  fetchSchedulerStatus,
  fetchTradingView,
  postAdminAction,
  resetExecutionCircuit,
  startScheduler,
  setTradingEnabled as setTradingEnabledRemote,
  stopScheduler,
  type CircuitBreakerStatus,
  type ExecutionStatus,
  type Order,
  type Position,
  type PositionDetail,
  type TradingSummary,
} from '@/lib/adminApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurada");
}

export default function AdminPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<TradingSummary | null>(null);
  const [tradingEnabled, setTradingEnabled] = useState<boolean | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [circuit, setCircuit] = useState<CircuitBreakerStatus | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionDetails, setPositionDetails] = useState<PositionDetail[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL;

  async function runSchedulerStart() {
    await startScheduler(API);
  }

  async function runSchedulerStop() {
    await stopScheduler(API);
  }

  async function getSchedulerStatus() {
    const data = await fetchSchedulerStatus(API);
    console.log(data);
  }

  async function refreshTrading() {
    if (!API) return;
    const view = await fetchTradingView(API);
    setTradingEnabled(view.tradingEnabled);
    setExecutionStatus(view.executionStatus);
    setCircuit(view.circuit);
    setSummary(view.summary);
    setOrders(view.orders);
    setPositions(view.positions);
    setPositionDetails(view.positionDetails);
  }

  async function setTradingStatus(enabled: boolean) {
    if (!API) return;
    await setTradingEnabledRemote(API, enabled);
    await refreshTrading();
  }

  async function resetCircuitBreaker() {
    if (!API) return;
    await resetExecutionCircuit(API);
    await refreshTrading();
  }

  const runAction = async (endpoint: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const data = await postAdminAction(API_URL, endpoint);
      setMessage(`✅ ${data.action.toUpperCase()}: ${data.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Admin Panel
          </h1>
          <p className="text-sm text-green-300 mt-2">
            Ejecutar acciones del backend manualmente
          </p>
        </header>

        <div className="space-y-4">
          <button
            onClick={() => runAction('run-sync')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Sync'}
          </button>

          <button
            onClick={() => runAction('run-scanner')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Scanner'}
          </button>

          <button
            onClick={() => runAction('run-pipeline')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Pipeline'}
          </button>

          <button
            onClick={() => runAction('run-confirmations')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Confirmations'}
          </button>

          <button
            onClick={() => runAction('run-trading-step')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Trading Step'}
          </button>

          <button
            onClick={() => runAction('trading/reconcile')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Reconcile Positions'}
          </button>
          <button 
            onClick={runSchedulerStart}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            Start Scheduler </button>
          <button 
            onClick={runSchedulerStop}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            Stop Scheduler</button>
          <button 
            onClick={getSchedulerStatus}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            Check Status</button>
        </div>

        {message && (
          <div className="mt-6 p-4 border border-green-700 rounded-lg bg-black/40">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={refreshTrading}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Refresh Trading View'}
          </button>

          <div className="p-4 border border-green-700 rounded-lg bg-black/40 text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                Trading enabled: {tradingEnabled === null ? '—' : tradingEnabled ? 'YES' : 'NO'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTradingStatus(true)}
                  disabled={isLoading}
                  className="bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-2 px-4 rounded border border-green-700"
                >
                  Enable
                </button>
                <button
                  onClick={() => setTradingStatus(false)}
                  disabled={isLoading}
                  className="bg-red-900 hover:bg-red-800 disabled:bg-gray-700 text-green-100 font-semibold py-2 px-4 rounded border border-red-700"
                >
                  Disable
                </button>
              </div>
            </div>
            <div className="text-xs text-green-300">También se puede forzar con `TRADING_ENABLED=false` en el backend.</div>
          </div>

          {executionStatus && (
            <div className="p-4 border border-green-700 rounded-lg bg-black/40 text-sm space-y-1">
              <div>Execution mode: {executionStatus.mode}</div>
              {executionStatus.mode === 'polymarket' && executionStatus.polymarket && (
                <div className="text-xs text-green-300">
                  Polymarket ok={executionStatus.polymarket.ok ? 'YES' : 'NO'} enabled={executionStatus.polymarket.enabled ? 'YES' : 'NO'}
                </div>
              )}
            </div>
          )}

          {circuit && (
            <div className="p-4 border border-green-700 rounded-lg bg-black/40 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  Circuit breaker: {circuit.is_open ? 'OPEN' : 'CLOSED'} (failures={circuit.failure_count})
                </div>
                <button
                  onClick={resetCircuitBreaker}
                  disabled={isLoading}
                  className="bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-2 px-4 rounded border border-green-700"
                >
                  Reset
                </button>
              </div>
              {circuit.opened_until && (
                <div className="text-xs text-green-300">Opened until: {circuit.opened_until}</div>
              )}
            </div>
          )}

          {summary && (
            <div className="p-4 border border-green-700 rounded-lg bg-black/40 text-sm space-y-1">
              <div>Orders: open={summary.orders.open} total={summary.orders.total} filled={summary.orders.filled} rejected={summary.orders.rejected}</div>
              <div>Positions: count={summary.positions.count} abs_qty={summary.positions.total_abs_quantity} realized_pnl={summary.positions.total_realized_pnl}</div>
            </div>
          )}

          <div className="p-4 border border-green-700 rounded-lg bg-black/40">
            <div className="text-sm font-semibold mb-2">Últimas órdenes</div>
            <div className="text-xs space-y-1">
              {orders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex justify-between gap-2">
                  <span>#{o.id} mkt={o.market_id} sig={o.signal_id}</span>
                  <span>{o.side} qty={o.quantity}</span>
                  <span>{o.status}</span>
                </div>
              ))}
              {orders.length === 0 && <div className="text-green-300">Sin órdenes</div>}
            </div>
          </div>

          <div className="p-4 border border-green-700 rounded-lg bg-black/40">
            <div className="text-sm font-semibold mb-2">Posiciones</div>
            <div className="text-xs space-y-1">
              {positions.slice(0, 10).map((p) => (
                <div key={p.id} className="flex justify-between gap-2">
                  <span>mkt={p.market_id}</span>
                  <span>qty={p.quantity}</span>
                  <span>avg={p.avg_price ?? '—'}</span>
                  <span>pnl={p.realized_pnl}</span>
                </div>
              ))}
              {positions.length === 0 && <div className="text-green-300">Sin posiciones</div>}
            </div>
          </div>

          <div className="p-4 border border-green-700 rounded-lg bg-black/40">
            <div className="text-sm font-semibold mb-2">PnL por posición (mark-to-market)</div>
            <div className="text-xs space-y-1">
              {positionDetails.slice(0, 10).map((p) => (
                <div key={p.market_id} className="flex justify-between gap-2">
                  <span>mkt={p.market_id}</span>
                  <span>qty={p.quantity}</span>
                  <span>mark={p.mark_price ?? '—'}</span>
                  <span>uPnL={p.unrealized_pnl ?? '—'}</span>
                  <span>rPnL={p.realized_pnl}</span>
                </div>
              ))}
              {positionDetails.length === 0 && <div className="text-green-300">Sin datos de PnL</div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
