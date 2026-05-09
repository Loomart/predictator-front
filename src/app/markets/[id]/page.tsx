import { getMarketById } from "@/lib/api";
import { MarketDetailView } from "@/components/MarketDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const market = await getMarketById(id);

  return <MarketDetailView market={market} />;
}
