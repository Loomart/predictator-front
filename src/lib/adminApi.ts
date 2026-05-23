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

export type RuntimeSwitches = {
  filters: {
    market_category_allowlist: string[];
    market_title_include: string[];
    market_external_id_allowlist: string[];
  };
  scanner: {
    market_limit: number;
    min_history: number;
    wait_liquidity_threshold: number;
    wait_noise_threshold: number;
    wait_stability_threshold: number;
    strong_enter_score_threshold: number;
    strong_enter_momentum_threshold: number;
    strong_enter_change_threshold: number;
    enter_score_threshold: number;
    enter_momentum_threshold: number;
    enter_change_threshold: number;
    watch_score_threshold: number;
    watch_momentum_threshold: number;
    avoid_score_threshold: number;
  };
  risk?: {
    min_liquidity: number;
    max_spread: number;
    max_open_orders: number;
    max_open_orders_per_market: number;
    max_position_abs_per_market: number;
    max_total_abs_position: number;
    max_orders_per_day: number;
    max_traded_quantity_per_day: number;
    base_quantity: number;
    max_edge: number;
  };
};

function debugEnter(method: string, meta?: string): number {
  const startedAt = Date.now();
  console.debug(`[adminApi] -> ${method}${meta ? ` ${meta}` : ""}`);
  return startedAt;
}

function debugExit(method: string, startedAt: number, meta?: string): void {
  const elapsedMs = Date.now() - startedAt;
  console.debug(`[adminApi] <- ${method}${meta ? ` ${meta}` : ""} (${elapsedMs}ms)`);
}

function toApiError(status: number, detail?: string): Error {
  if (detail) {
    return new Error(`HTTP ${status}: ${detail}`);
  }
  return new Error(`HTTP ${status}`);
}

function buildAdminHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  const key = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  const headerName = process.env.NEXT_PUBLIC_ADMIN_API_KEY_HEADER || "X-Admin-API-Key";
  if (key && key.trim().length > 0) {
    merged.set(headerName, key.trim());
  }
  return merged;
}

function withAdminAuth(init?: RequestInit): RequestInit {
  return {
    ...(init || {}),
    headers: buildAdminHeaders(init?.headers),
  };
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  const body = await response.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const detail = (body as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail : undefined;
}

async function requestJson<T>(methodName: string, url: string, init?: RequestInit): Promise<T> {
  const startedAt = debugEnter(methodName, url);
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const detail = await readErrorDetail(response);
      throw toApiError(response.status, detail);
    }
    const data = (await response.json()) as T;
    debugExit(methodName, startedAt, `status=${response.status}`);
    return data;
  } catch (error) {
    debugExit(methodName, startedAt, "error");
    throw error;
  }
}

async function requestVoid(methodName: string, url: string, init?: RequestInit): Promise<void> {
  const startedAt = debugEnter(methodName, url);
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const detail = await readErrorDetail(response);
      throw toApiError(response.status, detail);
    }
    debugExit(methodName, startedAt, `status=${response.status}`);
  } catch (error) {
    debugExit(methodName, startedAt, "error");
    throw error;
  }
}

function ensureApiUrl(apiUrl: string | undefined): string {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada");
  }
  return apiUrl;
}

export async function postAdminAction(apiUrl: string | undefined, endpoint: string): Promise<ActionResponse> {
  const base = ensureApiUrl(apiUrl);
  return requestJson<ActionResponse>(`postAdminAction(${endpoint})`, `${base}/admin/${endpoint}`, withAdminAuth({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }));
}

export async function postAdminActionWithParams(
  apiUrl: string | undefined,
  endpoint: string,
  params: Record<string, string | number | undefined>,
): Promise<ActionResponse> {
  const base = ensureApiUrl(apiUrl);
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";
  return requestJson<ActionResponse>(`postAdminActionWithParams(${endpoint})`, `${base}/admin/${endpoint}${suffix}`, withAdminAuth({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }));
}

export async function fetchTradingView(apiUrl: string | undefined): Promise<TradingViewData> {
  const base = ensureApiUrl(apiUrl);
  const [statusRes, execRes, circuitRes, summaryRes, ordersRes, positionsRes, positionsDetailRes] = await Promise.all([
    fetch(`${base}/admin/trading/status`, withAdminAuth({ cache: "no-store" })),
    fetch(`${base}/admin/execution/status`, withAdminAuth({ cache: "no-store" })),
    fetch(`${base}/admin/execution/circuit-breaker`, withAdminAuth({ cache: "no-store" })),
    fetch(`${base}/admin/trading/summary`, withAdminAuth({ cache: "no-store" })),
    fetch(`${base}/orders`, { cache: "no-store" }),
    fetch(`${base}/positions`, { cache: "no-store" }),
    fetch(`${base}/admin/trading/positions`, withAdminAuth({ cache: "no-store" })),
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
  await requestVoid(
    "setTradingEnabled",
    `${base}/admin/trading/${enabled ? "enable" : "disable"}`,
    withAdminAuth({ method: "POST" }),
  );
}

export async function resetExecutionCircuit(apiUrl: string | undefined): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await requestVoid(
    "resetExecutionCircuit",
    `${base}/admin/execution/circuit-breaker/reset`,
    withAdminAuth({ method: "POST" }),
  );
}

export async function startScheduler(apiUrl: string | undefined): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await requestVoid("startScheduler", `${base}/admin/scheduler/start`, withAdminAuth({ method: "POST" }));
}

export async function stopScheduler(apiUrl: string | undefined): Promise<void> {
  const base = ensureApiUrl(apiUrl);
  await requestVoid("stopScheduler", `${base}/admin/scheduler/stop`, withAdminAuth({ method: "POST" }));
}

export async function fetchSchedulerStatus(apiUrl: string | undefined): Promise<SchedulerStatus> {
  const base = ensureApiUrl(apiUrl);
  return requestJson<SchedulerStatus>(
    "fetchSchedulerStatus",
    `${base}/admin/scheduler/status`,
    withAdminAuth({ cache: "no-store" }),
  );
}

export async function fetchRuntimeSwitches(apiUrl: string | undefined): Promise<RuntimeSwitches> {
  const base = ensureApiUrl(apiUrl);
  return requestJson<RuntimeSwitches>(
    "fetchRuntimeSwitches",
    `${base}/admin/runtime-switches`,
    withAdminAuth({ cache: "no-store" }),
  );
}
