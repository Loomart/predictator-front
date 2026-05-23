'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchRuntimeSwitches,
  fetchSchedulerStatus,
  fetchTradingView,
  postAdminAction,
  postAdminActionWithParams,
  resetExecutionCircuit,
  startScheduler,
  setTradingEnabled as setTradingEnabledRemote,
  stopScheduler,
  type CircuitBreakerStatus,
  type ExecutionStatus,
  type Order,
  type Position,
  type PositionDetail,
  type RuntimeSwitches,
  type TradingSummary,
} from '@/lib/adminApi';

export default function AdminPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'actions' | 'config' | 'positions'>('overview');
  const [summary, setSummary] = useState<TradingSummary | null>(null);
  const [tradingEnabled, setTradingEnabled] = useState<boolean | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [circuit, setCircuit] = useState<CircuitBreakerStatus | null>(null);
  const [schedulerRunning, setSchedulerRunning] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionDetails, setPositionDetails] = useState<PositionDetail[]>([]);
  const [runtimeSwitches, setRuntimeSwitches] = useState<RuntimeSwitches | null>(null);
  const [config, setConfig] = useState({
    category: '',
    titleContains: '',
    externalIds: '',
    marketLimit: '',
    minHistory: '',
    waitLiquidity: '',
    waitNoise: '',
    waitStability: '',
    strongEnterScore: '',
    strongEnterMomentum: '',
    strongEnterChange: '',
    enterScore: '',
    enterMomentum: '',
    enterChange: '',
    watchScore: '',
    watchMomentum: '',
    avoidScore: '',
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  async function runSchedulerStart() {
    await startScheduler(API);
  }

  async function runSchedulerStop() {
    await stopScheduler(API);
  }

  async function getSchedulerStatus() {
    const data = await fetchSchedulerStatus(API);
    setSchedulerRunning(Boolean(data.running));
  }

  async function refreshRuntimeSwitches() {
    if (!API) return;
    const data = await fetchRuntimeSwitches(API);
    setRuntimeSwitches(data);
    setConfig({
      category: data.filters.market_category_allowlist.join(','),
      titleContains: data.filters.market_title_include.join(','),
      externalIds: data.filters.market_external_id_allowlist.join(','),
      marketLimit: String(data.scanner.market_limit),
      minHistory: String(data.scanner.min_history),
      waitLiquidity: String(data.scanner.wait_liquidity_threshold),
      waitNoise: String(data.scanner.wait_noise_threshold),
      waitStability: String(data.scanner.wait_stability_threshold),
      strongEnterScore: String(data.scanner.strong_enter_score_threshold),
      strongEnterMomentum: String(data.scanner.strong_enter_momentum_threshold),
      strongEnterChange: String(data.scanner.strong_enter_change_threshold),
      enterScore: String(data.scanner.enter_score_threshold),
      enterMomentum: String(data.scanner.enter_momentum_threshold),
      enterChange: String(data.scanner.enter_change_threshold),
      watchScore: String(data.scanner.watch_score_threshold),
      watchMomentum: String(data.scanner.watch_momentum_threshold),
      avoidScore: String(data.scanner.avoid_score_threshold),
    });
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
      const data = await postAdminAction(API, endpoint);
      setMessage(`✅ ${data.action.toUpperCase()}: ${data.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const withConfigParams = useMemo(() => {
    return {
      category: config.category,
      title_contains: config.titleContains,
      external_ids: config.externalIds,
      market_limit: config.marketLimit,
      min_history: config.minHistory,
      wait_liquidity_threshold: config.waitLiquidity,
      wait_noise_threshold: config.waitNoise,
      wait_stability_threshold: config.waitStability,
      strong_enter_score_threshold: config.strongEnterScore,
      strong_enter_momentum_threshold: config.strongEnterMomentum,
      strong_enter_change_threshold: config.strongEnterChange,
      enter_score_threshold: config.enterScore,
      enter_momentum_threshold: config.enterMomentum,
      enter_change_threshold: config.enterChange,
      watch_score_threshold: config.watchScore,
      watch_momentum_threshold: config.watchMomentum,
      avoid_score_threshold: config.avoidScore,
    };
  }, [config]);

  const runActionWithConfig = async (endpoint: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const data = await postAdminActionWithParams(API, endpoint, withConfigParams);
      setMessage(`✅ ${data.action.toUpperCase()}: ${data.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        if (!API) {
          setMessage('❌ NEXT_PUBLIC_API_URL no está configurada');
          return;
        }
        await Promise.all([refreshTrading(), getSchedulerStatus(), refreshRuntimeSwitches()]);
      } catch (error) {
        setMessage(`❌ Error inicializando dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const kpis = [
    { label: 'Trading', value: tradingEnabled === null ? '—' : tradingEnabled ? 'ON' : 'OFF' },
    { label: 'Scheduler', value: schedulerRunning === null ? '—' : schedulerRunning ? 'RUNNING' : 'STOPPED' },
    { label: 'Orders', value: summary ? String(summary.orders.total) : '—' },
    { label: 'Positions', value: summary ? String(summary.positions.count) : '—' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h1 className="mb-4 text-lg font-semibold">Admin Dashboard</h1>
          <div className="space-y-2">
            {[
              { id: 'overview' as const, label: 'Overview', hint: 'Estado general del sistema' },
              { id: 'actions' as const, label: 'Acciones', hint: 'Ejecuciones manuales del backend' },
              { id: 'config' as const, label: 'Configuración', hint: 'Switches rápidos del scanner' },
              { id: 'positions' as const, label: 'Trading', hint: 'Órdenes y posiciones recientes' },
            ].map((item) => (
              <button
                key={item.id}
                title={item.hint}
                onClick={() => setActiveSection(item.id)}
                className={`group relative w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeSection === item.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.label}
                <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 hidden -translate-y-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-slate-200 group-hover:block">
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-2xl font-semibold tracking-tight">Panel de Control</h2>
            <p className="mt-1 text-sm text-slate-400">
              Modo oscuro, acciones rápidas y configuración operativa en una sola pantalla.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</div>
                  <div className="mt-1 text-lg font-semibold text-cyan-200">{kpi.value}</div>
                </div>
              ))}
            </div>
          </header>

          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm">
                <div className="mb-2 font-semibold text-slate-200">Estado de ejecución</div>
                <div className="space-y-1 text-slate-300">
                  <div>Trading: {tradingEnabled === null ? '—' : tradingEnabled ? 'HABILITADO' : 'DESHABILITADO'}</div>
                  <div>Scheduler: {schedulerRunning === null ? '—' : schedulerRunning ? 'ACTIVO' : 'PARADO'}</div>
                  <div>Mode: {executionStatus?.mode ?? '—'}</div>
                  <div>Circuit: {circuit ? (circuit.is_open ? `OPEN (${circuit.failure_count})` : 'CLOSED') : '—'}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm">
                <div className="mb-2 font-semibold text-slate-200">Resumen de trading</div>
                <div className="space-y-1 text-slate-300">
                  <div>Total órdenes: {summary?.orders.total ?? '—'}</div>
                  <div>Órdenes abiertas: {summary?.orders.open ?? '—'}</div>
                  <div>Órdenes filled: {summary?.orders.filled ?? '—'}</div>
                  <div>Posiciones: {summary?.positions.count ?? '—'}</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'actions' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 text-sm text-slate-400">Pasa el ratón encima para ver descripción.</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {[
                  { label: 'Run Sync', hint: 'Sincroniza mercados aplicando filtros', onClick: () => runActionWithConfig('run-sync') },
                  { label: 'Run Scanner', hint: 'Ejecuta scanner con thresholds activos', onClick: () => runActionWithConfig('run-scanner') },
                  { label: 'Run Pipeline', hint: 'Sync + Scanner + Confirmaciones + Ejecución', onClick: () => runActionWithConfig('run-pipeline') },
                  { label: 'Confirmations', hint: 'Procesa confirmaciones pendientes', onClick: () => runAction('run-confirmations') },
                  { label: 'Trading Step', hint: 'Ejecuta un paso de trading', onClick: () => runAction('run-trading-step') },
                  { label: 'Reconcile', hint: 'Reconstruye posiciones desde fills', onClick: () => runAction('trading/reconcile') },
                  { label: 'Start Scheduler', hint: 'Inicia scheduler automático', onClick: runSchedulerStart },
                  { label: 'Stop Scheduler', hint: 'Detiene scheduler automático', onClick: runSchedulerStop },
                  { label: 'Refresh Data', hint: 'Actualiza estado y resumen', onClick: async () => { await refreshTrading(); await getSchedulerStatus(); } },
                  { label: 'Reset Circuit', hint: 'Resetea circuit breaker de ejecución', onClick: resetCircuitBreaker },
                  { label: 'Trading ON', hint: 'Habilita ejecución de trading', onClick: () => setTradingStatus(true) },
                  { label: 'Trading OFF', hint: 'Deshabilita ejecución de trading', onClick: () => setTradingStatus(false) },
                ].map((action) => (
                  <button
                    key={action.label}
                    title={action.hint}
                    onClick={action.onClick}
                    disabled={isLoading}
                    className="group relative rounded-xl border border-slate-700 bg-slate-800 px-3 py-4 text-sm font-medium text-slate-100 transition hover:border-cyan-500/60 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {action.label}
                    <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden -translate-x-1/2 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 group-hover:block">
                      {action.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'config' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Configuración de ejecución</h3>
                <button
                  onClick={refreshRuntimeSwitches}
                  disabled={isLoading}
                  className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
                >
                  Recargar desde runtime
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  ['category', 'Categorías (csv)', 'crypto,politics'],
                  ['titleContains', 'Title contains (csv)', 'bitcoin,ethereum'],
                  ['externalIds', 'External IDs (csv)', '123,456'],
                  ['marketLimit', 'Market limit', '25'],
                  ['minHistory', 'Min history', '3'],
                  ['waitLiquidity', 'Wait liquidity', '0.20'],
                  ['waitNoise', 'Wait noise', '0.18'],
                  ['waitStability', 'Wait stability', '0.25'],
                  ['strongEnterScore', 'Strong enter score', '0.75'],
                  ['strongEnterMomentum', 'Strong enter momentum', '0.55'],
                  ['strongEnterChange', 'Strong enter change', '0.02'],
                  ['enterScore', 'Enter score', '0.60'],
                  ['enterMomentum', 'Enter momentum', '0.45'],
                  ['enterChange', 'Enter change', '0.015'],
                  ['watchScore', 'Watch score', '0.55'],
                  ['watchMomentum', 'Watch momentum', '0.30'],
                  ['avoidScore', 'Avoid score', '0.45'],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs text-slate-400">{label}</span>
                    <input
                      value={config[key as keyof typeof config]}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={placeholder}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Estos valores se aplican al ejecutar acciones desde esta pantalla. Runtime actual cargado: {runtimeSwitches ? 'sí' : 'no'}.
              </p>
            </div>
          )}

          {activeSection === 'positions' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="mb-2 font-semibold">Últimas órdenes</div>
                <div className="max-h-72 space-y-1 overflow-auto text-xs text-slate-300">
                  {orders.slice(0, 20).map((o) => (
                    <div key={o.id} className="grid grid-cols-4 gap-2 rounded bg-slate-950/60 px-2 py-1">
                      <span>#{o.id}</span>
                      <span>{o.side}</span>
                      <span>qty {o.quantity}</span>
                      <span>{o.status}</span>
                    </div>
                  ))}
                  {orders.length === 0 && <div className="text-slate-500">Sin órdenes</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="mb-2 font-semibold">PnL por posición</div>
                <div className="max-h-72 space-y-1 overflow-auto text-xs text-slate-300">
                  {positionDetails.slice(0, 20).map((p) => (
                    <div key={p.market_id} className="grid grid-cols-5 gap-2 rounded bg-slate-950/60 px-2 py-1">
                      <span>m{p.market_id}</span>
                      <span>q {p.quantity}</span>
                      <span>mark {p.mark_price ?? '—'}</span>
                      <span>u {p.unrealized_pnl ?? '—'}</span>
                      <span>r {p.realized_pnl}</span>
                    </div>
                  ))}
                  {positionDetails.length === 0 && <div className="text-slate-500">Sin datos</div>}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-cyan-700/40 bg-cyan-900/20 p-3 text-sm" role="status" aria-live="polite">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
