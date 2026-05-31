import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";

import { MarketDetailView } from "./MarketDetailView";
import type { MarketDetail } from "@/lib/api";

vi.mock("next/link", () => {
  type LinkProps = ComponentProps<"a"> & { href: string; children: ReactNode };
  return {
    default: ({ href, children, ...props }: LinkProps) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});



describe("MarketDetailView", () => {
  it("muestra estados vacíos de snapshots y señales", () => {
    const market: MarketDetail = {
      id: 10,
      external_id: "ext-10",
      platform: "polymarket",
      title: "M10",
      slug: null,
      category: null,
      status: "open",
      resolution_date: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      snapshots: [],
      signals: [],
    };

    render(
      <MarketDetailView market={market} />,
    );

    expect(screen.getByText("No hay snapshots.")).toBeTruthy();
    expect(screen.getByText("No hay señales.")).toBeTruthy();
  });

  it("renderiza snapshot y señal", () => {
    const market: MarketDetail = {
      id: 11,
      external_id: "ext-11",
      platform: "polymarket",
      title: "M11",
      slug: null,
      category: null,
      status: "open",
      resolution_date: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      snapshots: [
        {
          id: 1,
          market_id: 11,
          yes_price: 0.6,
          no_price: 0.4,
          spread: 0.02,
          volume_24h: 1000,
          liquidity: 2000,
          best_bid: 0.59,
          best_ask: 0.61,
          captured_at: "2026-01-01",
          created_at: "2026-01-01",
        },
      ],
      signals: [
        {
          id: 2,
          market_id: 11,
          signal_type: "WATCH",
          strategy_name: "alpha_scoring_v2",
          confidence: 0.5,
          edge_estimate: 0.01,
          status: "CONFIRMING",
          direction: "UP",
          reference_price: 0.6,
          reference_spread: 0.02,
          reference_liquidity: 2000,
          confirmation_score: 0.44,
          last_evaluated_at: null,
          confirmation_deadline: null,
          reason: "{}",
          is_executed: false,
          created_at: "2026-01-01",
        },
      ],
    };

    render(
      <MarketDetailView market={market} />,
    );

    expect(screen.getByText("Yes price:")).toBeTruthy();
    expect(screen.getByText("Signal type:")).toBeTruthy();
  });
});
