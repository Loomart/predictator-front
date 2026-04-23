import Link from "next/link";
import { getMarketById } from "@/lib/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const market = await getMarketById(id);

  return (
    <main className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm underline text-green-300">
            ← Volver al dashboard
          </Link>
        </div>

        <section className="border border-green-700 rounded-lg p-6 mb-6 bg-black/40">
          <h1 className="text-3xl font-bold mb-4">{market.title}</h1>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-300">
            <p><strong>ID interno:</strong> {market.id}</p>
            <p><strong>External ID:</strong> {market.external_id}</p>
            <p><strong>Plataforma:</strong> {market.platform}</p>
            <p><strong>Categoría:</strong> {market.category ?? "N/A"}</p>
            <p><strong>Estado:</strong> {market.status}</p>
            <p><strong>Slug:</strong> {market.slug ?? "N/A"}</p>
            <p><strong>Resolution date:</strong> {market.resolution_date ?? "N/A"}</p>
            <p><strong>Created at:</strong> {market.created_at}</p>
          </div>
        </section>

        <section className="border border-green-700 rounded-lg p-6 mb-6 bg-black/40">
          <h2 className="text-2xl font-semibold mb-4">Snapshots</h2>

          {market.snapshots.length === 0 ? (
            <p className="text-green-300">No hay snapshots.</p>
          ) : (
            <div className="space-y-4">
              {market.snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="border border-green-800 rounded-lg p-4"
                >
                  <div className="grid md:grid-cols-2 gap-3 text-sm text-green-300">
                    <p><strong>ID:</strong> {snapshot.id}</p>
                    <p><strong>Market ID:</strong> {snapshot.market_id}</p>
                    <p><strong>Yes price:</strong> {snapshot.yes_price ?? "N/A"}</p>
                    <p><strong>No price:</strong> {snapshot.no_price ?? "N/A"}</p>
                    <p><strong>Spread:</strong> {snapshot.spread ?? "N/A"}</p>
                    <p><strong>Volume 24h:</strong> {snapshot.volume_24h ?? "N/A"}</p>
                    <p><strong>Liquidity:</strong> {snapshot.liquidity ?? "N/A"}</p>
                    <p><strong>Best bid:</strong> {snapshot.best_bid ?? "N/A"}</p>
                    <p><strong>Best ask:</strong> {snapshot.best_ask ?? "N/A"}</p>
                    <p><strong>Captured at:</strong> {snapshot.captured_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-green-700 rounded-lg p-6 bg-black/40">
          <h2 className="text-2xl font-semibold mb-4">Signals</h2>

          {market.signals.length === 0 ? (
            <p className="text-green-300">No hay señales.</p>
          ) : (
            <div className="space-y-4">
              {market.signals.map((signal) => (
                <div
                  key={signal.id}
                  className="border border-green-800 rounded-lg p-4"
                >
                  <div className="grid md:grid-cols-2 gap-3 text-sm text-green-300">
                    <p><strong>ID:</strong> {signal.id}</p>
                    <p><strong>Signal type:</strong> {signal.signal_type}</p>
                    <p><strong>Strategy:</strong> {signal.strategy_name}</p>
                    <p><strong>Confidence:</strong> {signal.confidence ?? "N/A"}</p>
                    <p><strong>Edge estimate:</strong> {signal.edge_estimate ?? "N/A"}</p>
                    <p><strong>Executed:</strong> {signal.is_executed ? "Sí" : "No"}</p>
                    <p className="md:col-span-2">
                      <strong>Reason:</strong> {signal.reason ?? "N/A"}
                    </p>
                    <p><strong>Created at:</strong> {signal.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}