const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurada");
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
  reason: string | null;
  is_executed: boolean;
  created_at: string;
};

export type MarketDetail = Market & {
  snapshots: MarketSnapshot[];
  signals: Signal[];
};

export async function getMarkets(): Promise<Market[]> {
  const response = await fetch(`${API_URL}/markets`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error cargando mercados: ${response.status}`);
  }

  return response.json();
}

export async function getMarketById(id: string): Promise<MarketDetail> {
  const response = await fetch(`${API_URL}/markets/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error cargando mercado ${id}: ${response.status}`);
  }

  return response.json();
}