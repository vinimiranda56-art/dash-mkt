"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  Gauge,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_FORMATS,
  ALL_PLATFORMS,
  cpa as calcCpa,
  cpl as calcCpl,
  emptyAggregate,
  filterDailyByRange,
  fmtDec,
  fmtInt,
  fmtMoney,
  fmtMoneyShort,
  fmtRoas,
  generateDataset,
  PRACAS,
  roas as calcRoas,
  sum,
  type DailyPoint,
  type FormatKey,
  type FormatRow,
  type Platform,
  type Praca,
} from "@/lib/dashboards-data";
import { RichPanel } from "@/components/dashboards-shell";
import { StatisticsCard2 } from "@/components/statistics-card-2";
import { LogsModal } from "@/components/logs-modal";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/bar-chart";
import {
  DateRangePresetFilter,
  defaultDateValue,
  FilterBar,
  FilterCheckboxDropdown,
  type DateFilterValue,
} from "@/components/filter-controls";

export function AllocationSection() {
  const dataset = React.useMemo(() => generateDataset(42), []);

  const [dateValue, setDateValue] = React.useState<DateFilterValue>(() => defaultDateValue());
  const [selectedPracas, setSelectedPracas] = React.useState<Praca[]>([...PRACAS]);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([...ALL_PLATFORMS]);

  const filtered = React.useMemo(
    () =>
      dataset.filter(
        (row) => selectedPracas.includes(row.praca) && selectedPlatforms.includes(row.platform),
      ),
    [dataset, selectedPracas, selectedPlatforms],
  );

  const totals = React.useMemo(() => sum(filtered), [filtered]);

  return (
    <section className="flex flex-col gap-4">
      <FilterBar>
        <DateRangePresetFilter value={dateValue} onChange={setDateValue} />
        <FilterCheckboxDropdown
          label="Praça"
          options={PRACAS}
          values={selectedPracas}
          onChange={setSelectedPracas}
        />
        <FilterCheckboxDropdown
          label="Plataforma"
          options={ALL_PLATFORMS}
          values={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />
      </FilterBar>

      <KpiStrip rows={filtered} totals={totals} />

      <EvolucaoTemporalPanel range={dateValue.range} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1.15fr_1.1fr]">
        <MatrixPanel rows={filtered} metric="roas" />
        <MatrixPanel rows={filtered} metric="cpa" />
        <FormatBarsPanel rows={filtered} />
      </div>

      <HierarchyPanel rows={filtered} />
    </section>
  );
}

// ─── KPI strip ───────────────────────────────────────────────────────────────

function KpiStrip({
  totals,
}: {
  rows: FormatRow[];
  totals: ReturnType<typeof sum>;
}) {
  type KpiSpec = {
    label: string;
    value: string;
    delta: string;
    trend: "up" | "down";
    icon: LucideIcon;
    featured?: boolean;
  };

  const items: KpiSpec[] = [
    { label: "Investimento", value: fmtMoneyShort(totals.investment), delta: "+4,2%", trend: "up", icon: DollarSign },
    { label: "Leads válidos", value: fmtInt(totals.leads), delta: "+2,8%", trend: "up", icon: Users },
    { label: "Vendas", value: fmtInt(totals.sales), delta: "+11,5%", trend: "up", icon: Target, featured: true },
    { label: "Receita", value: fmtMoneyShort(totals.revenue), delta: "+9,7%", trend: "up", icon: Gauge },
    { label: "ROAS", value: fmtRoas(calcRoas(totals)), delta: "+5,2%", trend: "up", icon: TrendingUp, featured: true },
    { label: "CPA", value: fmtMoney(calcCpa(totals)), delta: "+1,1%", trend: "down", icon: Wallet },
  ];

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {items.map((item) => (
        <StatisticsCard2
          key={item.label}
          className="min-h-0 [&_[data-slot='card-content']]:p-4"
          label={item.featured ? `★ ${item.label}` : item.label}
          value={item.value}
          delta={item.delta}
          trend={item.trend}
          icon={item.icon}
          accent={item.featured ? "orange" : "default"}
        />
      ))}
    </motion.section>
  );
}

// ─── Hierarchical table ──────────────────────────────────────────────────────

type GroupedPraca = {
  praca: Praca;
  totals: ReturnType<typeof sum>;
  platforms: {
    platform: Platform;
    totals: ReturnType<typeof sum>;
    formats: FormatRow[];
  }[];
};

function groupByPraca(rows: FormatRow[]): GroupedPraca[] {
  const byPraca = new Map<Praca, FormatRow[]>();
  for (const row of rows) {
    const list = byPraca.get(row.praca) ?? [];
    list.push(row);
    byPraca.set(row.praca, list);
  }

  const out: GroupedPraca[] = [];
  for (const [praca, list] of byPraca) {
    const byPlatform = new Map<Platform, FormatRow[]>();
    for (const r of list) {
      const sub = byPlatform.get(r.platform) ?? [];
      sub.push(r);
      byPlatform.set(r.platform, sub);
    }
    out.push({
      praca,
      totals: sum(list),
      platforms: Array.from(byPlatform.entries()).map(([platform, formats]) => ({
        platform,
        totals: sum(formats),
        formats: formats.sort((a, b) => b.sales - a.sales),
      })),
    });
  }

  return out.sort((a, b) => calcRoas(b.totals) - calcRoas(a.totals));
}

function HierarchyPanel({ rows }: { rows: FormatRow[] }) {
  const groups = React.useMemo(() => groupByPraca(rows), [rows]);
  const [openPracas, setOpenPracas] = React.useState<Set<string>>(
    () => new Set(groups[0] ? [groups[0].praca] : []),
  );
  const [openPlatforms, setOpenPlatforms] = React.useState<Set<string>>(() => {
    const first = groups[0];
    if (!first) return new Set();
    return new Set(first.platforms.map((p) => `${first.praca}__${p.platform}`));
  });

  function togglePraca(praca: string) {
    setOpenPracas((curr) => toggle(curr, praca));
  }
  function togglePlatform(key: string) {
    setOpenPlatforms((curr) => toggle(curr, key));
  }

  const total = React.useMemo(() => sum(rows), [rows]);

  return (
    <RichPanel
      title="Detalhamento por praça, plataforma e formato"
      subtitle="Drill-down completo do investimento ao ROAS · expanda cada linha para abrir o nível seguinte"
      toolbar={
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Ordenado por ROAS · desc
        </span>
      }
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="border-b border-white/10 px-4 py-3 font-semibold">Dimensão</th>
              <th className="border-b border-white/10 px-4 py-3 text-right font-semibold">Investimento</th>
              <th className="border-b border-white/10 px-4 py-3 text-right font-semibold">Leads</th>
              <th className="border-b border-white/10 px-4 py-3 text-right font-semibold">CPL</th>
              <th className="border-b border-white/10 px-4 py-3 text-right font-semibold text-[var(--palette-orange)]">
                Vendas ★
              </th>
              <th className="border-b border-white/10 px-4 py-3 text-right font-semibold">CPA</th>
              <th className="border-b border-white/10 px-4 py-3 text-right font-semibold text-[var(--palette-orange)]">
                ROAS ★
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const isOpen = openPracas.has(group.praca);
              return (
                <React.Fragment key={group.praca}>
                  <DataRow
                    level={0}
                    label={group.praca}
                    totals={group.totals}
                    open={isOpen}
                    onToggle={() => togglePraca(group.praca)}
                  />
                  {isOpen &&
                    group.platforms.map((p) => {
                      const key = `${group.praca}__${p.platform}`;
                      const platformOpen = openPlatforms.has(key);
                      return (
                        <React.Fragment key={key}>
                          <DataRow
                            level={1}
                            label={p.platform}
                            platformBadge={p.platform}
                            totals={p.totals}
                            open={platformOpen}
                            onToggle={() => togglePlatform(key)}
                          />
                          {platformOpen &&
                            p.formats.map((fmt) => (
                              <DataRow
                                key={`${key}__${fmt.format}`}
                                level={2}
                                label={fmt.format}
                                totals={{
                                  investment: fmt.investment,
                                  leads: fmt.leads,
                                  proposals: fmt.proposals,
                                  visits: fmt.visits,
                                  sales: fmt.sales,
                                  revenue: fmt.revenue,
                                }}
                              />
                            ))}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="border-t-2 border-white/20 px-4 py-3 text-sm font-bold">Total geral</td>
              <td className="border-t-2 border-white/20 px-4 py-3 text-right font-bold tabular-nums">
                {fmtInt(total.investment)}
              </td>
              <td className="border-t-2 border-white/20 px-4 py-3 text-right font-bold tabular-nums">
                {fmtInt(total.leads)}
              </td>
              <td className="border-t-2 border-white/20 px-4 py-3 text-right font-bold tabular-nums">
                {fmtDec(calcCpl(total))}
              </td>
              <td className="border-t-2 border-white/20 px-4 py-3 text-right font-bold tabular-nums text-[var(--palette-orange)]">
                {fmtInt(total.sales)}
              </td>
              <td className="border-t-2 border-white/20 px-4 py-3 text-right font-bold tabular-nums">
                {fmtInt(calcCpa(total))}
              </td>
              <td className="border-t-2 border-white/20 px-4 py-3 text-right font-bold tabular-nums text-[var(--palette-orange)]">
                {fmtRoas(calcRoas(total))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--palette-blue)]/40" /> Google
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--palette-orange)]/40" /> Meta · Bidu
          </span>
        </div>
        <span>★ = nova meta</span>
      </div>
    </RichPanel>
  );
}

function DataRow({
  level,
  label,
  totals,
  open,
  onToggle,
  platformBadge,
}: {
  level: 0 | 1 | 2;
  label: string;
  totals: ReturnType<typeof sum>;
  open?: boolean;
  onToggle?: () => void;
  platformBadge?: Platform;
}) {
  const indent = level === 0 ? "pl-4" : level === 1 ? "pl-10" : "pl-16";
  const hoverAccent =
    level === 0
      ? "hover:bg-[var(--palette-blue)]/10 hover:shadow-[inset_3px_0_0_var(--palette-blue)]"
      : level === 1
        ? "hover:bg-[var(--palette-orange)]/10 hover:shadow-[inset_3px_0_0_var(--palette-orange)]"
        : "hover:bg-white/[0.05]";

  const rowClass = cn(
    "border-b border-white/10 transition-[background-color,box-shadow]",
    hoverAccent,
    level === 2 && "text-muted-foreground italic",
  );

  return (
    <tr className={rowClass}>
      <td className={cn("py-3 pr-4", indent)}>
        <div className="flex items-center gap-2">
          {onToggle ? (
            <button
              type="button"
              className="grid size-4 place-items-center text-muted-foreground"
              onClick={onToggle}
              aria-label={open ? "Recolher" : "Expandir"}
            >
              {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          ) : (
            <span className="size-4" />
          )}
          {platformBadge ? (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                platformBadge === "Google"
                  ? "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]"
                  : "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]",
              )}
            >
              {platformBadge}
            </span>
          ) : (
            <span className={cn(level === 0 && "font-semibold")}>{label}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtInt(totals.investment)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtInt(totals.leads)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtDec(calcCpl(totals))}</td>
      <td className="px-4 py-3 text-right tabular-nums text-[var(--palette-orange)]">
        {fmtInt(totals.sales)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtInt(calcCpa(totals))}</td>
      <td className="px-4 py-3 text-right tabular-nums text-[var(--palette-orange)]">
        {fmtRoas(calcRoas(totals))}
      </td>
    </tr>
  );
}

function toggle(curr: Set<string>, value: string) {
  const next = new Set(curr);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// ─── Single Matrix Panel (ROAS or CPA) ───────────────────────────────────────

function MatrixPanel({
  rows,
  metric,
}: {
  rows: FormatRow[];
  metric: "roas" | "cpa";
}) {
  const matrix = React.useMemo(() => buildMatrix(rows, metric), [rows, metric]);
  const isRoas = metric === "roas";

  return (
    <RichPanel
      title={isRoas ? "Matriz ROAS · praça × formato" : "Matriz CPA · praça × formato"}
      subtitle={
        isRoas
          ? "Retorno relativo · maior é melhor"
          : "Custo absoluto por venda · menor é melhor"
      }
      toolbar={
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {isRoas ? "× (vezes)" : "R$"}
        </span>
      }
    >
      <MatrixView
        data={matrix}
        badgeLabel={isRoas ? "ROAS" : "CPA"}
        hint={isRoas ? "maior = melhor" : "menor = melhor"}
        formatter={isRoas ? fmtDec : fmtInt}
        scale={isRoas ? "positive" : "negative"}
      />
    </RichPanel>
  );
}

type MatrixRow = { praca: Praca; values: number[] };

function buildMatrix(rows: FormatRow[], metric: "roas" | "cpa"): MatrixRow[] {
  const pracas = Array.from(new Set(rows.map((r) => r.praca))) as Praca[];
  const matrix = pracas.map((praca) => ({
    praca,
    values: ALL_FORMATS.map((fmt) => {
      const cell = rows.filter((r) => r.praca === praca && r.format === fmt);
      const agg = cell.length ? sum(cell) : emptyAggregate();
      return metric === "roas" ? calcRoas(agg) : calcCpa(agg);
    }),
  }));
  // ROAS: higher is better → sort desc; CPA: lower is better → sort asc
  return matrix.sort((a, b) =>
    metric === "roas" ? avg(b.values) - avg(a.values) : avg(a.values) - avg(b.values),
  );
}

function MatrixView({
  data,
  badgeLabel,
  hint,
  formatter,
  scale,
}: {
  data: MatrixRow[];
  badgeLabel: string;
  hint: string;
  formatter: (value: number) => string;
  scale: "positive" | "negative";
}) {
  const flat = data.flatMap((row) => row.values).filter((v) => v > 0);
  const min = flat.length ? Math.min(...flat) : 0;
  const max = flat.length ? Math.max(...flat) : 1;
  const badgeClass =
    scale === "positive"
      ? "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]"
      : "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]";

  return (
    <div className="p-4">
      <div className="mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", badgeClass)}>
          {badgeLabel}
        </span>
        <span>{hint}</span>
      </div>
      <div className="grid grid-cols-[78px_repeat(6,minmax(28px,1fr))] gap-1 text-sm">
        <div />
        {ALL_FORMATS.map((fmt) => (
          <div
            key={fmt}
            className="pb-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {abbreviate(fmt)}
          </div>
        ))}
        {data.map((row) => (
          <React.Fragment key={row.praca}>
            <div className="flex items-center truncate text-[11px] font-medium">
              {shortPraca(row.praca)}
            </div>
            {row.values.map((value, i) => (
              <div
                key={`${row.praca}-${ALL_FORMATS[i]}`}
                className={cn(
                  "grid h-7 place-items-center rounded text-[10px] font-bold tabular-nums transition-transform hover:scale-110 hover:shadow-[0_0_12px_rgba(55,119,255,0.4)]",
                  value === 0 ? "bg-white/5 text-muted-foreground" : "text-white",
                )}
                style={value > 0 ? { backgroundColor: heatColor(value, min, max, scale) } : undefined}
                title={`${row.praca} · ${ALL_FORMATS[i]}: ${value ? formatter(value) : "—"}`}
              >
                {value ? formatter(value) : "—"}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span>{scale === "positive" ? "baixo" : "bom"}</span>
        <div className="flex overflow-hidden rounded-sm">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="h-1.5 w-4"
              style={{ backgroundColor: heatColor(min + ((max - min) / 6) * i, min, max, scale) }}
            />
          ))}
        </div>
        <span>{scale === "positive" ? "alto" : "ruim"}</span>
      </div>
    </div>
  );
}

function avg(values: number[]) {
  const valid = values.filter((v) => v > 0);
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function heatColor(value: number, min: number, max: number, scale: "positive" | "negative" = "positive") {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  // CPA / negative scale: monochromatic orange — pale (good) → intense (bad)
  if (scale === "negative") {
    const alpha = 0.12 + ratio * 0.83;
    return `rgba(242, 100, 25, ${alpha.toFixed(3)})`;
  }
  // ROAS / positive scale: monochromatic blue — dim (low) → bright (high)
  const positiveStops: [number, number, number][] = [
    [37, 48, 92],
    [45, 74, 150],
    [55, 119, 255],
    [123, 164, 255],
  ];
  const stops = positiveStops;
  const scaled = ratio * (stops.length - 1);
  const idx = Math.min(Math.floor(scaled), stops.length - 2);
  const t = scaled - idx;
  const start = stops[idx]!;
  const end = stops[idx + 1]!;
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function shortPraca(praca: Praca): string {
  return praca
    .replace("Mogi das Cruzes", "Mogi")
    .replace(" — PR", "")
    .replace(" — MG", "")
    .replace("São José dos Campos", "SJC")
    .replace("Belo Horizonte", "BH");
}

function abbreviate(fmt: FormatKey): string {
  switch (fmt) {
    case "pesquisa":
      return "pesq.";
    case "demand gen":
      return "d.gen";
    case "pmax":
      return "pmax";
    case "lead_ad":
      return "l.ad";
    case "(bateria) lead_ad":
      return "bat.";
    case "forms":
      return "forms";
  }
}

// ─── Bar chart by format ─────────────────────────────────────────────────────

const formatBarsConfig = {
  sales: { label: "Vendas", color: "var(--palette-blue)" },
  Google: { label: "Google", color: "var(--palette-blue)" },
  "Meta · Bidu": { label: "Meta · Bidu", color: "var(--palette-orange)" },
} satisfies ChartConfig;

function FormatBarsPanel({ rows }: { rows: FormatRow[] }) {
  const data = React.useMemo(() => {
    return ALL_FORMATS.map((fmt) => {
      const formatRows = rows.filter((r) => r.format === fmt);
      const agg = sum(formatRows);
      const platform: Platform = (formatRows[0]?.platform ?? "Google") as Platform;
      return {
        format: fmt,
        sales: agg.sales,
        cpa: calcCpa(agg),
        investment: agg.investment,
        platform,
        fill: platform === "Google" ? "var(--palette-blue)" : "var(--palette-orange)",
      };
    })
      .filter((d) => d.sales > 0)
      .sort((a, b) => b.sales - a.sales);
  }, [rows]);

  return (
    <RichPanel
      title="Ranking de vendas por formato"
      subtitle="Quem mais converte no agregado · cor indica plataforma, CPA correspondente ao lado"
      toolbar={
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Métrica: nº de vendas
        </span>
      }
    >
      <div className="p-5">
        {data.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nenhum dado para os filtros selecionados.
          </p>
        ) : (
          <ChartContainer
            config={formatBarsConfig}
            className="aspect-auto h-[400px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              barCategoryGap="18%"
              margin={{ top: 12, right: 58, bottom: 8, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="format"
                axisLine={false}
                tickLine={false}
                width={96}
                tick={{ fill: "#B5ADB9", fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value: string) =>
                  value === "(bateria) lead_ad" ? "bateria lead_ad" : value
                }
              />
              <ChartTooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    formatter={(value, _name, item) => {
                      const payload = item.payload as
                        | { cpa?: number; platform?: Platform; fill?: string }
                        | undefined;
                      const fill = payload?.fill ?? "var(--palette-blue)";
                      return (
                        <div className="flex w-full flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: fill }}
                            />
                            <span className="text-muted-foreground">
                              {payload?.platform ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-muted-foreground">Vendas</span>
                            <span className="font-mono font-semibold tabular-nums">
                              {fmtInt(Number(value))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-muted-foreground">CPA</span>
                            <span className="font-mono font-semibold tabular-nums">
                              {fmtMoney(payload?.cpa ?? 0)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="sales" radius={[0, 6, 6, 0]} barSize={34}>
                {data.map((d) => (
                  <Cell key={d.format} fill={d.fill} />
                ))}
                <LabelList
                  dataKey="sales"
                  position="insideRight"
                  fill="#fff"
                  fontSize={10}
                  fontWeight={700}
                  offset={8}
                  formatter={(value) => fmtInt(Number(value))}
                />
                <LabelList
                  dataKey="cpa"
                  position="right"
                  fill="#B5ADB9"
                  fontSize={10}
                  offset={8}
                  formatter={(value) => `CPA ${fmtInt(Number(value))}`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </RichPanel>
  );
}

// ─── Evolução temporal: Investimento × ROAS × Vendas + logs ─────────────────

const timeSeriesConfig = {
  investment: { label: "Investimento", color: "var(--palette-blue)" },
  roas: { label: "ROAS", color: "var(--palette-orange)" },
  sales: { label: "Vendas", color: "var(--palette-yellow)" },
  logs: { label: "Logs", color: "var(--palette-pink)" },
} satisfies ChartConfig;

function EvolucaoTemporalPanel({ range }: { range: { start: Date; end: Date } }) {
  const data = React.useMemo<DailyPoint[]>(
    () => filterDailyByRange(range.start, range.end),
    [range],
  );
  const empty = data.length === 0;
  const [modalPoint, setModalPoint] = React.useState<DailyPoint | null>(null);

  function handleBarClick(payload: unknown) {
    if (payload && typeof payload === "object" && "date" in payload) {
      setModalPoint(payload as DailyPoint);
    }
  }

  return (
    <RichPanel
      title="Tendência diária · investimento, ROAS e vendas"
      subtitle="Três métricas no mesmo eixo do tempo · barras inferiores mostram logs registrados — clique para ver as ações"
      toolbar={
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Diário · respeita filtros
        </span>
      }
    >
      <div className="p-5">
        {empty ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Sem dados no período selecionado.
          </p>
        ) : (
          <>
            <ChartContainer config={timeSeriesConfig} className="aspect-auto h-[260px] w-full">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
              >
                <defs>
                  <linearGradient id="investArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--palette-blue)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--palette-blue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B5ADB9", fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B5ADB9", fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={48}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B5ADB9", fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v)}×`}
                  width={40}
                />
                <YAxis yAxisId="sales" hide domain={[0, "dataMax + 4"]} />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
                  content={<TimeSeriesTooltip />}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="investment"
                  stroke="var(--palette-blue)"
                  strokeWidth={2}
                  fill="url(#investArea)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="roas"
                  stroke="var(--palette-orange)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="sales"
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--palette-yellow)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ChartContainer>

            <div className="mt-4 mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Logs realizados (nº · clique para detalhar)</span>
            </div>
            <ChartContainer config={timeSeriesConfig} className="aspect-auto h-[100px] w-full">
              <BarChart
                data={data}
                margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B5ADB9", fontSize: 10 }}
                  width={48}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={<LogsBarTooltip />}
                />
                <Bar
                  dataKey="logs"
                  fill="var(--palette-pink)"
                  radius={[2, 2, 0, 0]}
                  className="cursor-pointer"
                  onClick={handleBarClick}
                />
              </BarChart>
            </ChartContainer>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <LegendSwatch color="var(--palette-blue)" shape="area" label="Investimento (R$)" />
              <LegendSwatch color="var(--palette-orange)" shape="line" label="ROAS (×)" />
              <LegendSwatch color="var(--palette-yellow)" shape="line" label="Vendas/dia" />
              <LegendSwatch color="var(--palette-pink)" shape="bar" label="Logs/dia" />
              <span className="ml-auto text-[10px] normal-case tracking-normal text-muted-foreground/70">
                ⚠ vendas têm delay de atribuição
              </span>
            </div>
          </>
        )}
      </div>

      <LogsModal
        open={modalPoint !== null}
        date={modalPoint?.date ?? null}
        count={modalPoint?.logs ?? 0}
        onClose={() => setModalPoint(null)}
      />
    </RichPanel>
  );
}

function LegendSwatch({
  color,
  shape,
  label,
}: {
  color: string;
  shape: "line" | "area" | "bar";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {shape === "line" ? (
        <span className="block h-[2.5px] w-5 rounded-sm" style={{ backgroundColor: color }} />
      ) : shape === "area" ? (
        <span className="block h-2.5 w-5 rounded-sm opacity-50" style={{ backgroundColor: color }} />
      ) : (
        <span className="block h-3 w-2 rounded-sm" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  );
}

type TooltipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

const TIME_SERIES_LABELS: Record<string, string> = {
  investment: "Investimento",
  roas: "ROAS",
  sales: "Vendas",
};

function formatTimeSeriesValue(dataKey: string, value: number): string {
  if (dataKey === "roas") return `${fmtDec(value)}×`;
  if (dataKey === "investment") return fmtMoney(value);
  return fmtInt(value);
}

function TimeSeriesTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-white/10 pb-2 font-semibold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey);
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {TIME_SERIES_LABELS[key] ?? key}
              </span>
              <span className="font-mono font-semibold tabular-nums" style={{ color: item.color }}>
                {formatTimeSeriesValue(key, Number(item.value))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogsBarTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
}) {
  const item = payload?.[0];
  if (!active || !item) return null;
  return (
    <div className="min-w-[160px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-white/10 pb-2 font-semibold">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Logs registrados</span>
        <span className="font-mono font-semibold tabular-nums text-[var(--palette-pink)]">
          {fmtInt(Number(item.value))}
        </span>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        Clique para detalhar
      </p>
    </div>
  );
}
