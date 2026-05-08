export type ActionResponse = {
  status: string;
  action: string;
  message: string;
};

export type TradingSummary = {
  orders: {
    open: number;
    total: number;
    filled: number;
    rejected: number;
  };
  positions: {
    count: number;
    total_abs_quantity: number;
    total_realized_pnl: number;
  };
};

export type TradingStatus = {
  enabled: boolean;
};

export type ExecutionStatus = {
  mode: string;
  polymarket?: {
    enabled: boolean;
    ok: boolean;
    present: Record<string, boolean>;
  };
};

export type CircuitBreakerStatus = {
  is_open: boolean;
  failure_count: number;
  opened_until: string | null;
};

export type PositionDetail = {
  market_id: number;
  quantity: number;
  avg_price: number | null;
  mark_price: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number;
  updated_at: string | null;
};

export type Order = {
  id: number;
  signal_id: number;
  market_id: number;
  side: string;
  order_type: string;
  quantity: number;
  limit_price: number | null;
  status: string;
  created_at: string;
};

export type Position = {
  id: number;
  market_id: number;
  quantity: number;
  avg_price: number | null;
  realized_pnl: number;
  updated_at: string;
};

export type TradingViewData = {
  tradingEnabled: boolean | null;
  executionStatus: ExecutionStatus | null;
  circuit: CircuitBreakerStatus | null;
  summary: TradingSummary | null;
  orders: Order[];
  positions: Position[];
  positionDetails: PositionDetail[];
};

export type SchedulerStatus = {
  running: boolean;
};

function ensureApiUrl(apiUrl: string | undefined): string {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada");
  }
  return apiUrl;
}

export async function postAdminAction(apiUrl: string | undefined, endpoint: string): Promise<ActionResponse> {
  const base = ensureApiUrl(apiUrl);
  const response = await fetch(`${base}/admin/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchTradingView(apiUrl: string | undefined): Promise<TradingViewData> {
  const base = ensureApiUrl(apiUrl);
  const [statusRes, execRes, circuitRes, summaryRes, ordersRes, positionsRes, positionsDetailRes] = await Promise.all([
    fetch(`${base}/admin/trading/status`, { cache: "no-store" }),
    fetch(`${base}/admin/execution/status`, { cache: "no-store" }),
    fetch(`${base}/admin/execution/circuit-breaker`, { cache: "no-store" }),
    fetch(`${base}/admin/trading/summary`, { cache: "no-store" }),
    fetch(`${base}/orders`, { cache: "no-store" }),
    fetch(`${base}/positions`, { cache: "no-store" }),
    fetch(`${base}/admin/trading/positions`, { cache: "no-store" }),
  ]);

  let tradingEnabled: boolean | null = null;
  let executionStatus: ExecutionStatus | null = null;
  let circuit: CircuitBreakerStatus | null = null;
  let summary: TradingSummary | null = null;
  let orders: Order[] = [];
  let positions: Position[] = [];
  let positionDetails: PositionDetail[] = [];

  if (statusRes.ok) {
    const data: TradingStatus = await statusRes.json();
    tradingEnabled = data.enabled;
  }
  if (execRes.ok) {
    executionStatus = await execRes.json();
  }
  if (circuitRes.ok) {
    circuit = await circuitRes.json();
  }
  if (summaryRes.ok) {
    summary = await summaryRes.json();
  }
  if (ordersRes.ok) {
    orders = await ordersRes.json();
  }
  if (positionsRes.ok) {
    positions = await positionsRes.json();
  }
  if (positionsDetailRes.ok) {
    const data = await positionsDetailRes.json();
    positionDetails = data.positions || [];
  }

  return {
    tradingEnabled,
    executionStatus,
    circuit,
    summary,
    orders,
    positions,
    positionDetails,
  };
}

export async function setTradingEnabled(apiUrl: string | undefined, enabled: boolean): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await fetch(`${base}/admin/trading/${enabled ? "enable" : "disable"}`, { method: "POST" });
}

export async function resetExecutionCircuit(apiUrl: string | undefined): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await fetch(`${base}/admin/execution/circuit-breaker/reset`, { method: "POST" });
}

export async function startScheduler(apiUrl: string | undefined): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await fetch(`${base}/admin/scheduler/start`, { method: "POST" });
}

export async function stopScheduler(apiUrl: string | undefined): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await fetch(`${base}/admin/scheduler/stop`, { method: "POST" });
}

export async function fetchSchedulerStatus(apiUrl: string | undefined): Promise<SchedulerStatus> {
  const base = ensureApiUrl(apiUrl);
  const response = await fetch(`${base}/admin/scheduler/status`, { cache: "no-store" });
  return response.json();
}
