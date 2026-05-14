"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const heatmapColumns = ["PESQ.", "D. GEN", "PMAX", "L. AD", "BAT.", "FORMS"];

const heatmapRows = [
  { unit: "Mogi 2", values: [18.4, 13.1, 15.9, 14.9, 15.4, 10.8] },
  { unit: "Mogi 1", values: [13.8, 12.6, 11.2, 14.4, 14.1, 9.8] },
  { unit: "Mogi 3", values: [12.9, 11.4, 10.9, 14.2, 13.6, 9.2] },
  { unit: "Indaiatuba", values: [10.8, 9.5, 8.9, 11.2, 10.5, 7.8] },
  { unit: "São Carlos", values: [10.2, 9.3, 9.1, 10.5, 10.9, 7.5] },
  { unit: "SJC", values: [11.5, 9.7, 8.8, 11.9, 11.3, 7.9] },
  { unit: "Curitiba", values: [12.1, 10.4, 8.5, 11.8, 11.1, 6.9] },
  { unit: "Campinas", values: [17.8, 14.2, 13.5, 15.9, 15.1, 10.4] },
  { unit: "BH", values: [12.3, 10.6, 9.3, 11.5, 11.0, 7.4] },
];

type FormatRow = {
  name: string;
  investment: string;
  leads: string;
  cpl: string;
  sales: string;
  cpa: string;
  roas: string;
};

type PlatformRow = FormatRow & {
  formats: FormatRow[];
};

type UnitRow = FormatRow & {
  platforms: PlatformRow[];
};

const hierarchyRows: UnitRow[] = [
  {
    name: "Mogi das Cruzes 2",
    investment: "103.230",
    leads: "6.766",
    cpl: "15,26",
    sales: "61",
    cpa: "1.692",
    roas: "15,30x",
    platforms: [
      {
        name: "Google",
        investment: "58.140",
        leads: "3.521",
        cpl: "16,51",
        sales: "38",
        cpa: "1.530",
        roas: "16,12x",
        formats: [
          { name: "pesquisa", investment: "22.430", leads: "1.180", cpl: "19,01", sales: "18", cpa: "1.246", roas: "18,40x" },
          { name: "demand gen", investment: "19.860", leads: "1.342", cpl: "14,80", sales: "11", cpa: "1.805", roas: "13,10x" },
          { name: "pmax", investment: "15.850", leads: "999", cpl: "15,87", sales: "9", cpa: "1.761", roas: "15,85x" },
        ],
      },
      {
        name: "Meta · Bidu",
        investment: "45.090",
        leads: "3.245",
        cpl: "13,89",
        sales: "23",
        cpa: "1.960",
        roas: "14,28x",
        formats: [
          { name: "lead_ad", investment: "21.330", leads: "1.610", cpl: "13,25", sales: "11", cpa: "1.939", roas: "14,90x" },
          { name: "(bateria) - lead_ad", investment: "14.420", leads: "1.080", cpl: "13,35", sales: "8", cpa: "1.803", roas: "15,40x" },
          { name: "forms", investment: "9.340", leads: "555", cpl: "16,83", sales: "4", cpa: "2.335", roas: "10,80x" },
        ],
      },
    ],
  },
  { name: "Mogi das Cruzes 1", investment: "92.664", leads: "6.033", cpl: "15,36", sales: "46", cpa: "2.014", roas: "14,41x", platforms: [] },
  { name: "Mogi das Cruzes 3", investment: "93.418", leads: "6.143", cpl: "15,21", sales: "50", cpa: "1.868", roas: "13,20x", platforms: [] },
  { name: "Indaiatuba", investment: "92.412", leads: "5.657", cpl: "16,34", sales: "50", cpa: "1.848", roas: "11,13x", platforms: [] },
  { name: "São Carlos", investment: "87.818", leads: "6.876", cpl: "12,77", sales: "47", cpa: "1.868", roas: "9,49x", platforms: [] },
  { name: "São José dos Campos", investment: "70.704", leads: "4.164", cpl: "16,98", sales: "36", cpa: "1.964", roas: "10,18x", platforms: [] },
  { name: "Curitiba - PR", investment: "69.791", leads: "3.227", cpl: "21,63", sales: "33", cpa: "2.115", roas: "11,66x", platforms: [] },
  { name: "Campinas", investment: "54.526", leads: "3.318", cpl: "16,43", sales: "38", cpa: "1.435", roas: "16,91x", platforms: [] },
  { name: "Belo Horizonte - MG", investment: "32.738", leads: "2.579", cpl: "12,69", sales: "18", cpa: "1.819", roas: "11,47x", platforms: [] },
];

const heatmapValues = heatmapRows.flatMap((row) => row.values);
const heatmapMin = Math.min(...heatmapValues);
const heatmapMax = Math.max(...heatmapValues);

export function RoasAnalysisSection() {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <RoasHeatmap />
      <RoasAccordionTable />
    </section>
  );
}

export function RoasHeatmap() {
  const [page, setPage] = React.useState(0);
  const visibleRows = heatmapRows.slice(page * 6, page * 6 + 6);
  const placeholderRows = Array.from({ length: Math.max(0, 6 - visibleRows.length) });
  const hasPreviousPage = page > 0;
  const hasNextPage = (page + 1) * 6 < heatmapRows.length;

  return (
    <div className="flex h-full min-h-[396px] flex-col rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-5">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Matriz ROAS · Praça × Formato</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Unidades anteriores"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-[var(--palette-yellow)] disabled:pointer-events-none disabled:opacity-30"
            disabled={!hasPreviousPage}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            <ChevronLeftIcon />
          </button>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Metrica: ROAS</p>
          <button
            type="button"
            aria-label="Proximas unidades"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-[var(--palette-yellow)] disabled:pointer-events-none disabled:opacity-30"
            disabled={!hasNextPage}
            onClick={() =>
              setPage((current) =>
                (current + 1) * 6 < heatmapRows.length ? current + 1 : current,
              )
            }
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[100px_repeat(6,minmax(48px,1fr))] gap-1.5 text-sm">
        <div />
        {heatmapColumns.map((column) => (
          <div key={column} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {column}
          </div>
        ))}

        {visibleRows.map((row) => (
          <React.Fragment key={row.unit}>
            <div className="flex items-center text-sm font-semibold">{row.unit}</div>
            {row.values.map((value, index) => (
              <div
                key={`${row.unit}-${heatmapColumns[index]}`}
                className={cn(
                  "grid h-9 place-items-center rounded text-sm font-bold tabular-nums cursor-default transition-[transform,box-shadow] duration-150 hover:scale-110 hover:shadow-[0_0_12px_rgba(55,119,255,0.5)] hover:z-10 relative",
                  value < 9 ? "text-foreground" : "text-white",
                )}
                style={{ backgroundColor: getHeatmapColor(value) }}
              >
                {formatDecimal(value)}
              </div>
            ))}
          </React.Fragment>
        ))}

        {placeholderRows.map((_, rowIndex) => (
          <React.Fragment key={`placeholder-${rowIndex}`}>
            <div className="h-9" />
            {heatmapColumns.map((column) => (
              <div key={`${column}-${rowIndex}`} className="h-9 rounded opacity-0" />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span>baixo</span>
        <div className="flex overflow-hidden rounded-sm">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className="h-2 w-5"
              style={{
                backgroundColor: getHeatmapColor(
                  heatmapMin + ((heatmapMax - heatmapMin) / 6) * index,
                ),
              }}
            />
          ))}
        </div>
        <span>alto</span>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        {page * 6 + 1}-{Math.min((page + 1) * 6, heatmapRows.length)} de {heatmapRows.length} unidades
      </p>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function RoasAccordionTable() {
  const [openUnits, setOpenUnits] = React.useState<Set<string>>(
    new Set([hierarchyRows[0]?.name ?? ""]),
  );
  const [openPlatforms, setOpenPlatforms] = React.useState<Set<string>>(
    new Set(["Mogi das Cruzes 2-Google", "Mogi das Cruzes 2-Meta · Bidu"]),
  );

  function toggleUnit(unit: string) {
    setOpenUnits((current) => toggleSetValue(current, unit));
  }

  function togglePlatform(key: string) {
    setOpenPlatforms((current) => toggleSetValue(current, key));
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[var(--surface-panel)] shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <h2 className="text-base font-semibold">Praça → Plataforma → Formato</h2>
        <button className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Recolher tudo · Ordenar por ROAS
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Dimensão</th>
              <th className="px-4 py-3 text-center font-semibold">Investimento</th>
              <th className="px-4 py-3 text-center font-semibold">Leads</th>
              <th className="px-4 py-3 text-center font-semibold">CPL</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--palette-orange)]">Vendas ★</th>
              <th className="px-4 py-3 text-center font-semibold">CPA</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--palette-orange)]">ROAS ★</th>
            </tr>
          </thead>
          <tbody>
            {hierarchyRows.map((unit) => {
              const unitOpen = openUnits.has(unit.name);

              return (
                <React.Fragment key={unit.name}>
                  <HierarchyRow
                    bold
                    level={0}
                    onToggle={() => toggleUnit(unit.name)}
                    open={unitOpen}
                    row={unit}
                  />
                  {unitOpen &&
                    unit.platforms.map((platform) => {
                      const platformKey = `${unit.name}-${platform.name}`;
                      const platformOpen = openPlatforms.has(platformKey);

                      return (
                        <React.Fragment key={platformKey}>
                          <HierarchyRow
                            level={1}
                            onToggle={() => togglePlatform(platformKey)}
                            open={platformOpen}
                            platformBadge={platform.name}
                            row={platform}
                          />
                          {platformOpen &&
                            platform.formats.map((format) => (
                              <HierarchyRow
                                italic
                                key={`${platformKey}-${format.name}`}
                                level={2}
                                row={format}
                              />
                            ))}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HierarchyRow({
  row,
  level,
  open,
  onToggle,
  bold = false,
  italic = false,
  platformBadge,
}: {
  row: FormatRow;
  level: 0 | 1 | 2;
  open?: boolean;
  onToggle?: () => void;
  bold?: boolean;
  italic?: boolean;
  platformBadge?: string;
}) {
  const indent = level === 0 ? "pl-4" : level === 1 ? "pl-9" : "pl-14";
  const hoverAccent =
    level === 0
      ? "hover:bg-[var(--palette-blue)]/10 hover:shadow-[inset_3px_0_0_var(--palette-blue)]"
      : level === 1
        ? "hover:bg-[var(--palette-orange)]/10 hover:shadow-[inset_3px_0_0_var(--palette-orange)]"
        : "hover:bg-white/[0.06] hover:shadow-[inset_3px_0_0_rgba(255,255,255,0.18)]";

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("border-b border-white/10 transition-[background-color,box-shadow]", hoverAccent)}
    >
      <td className={cn("px-4 py-3", indent, bold && "font-bold", italic && "italic text-muted-foreground")}>
        <div className="flex items-center gap-2">
          {onToggle ? (
            <button
              type="button"
              className="grid size-4 place-items-center text-muted-foreground"
              onClick={onToggle}
              aria-label={open ? "Recolher linha" : "Expandir linha"}
            >
              {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          ) : (
            <span className="size-4" />
          )}
          {platformBadge ? (
            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", platformBadge.includes("Meta") ? "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]" : "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]")}>
              {platformBadge}
            </span>
          ) : (
            <span>{row.name}</span>
          )}
        </div>
      </td>
      <td className={cn("px-4 py-3 text-center tabular-nums", bold && "font-bold")}>{row.investment}</td>
      <td className={cn("px-4 py-3 text-center tabular-nums", bold && "font-bold")}>{row.leads}</td>
      <td className={cn("px-4 py-3 text-center tabular-nums", bold && "font-bold")}>{row.cpl}</td>
      <td className="px-4 py-3 text-center tabular-nums text-[var(--palette-orange)]">{row.sales}</td>
      <td className={cn("px-4 py-3 text-center tabular-nums", bold && "font-bold")}>{row.cpa}</td>
      <td className="px-4 py-3 text-center tabular-nums text-[var(--palette-orange)]">{row.roas}</td>
    </motion.tr>
  );
}

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

function getHeatmapColor(value: number) {
  const ratio = (value - heatmapMin) / (heatmapMax - heatmapMin);
  const stops = [
    [37, 48, 92],
    [45, 74, 150],
    [55, 119, 255],
    [123, 164, 255],
  ];
  const scaled = ratio * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  const localRatio = scaled - index;
  const start = stops[index];
  const end = stops[index + 1];

  if (!start || !end) {
    return "rgb(123, 164, 255)";
  }

  const [r, g, b] = start.map((channel, channelIndex) =>
    Math.round(channel + (end[channelIndex] - channel) * localRatio),
  );

  return `rgb(${r}, ${g}, ${b})`;
}

function formatDecimal(value: number) {
  return value.toFixed(1).replace(".", ",");
}
