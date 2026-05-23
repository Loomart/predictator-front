import { afterEach, describe, expect, it, vi } from "vitest";

function mockFetchSequence(values: Array<{ ok: boolean; status?: number; body?: unknown }>) {
  const fn = vi.fn();
  for (const v of values) {
    fn.mockResolvedValueOnce({
      ok: v.ok,
      status: v.status ?? (v.ok ? 200 : 500),
      json: async () => v.body ?? {},
    });
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("adminApi", () => {
  it("postAdminAction devuelve payload al completar", async () => {
    const fetchMock = mockFetchSequence([{ ok: true, body: { status: "ok", action: "sync", message: "done" } }]);
    const { postAdminAction } = await import("./adminApi");

    const out = await postAdminAction("http://localhost:8000", "run-sync");
    expect(out.action).toBe("sync");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/admin/run-sync",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("postAdminAction adjunta header admin cuando está configurado", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_KEY", "secret-key");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_KEY_HEADER", "X-Admin-API-Key");
    const fetchMock = mockFetchSequence([{ ok: true, body: { status: "ok", action: "sync", message: "done" } }]);
    const { postAdminAction } = await import("./adminApi");

    await postAdminAction("http://localhost:8000", "run-sync");
    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("X-Admin-API-Key")).toBe("secret-key");
  });

  it("postAdminAction lanza error con detail del backend", async () => {
    mockFetchSequence([{ ok: false, status: 400, body: { detail: "bad request" } }]);
    const { postAdminAction } = await import("./adminApi");
    await expect(postAdminAction("http://localhost:8000", "run-sync")).rejects.toThrow("bad request");
  });

  it("fetchTradingView combina respuestas y aplica defaults", async () => {
    mockFetchSequence([
      { ok: true, body: { enabled: true } },
      { ok: true, body: { mode: "paper" } },
      { ok: true, body: { is_open: false, failure_count: 0, opened_until: null } },
      { ok: true, body: { orders: { open: 1, total: 2, filled: 1, rejected: 0 }, positions: { count: 0, total_abs_quantity: 0, total_realized_pnl: 0 } } },
      { ok: true, body: [{ id: 1 }] },
      { ok: true, body: [{ id: 2 }] },
      { ok: true, body: { positions: [{ market_id: 10 }] } },
    ]);
    const { fetchTradingView } = await import("./adminApi");

    const out = await fetchTradingView("http://localhost:8000");
    expect(out.tradingEnabled).toBe(true);
    expect(out.executionStatus?.mode).toBe("paper");
    expect(out.orders.length).toBe(1);
    expect(out.positions.length).toBe(1);
    expect(out.positionDetails.length).toBe(1);
  });

  it("setTradingEnabled y resetExecutionCircuit llaman endpoints correctos", async () => {
    const fetchMock = mockFetchSequence([{ ok: true }, { ok: true }]);
    const { resetExecutionCircuit, setTradingEnabled } = await import("./adminApi");

    await setTradingEnabled("http://localhost:8000", false);
    await resetExecutionCircuit("http://localhost:8000");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/admin/trading/disable",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/admin/execution/circuit-breaker/reset",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("scheduler start/stop/status usan endpoints correctos", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true },
      { ok: true },
      { ok: true, body: { running: true } },
    ]);
    const { fetchSchedulerStatus, startScheduler, stopScheduler } = await import("./adminApi");

    await startScheduler("http://localhost:8000");
    await stopScheduler("http://localhost:8000");
    const status = await fetchSchedulerStatus("http://localhost:8000");

    expect(status.running).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/admin/scheduler/start",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/admin/scheduler/stop",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/admin/scheduler/status",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("lanza error cuando falta API URL", async () => {
    const { fetchTradingView } = await import("./adminApi");
    await expect(fetchTradingView(undefined)).rejects.toThrow("NEXT_PUBLIC_API_URL no está configurada");
  });
});
