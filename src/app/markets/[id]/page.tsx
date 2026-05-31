import { getMarketById } from "@/lib/api";
import { MarketDetailView } from "@/components/MarketDetailView";

type PageProps = {
  params: { id: string };
};

export default async function MarketDetailPage({ params }: PageProps) {
  let market;
  try {
    const { id } = params;
    market = await getMarketById(id);
  } catch (error) {
    console.error('Error fetching market:', error);
    return <div>Error loading market</div>;
  }

  return <MarketDetailView market={market} />;
}
