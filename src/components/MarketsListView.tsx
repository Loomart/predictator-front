"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

import { deleteMarket, type Market, type MarketSnapshot, type Signal } from "../lib/api";

type RecommendationLevel = "green" | "yellow" | "red";
const TABLE_PREFS_KEY = "markets_table_prefs_v1";
type RiskFilter = "all" | RecommendationLevel;

type TablePrefs = {
  search: string;
  riskFilter: RiskFilter;
  hasPriceOnly: boolean;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  pagination: PaginationState;
};

type DashboardRow = {
  id: number;
  title: string;
  platform: string;
  category: string | null;
  status: string;
  external_id: string;
  yes_price: number | null;
  no_price: number | null;
  spread: number | null;
  liquidity: number | null;
  signal_type: string | null;
  signal_status: string | null;
  recommendation: RecommendationLevel;
  recommendation_label: string;
  resolution_date: string | null;
};

function scoreSignal(signal: Signal | null): number {
  if (!signal) return 0;
  const status = (signal.status ?? "").toUpperCase();
  const signalType = (signal.signal_type ?? "").toUpperCase();
  const confidence = signal.confidence ?? 0;
  const edge = signal.edge_estimate ?? 0;
  const quality = Math.max(confidence, Math.min(1, edge * 20));

  if (status === "CONFIRMED" && signalType === "ENTER") return 0.9 * quality + 0.1;
  if (status === "CONFIRMED" || status === "CONFIRMING" || signalType === "WATCH") return 0.55 * quality + 0.2;
  if (status === "INVALIDATED" || status === "EXPIRED") return 0.1;
  if (signalType === "AVOID" || signalType === "WAIT_LIQUIDITY" || signalType === "WAIT_STABILITY") return 0.15;
  return 0.35 * quality + 0.2;
}

function recommendationFrom(signal: Signal | null): { level: RecommendationLevel; label: string } {
  const score = scoreSignal(signal);
  if (score >= 0.67) return { level: "green", label: "Entrar" };
  if (score >= 0.34) return { level: "yellow", label: "Riesgo alto" };
  return { level: "red", label: "No entrar" };
}

function levelStyle(level: RecommendationLevel): string {
  if (level === "green") return "text-emerald-300 border-emerald-500 bg-emerald-950/25";
  if (level === "yellow") return "text-amber-200 border-amber-500 bg-amber-950/25";
  return "text-red-300 border-red-600 bg-red-950/20";
}

function fmt(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return value.toFixed(4);
}

function loadPrefs(): TablePrefs {
  const defaults: TablePrefs = {
    search: "",
    riskFilter: "all" as const,
    hasPriceOnly: false,
    sorting: [{ id: "id", desc: true }] as SortingState,
    columnVisibility: {} as VisibilityState,
    pagination: { pageIndex: 0, pageSize: 10 } as PaginationState,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(TABLE_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<TablePrefs>;
    return {
      search: typeof parsed.search === "string" ? parsed.search : defaults.search,
      riskFilter: parsed.riskFilter === "green" || parsed.riskFilter === "yellow" || parsed.riskFilter === "red" || parsed.riskFilter === "all"
        ? parsed.riskFilter
        : defaults.riskFilter,
      hasPriceOnly: typeof parsed.hasPriceOnly === "boolean" ? parsed.hasPriceOnly : defaults.hasPriceOnly,
      sorting: Array.isArray(parsed.sorting) ? (parsed.sorting as SortingState) : defaults.sorting,
      columnVisibility:
        parsed.columnVisibility && typeof parsed.columnVisibility === "object"
          ? (parsed.columnVisibility as VisibilityState)
          : defaults.columnVisibility,
      pagination:
        parsed.pagination && typeof parsed.pagination === "object"
          ? {
              pageIndex: typeof (parsed.pagination as PaginationState).pageIndex === "number" ? (parsed.pagination as PaginationState).pageIndex : 0,
              pageSize: typeof (parsed.pagination as PaginationState).pageSize === "number" ? (parsed.pagination as PaginationState).pageSize : 10,
            }
          : defaults.pagination,
    };
  } catch {
    return defaults;
  }
}

export function MarketsListView({
  markets,
  snapshots,
  signals,
}: {
  markets: Market[];
  snapshots: MarketSnapshot[];
  signals: Signal[];
}) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RecommendationLevel>("all");
  const [hasPriceOnly, setHasPriceOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "id", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const initialRows = useMemo<DashboardRow[]>(() => {
    const latestSnapshotByMarket = new Map<number, MarketSnapshot>();
    for (const snap of snapshots) {
      if (!latestSnapshotByMarket.has(snap.market_id)) {
        latestSnapshotByMarket.set(snap.market_id, snap);
      }
    }

    const latestSignalByMarket = new Map<number, Signal>();
    for (const signal of signals) {
      if (!latestSignalByMarket.has(signal.market_id)) {
        latestSignalByMarket.set(signal.market_id, signal);
      }
    }

    return markets.map((market) => {
      const latestSnapshot = latestSnapshotByMarket.get(market.id) ?? null;
      const latestSignal = latestSignalByMarket.get(market.id) ?? null;
      const rec = recommendationFrom(latestSignal);
      return {
        id: market.id,
        title: market.title,
        platform: market.platform,
        category: market.category,
        status: market.status,
        external_id: market.external_id,
        yes_price: latestSnapshot?.yes_price ?? null,
        no_price: latestSnapshot?.no_price ?? null,
        spread: latestSnapshot?.spread ?? null,
        liquidity: latestSnapshot?.liquidity ?? null,
        signal_type: latestSignal?.signal_type ?? null,
        signal_status: latestSignal?.status ?? null,
        recommendation: rec.level,
        recommendation_label: rec.label,
        resolution_date: market.resolution_date,
      };
    });
  }, [markets, snapshots, signals]);

  const [rows, setRows] = useState<DashboardRow[]>(initialRows);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return rows.filter((row) => {
      const passRisk = riskFilter === "all" ? true : row.recommendation === riskFilter;
      if (!passRisk) return false;
      if (hasPriceOnly && row.yes_price === null && row.no_price === null) return false;
      if (!normalized) return true;
      const haystack = `${row.title} ${row.platform} ${row.category ?? ""} ${row.external_id} ${row.signal_type ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [rows, search, riskFilter, hasPriceOnly]);

  const columns = useMemo<ColumnDef<DashboardRow>[]>(
    () => [
      { accessorKey: "id", header: "ID", enableHiding: false },
      { accessorKey: "title", header: "Mercado" },
      { accessorKey: "platform", header: "Plataforma" },
      { accessorKey: "category", header: "Categoría", cell: ({ getValue }) => (getValue<string | null>() ?? "N/A") },
      { accessorKey: "status", header: "Estado" },
      { accessorKey: "yes_price", header: "Yes", cell: ({ getValue }) => fmt(getValue<number | null>()) },
      { accessorKey: "no_price", header: "No", cell: ({ getValue }) => fmt(getValue<number | null>()) },
      { accessorKey: "spread", header: "Spread", cell: ({ getValue }) => fmt(getValue<number | null>()) },
      { accessorKey: "liquidity", header: "Liquidity", cell: ({ getValue }) => fmt(getValue<number | null>()) },
      { accessorKey: "signal_type", header: "Signal", cell: ({ getValue }) => getValue<string | null>() ?? "N/A" },
      { accessorKey: "signal_status", header: "Signal status", cell: ({ getValue }) => getValue<string | null>() ?? "N/A" },
      {
        accessorKey: "recommendation_label",
        header: "Recomendación",
        cell: ({ row }) => (
          <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${levelStyle(row.original.recommendation)}`}>
            {row.original.recommendation_label}
          </span>
        ),
      },
      { accessorKey: "external_id", header: "External ID" },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Link className="underline text-green-300" href={`/markets/${row.original.id}`}>
              Ver detalle
            </Link>
            <button
              type="button"
              className="text-red-300 underline disabled:opacity-50"
              disabled={deletingId === row.original.id}
              onClick={async () => {
                if (!window.confirm(`Eliminar mercado ${row.original.id}?`)) return;
                setDeletingId(row.original.id);
                try {
                  await deleteMarket(row.original.id);
                  setRows((prev) => prev.filter((item) => item.id !== row.original.id));
                } catch {
                  window.alert("No se pudo eliminar el mercado.");
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    [deletingId],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    const prefs = loadPrefs();
    setSearch(prefs.search);
    setRiskFilter(prefs.riskFilter);
    setHasPriceOnly(prefs.hasPriceOnly);
    setSorting(prefs.sorting);
    setColumnVisibility(prefs.columnVisibility);
    setPagination(prefs.pagination);
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded || typeof window === "undefined") return;
    window.localStorage.setItem(
      TABLE_PREFS_KEY,
      JSON.stringify({
        search,
        riskFilter,
        hasPriceOnly,
        sorting,
        columnVisibility,
        pagination,
      }),
    );
  }, [prefsLoaded, search, riskFilter, hasPriceOnly, sorting, columnVisibility, pagination]);

  const exportVisibleRowsAsCsv = () => {
    const data = table.getRowModel().rows.map((row) => row.original);
    if (data.length === 0) return;
    const headers = [
      "id",
      "title",
      "platform",
      "category",
      "status",
      "yes_price",
      "no_price",
      "spread",
      "liquidity",
      "signal_type",
      "signal_status",
      "recommendation",
      "external_id",
      "resolution_date",
    ];
    const escape = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.id,
          row.title,
          row.platform,
          row.category ?? "",
          row.status,
          row.yes_price ?? "",
          row.no_price ?? "",
          row.spread ?? "",
          row.liquidity ?? "",
          row.signal_type ?? "",
          row.signal_status ?? "",
          row.recommendation_label,
          row.external_id,
          row.resolution_date ?? "",
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "markets_table_export.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const resetView = () => {
    setSearch("");
    setRiskFilter("all");
    setHasPriceOnly(false);
    setSorting([{ id: "id", desc: true }]);
    setColumnVisibility({});
    setPagination({ pageIndex: 0, pageSize: 10 });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TABLE_PREFS_KEY);
    }
  };

  return (
    <main className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight">Prediction Markets Dashboard</h1>
          <p className="text-sm text-green-300 mt-2">Vista tabla con filtros, orden, columnas y acciones</p>
        </header>

        <div className="border border-green-700 rounded-lg p-4 mb-4 bg-black/40">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black border border-green-700 rounded px-3 py-2 text-sm min-w-[280px]"
              placeholder="Buscar por título, categoría, signal, external id..."
            />
            <select
              className="bg-black border border-green-700 rounded px-3 py-2 text-sm"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as "all" | RecommendationLevel)}
            >
              <option value="all">Riesgo: todos</option>
              <option value="green">Verde (Entrar)</option>
              <option value="yellow">Amarillo (Riesgo alto)</option>
              <option value="red">Rojo (No entrar)</option>
            </select>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasPriceOnly}
                onChange={(e) => setHasPriceOnly(e.target.checked)}
              />
              Solo con precio
            </label>
            <select
              className="bg-black border border-green-700 rounded px-3 py-2 text-sm"
              value={pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 filas</option>
              <option value={20}>20 filas</option>
              <option value={50}>50 filas</option>
            </select>
            <button
              type="button"
              className="border border-green-700 rounded px-3 py-2 text-sm"
              onClick={exportVisibleRowsAsCsv}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="border border-green-700 rounded px-3 py-2 text-sm"
              onClick={resetView}
            >
              Reset vista
            </button>
            {table.getAllLeafColumns().map((column) => (
              <label key={column.id} className="text-xs flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  disabled={!column.getCanHide()}
                />
                {column.id}
              </label>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-green-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-green-950/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left p-3 border-b border-green-900">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="font-semibold"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: " ▲",
                            desc: " ▼",
                          }[header.column.getIsSorted() as string] ?? ""}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td className="p-4 text-green-300" colSpan={columns.length}>
                    Sin resultados para el filtro actual.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-green-950/40 hover:bg-green-950/10">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <p>
            Mostrando {table.getRowModel().rows.length} de {filteredRows.length} filas
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border border-green-700 px-3 py-1 rounded disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </button>
            <button
              type="button"
              className="border border-green-700 px-3 py-1 rounded disabled:opacity-40"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
