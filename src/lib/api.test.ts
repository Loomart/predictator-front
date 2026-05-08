import { afterEach, describe, expect, it, vi } from "vitest";

type MockJsonValue = unknown;

function mockFetchOk(payload: MockJsonValue) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    }),
  );
}

function mockFetchError(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => ({}),
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("frontend api client", () => {
  it("getMarkets devuelve datos cuando backend responde ok", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    mockFetchOk([{ id: 1, title: "m1" }]);

    const { getMarkets } = await import("./api");
    const result = await getMarkets();

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe(1);
  });

  it("getMarketById devuelve detalle cuando backend responde ok", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    mockFetchOk({ id: 10, title: "market", snapshots: [], signals: [] });

    const { getMarketById } = await import("./api");
    const result = await getMarketById("10");

    expect(result.id).toBe(10);
    expect(result.snapshots).toEqual([]);
  });

  it("getMarkets lanza error si backend responde no-ok", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    mockFetchError(503);

    const { getMarkets } = await import("./api");
    await expect(getMarkets()).rejects.toThrow("Error cargando mercados: 503");
  });

  it("lanza error al importar api.ts sin NEXT_PUBLIC_API_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    await expect(import("./api")).rejects.toThrow("NEXT_PUBLIC_API_URL no está configurada");
  });
});
