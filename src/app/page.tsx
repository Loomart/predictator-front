import Link from "next/link";
import { getMarkets } from "@/lib/api";

export default async function HomePage() {
  const markets = await getMarkets();

  return (
    <main className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Prediction Markets Dashboard
          </h1>
          <p className="text-sm text-green-300 mt-2">
            Mercados cargados desde FastAPI + Supabase
          </p>
        </header>

        {markets.length === 0 ? (
          <div className="border border-green-700 rounded-lg p-6">
            <p>No hay mercados todavía.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {markets.map((market) => (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="border border-green-700 rounded-lg p-5 bg-black/40 block hover:bg-green-950/20 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{market.title}</h2>
                    <p className="text-sm text-green-300 mt-1">
                      Plataforma: {market.platform}
                    </p>
                    <p className="text-sm text-green-300">
                      Categoría: {market.category ?? "N/A"}
                    </p>
                    <p className="text-sm text-green-300">
                      Estado: {market.status}
                    </p>
                    <p className="text-sm text-green-300">
                      Resolution date: {market.resolution_date ?? "N/A"}
                    </p>
                  </div>

                  <div className="text-right text-sm text-green-300">
                    <p>ID interno: {market.id}</p>
                    <p>External ID: {market.external_id}</p>
                    <p className="mt-3 underline">Ver detalle</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}