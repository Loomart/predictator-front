import { getMarkets, getSignals, getSnapshots } from "@/lib/api";
import { MarketsListView } from "@/components/MarketsListView";

export default async function HomePage() {
  const [markets, snapshots, signals] = await Promise.all([
    getMarkets(),
    getSnapshots(),
    getSignals(),
  ]);

  return <MarketsListView markets={markets} snapshots={snapshots} signals={signals} />;
}
