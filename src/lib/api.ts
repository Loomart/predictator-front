function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada");
  }
  return apiUrl;
}

export type Market = {
  id: number;
  external_id: string;
  platform: string;
  title: string;
  slug: string | null;
  category: string | null;
  status: string;
  resolution_date: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketSnapshot = {
  id: number;
  market_id: number;
  yes_price: number | null;
  no_price: number | null;
  spread: number | null;
  volume_24h: number | null;
  liquidity: number | null;
  best_bid: number | null;
  best_ask: number | null;
  captured_at: string;
  created_at: string;
};

export type Signal = {
  id: number;
  market_id: number;
  signal_type: string;
  strategy_name: string;
  confidence: number | null;
  edge_estimate: number | null;
  status: string | null;
  direction: string | null;
  reference_price: number | null;
  reference_spread: number | null;
  reference_liquidity: number | null;
  confirmation_score: number;
  last_evaluated_at: string | null;
  confirmation_deadline: string | null;
  reason: string | null;
  is_executed: boolean;
  created_at: string;
};

export type MarketDetail = Market & {
  snapshots: MarketSnapshot[];
  signals: Signal[];
};

function debugEnter(method: string, meta?: string): number {
  const startedAt = Date.now();
  console.debug(`[api] -> ${method}${meta ? ` ${meta}` : ""}`);
  return startedAt;
}

function debugExit(method: string, startedAt: number, meta?: string): void {
  const elapsedMs = Date.now() - startedAt;
  console.debug(`[api] <- ${method}${meta ? ` ${meta}` : ""} (${elapsedMs}ms)`);
}

export async function getMarkets(): Promise<Market[]> {
  const startedAt = debugEnter("getMarkets");
  try {
    const response = await fetch(`${getApiUrl()}/markets`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Error cargando mercados: ${response.status}`);
    }
    const data = (await response.json()) as Market[];
    debugExit("getMarkets", startedAt, `status=${response.status}`);
    return data;
  } catch (error) {
    debugExit("getMarkets", startedAt, "error");
    throw error;
  }
}

export async function getMarketById(id: string): Promise<MarketDetail> {
  const startedAt = debugEnter("getMarketById", `id=${id}`);
  try {
    const response = await fetch(`${getApiUrl()}/markets/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Error cargando mercado ${id}: ${response.status}`);
    }
    const data = (await response.json()) as MarketDetail;
    debugExit("getMarketById", startedAt, `status=${response.status}`);
    return data;
  } catch (error) {
    debugExit("getMarketById", startedAt, "error");
    throw error;
  }
}

export async function getSnapshots(): Promise<MarketSnapshot[]> {
  const startedAt = debugEnter("getSnapshots");
  try {
    const response = await fetch(`${getApiUrl()}/snapshots`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Error cargando snapshots: ${response.status}`);
    }
    const data = (await response.json()) as MarketSnapshot[];
    debugExit("getSnapshots", startedAt, `status=${response.status}`);
    return data;
  } catch (error) {
    debugExit("getSnapshots", startedAt, "error");
    throw error;
  }
}

export async function getSignals(): Promise<Signal[]> {
  const startedAt = debugEnter("getSignals");
  try {
    const response = await fetch(`${getApiUrl()}/signals`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Error cargando señales: ${response.status}`);
    }
    const data = (await response.json()) as Signal[];
    debugExit("getSignals", startedAt, `status=${response.status}`);
    return data;
  } catch (error) {
    debugExit("getSignals", startedAt, "error");
    throw error;
  }
}

export async function deleteMarket(marketId: number): Promise<void> {
  const startedAt = debugEnter("deleteMarket", `id=${marketId}`);
  try {
    const response = await fetch(`${getApiUrl()}/markets/${marketId}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Error eliminando mercado ${marketId}: ${response.status}`);
    }
    debugExit("deleteMarket", startedAt, `status=${response.status}`);
  } catch (error) {
    debugExit("deleteMarket", startedAt, "error");
    throw error;
  }
}
