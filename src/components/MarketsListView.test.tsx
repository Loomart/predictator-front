import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";

import { MarketsListView } from "./MarketsListView";

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

describe("MarketsListView", () => {
  it("muestra estado vacío cuando no hay mercados", () => {
    render(<MarketsListView markets={[]} snapshots={[]} signals={[]} />);
    expect(screen.getByText("Sin resultados para el filtro actual.")).toBeTruthy();
  });

  it("renderiza mercado y link a detalle", () => {
    render(
      <MarketsListView
        markets={[
          {
            id: 1,
            external_id: "ext-1",
            platform: "polymarket",
            title: "Market 1",
            slug: null,
            category: null,
            status: "open",
            resolution_date: null,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ]}
        snapshots={[
          {
            id: 10,
            market_id: 1,
            yes_price: 0.61,
            no_price: 0.39,
            spread: 0.02,
            volume_24h: 1000,
            liquidity: 2000,
            best_bid: 0.60,
            best_ask: 0.62,
            captured_at: "2026-01-01",
            created_at: "2026-01-01",
          },
        ]}
        signals={[
          {
            id: 77,
            market_id: 1,
            signal_type: "ENTER",
            strategy_name: "alpha",
            confidence: 0.8,
            edge_estimate: 0.02,
            status: "CONFIRMED",
            direction: "UP",
            reference_price: 0.6,
            reference_spread: 0.02,
            reference_liquidity: 1000,
            confirmation_score: 0.9,
            last_evaluated_at: null,
            confirmation_deadline: null,
            reason: "{}",
            is_executed: false,
            created_at: "2026-01-01",
          },
        ]}
      />,
    );

    expect(screen.getByText("Market 1")).toBeTruthy();
    expect(screen.getByText("Entrar")).toBeTruthy();
    const link = screen.getByRole("link", { name: /ver detalle/i });
    expect(link.getAttribute("href")).toBe("/markets/1");
  });
});
