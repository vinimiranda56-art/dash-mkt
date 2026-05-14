"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { FunnelChart, type FunnelStage } from "@/components/funnel-chart";
import { Panel } from "@/components/dashboards-shell";
import {
  DateRangePresetFilter,
  defaultDateValue,
  FilterBar,
  FilterCheckboxDropdown,
  type DateFilterValue,
} from "@/components/filter-controls";
import {
  ALL_FORMATS,
  ALL_PLATFORMS,
  cpa as calcCpa,
  cpl as calcCpl,
  cpProposal,
  cpVisit,
  filterDailyByRange,
  fmtDec,
  fmtInt,
  fmtMoney,
  fmtPct,
  generateDataset,
  PRACAS,
  sum,
  type DailyPoint,
  type FormatKey,
  type FormatRow,
  type Platform,
  type Praca,
} from "@/lib/dashboards-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/bar-chart";

type Dimension = "Formato" | "Praça" | "Plataforma";
const DIMENSIONS: Dimension[] = ["Formato", "Praça", "Plataforma"];

export function FunnelSection() {
  const dataset = React.useMemo(() => generateDataset(42), []);

  const [dateValue, setDateValue] = React.useState<DateFilterValue>(() => defaultDateValue());
  const [selectedPracas, setSelectedPracas] = React.useState<Praca[]>([...PRACAS]);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([...ALL_PLATFORMS]);
  const [selectedFormats, setSelectedFormats] = React.useState<FormatKey[]>([...ALL_FORMATS]);
  const [dimension, setDimension] = React.useState<Dimension>("Formato");

  const filtered = React.useMemo(
    () =>
      dataset.filter(
        (row) =>
          selectedPracas.includes(row.praca) &&
          selectedPlatforms.includes(row.platform) &&
          selectedFormats.includes(row.format),
      ),
    [dataset, selectedPracas, selectedPlatforms, selectedFormats],
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
        <FilterCheckboxDropdown
          label="Formato"
          options={ALL_FORMATS}
          values={selectedFormats}
          onChange={setSelectedFormats}
        />
      </FilterBar>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <FunnelPanel totals={totals} pracasSelected={selectedPracas.length} />
        <CostCards totals={totals} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ComparisonPanel
          rows={filtered}
          dimension={dimension}
          onDimensionChange={setDimension}
        />
        <ConversionDiagnosticPanel rows={filtered} dimension={dimension} />
      </div>

      <EvolucaoConversaoPanel range={dateValue.range} />
    </section>
  );
}

// ─── Funnel viz ──────────────────────────────────────────────────────────────

function FunnelPanel({
  totals,
  pracasSelected,
}: {
  totals: ReturnType<typeof sum>;
  pracasSelected: number;
}) {
  const stages: FunnelStage[] = [
    {
      label: "Leads",
      value: totals.leads || 1,
      displayValue: fmtInt(totals.leads),
      gradient: [
        { offset: "0%", color: "#3777FF" },
        { offset: "100%", color: "#6FA0FF" },
      ],
    },
    {
      label: "Propostas",
      value: totals.proposals || 1,
      displayValue: fmtInt(totals.proposals),
      gradient: [
        { offset: "0%", color: "#F26419" },
        { offset: "100%", color: "#FFA060" },
      ],
    },
    {
      label: "Visitas",
      value: totals.visits || 1,
      displayValue: fmtInt(totals.visits),
      gradient: [
        { offset: "0%", color: "#F92A82" },
        { offset: "100%", color: "#FF6AA8" },
      ],
    },
    {
      label: "Vendas",
      value: totals.sales || 1,
      displayValue: fmtInt(totals.sales),
      gradient: [
        { offset: "0%", color: "#F9C22E" },
        { offset: "100%", color: "#FFE08A" },
      ],
    },
  ];

  return (
    <Panel
      title="Funil de conversão"
      subtitle={
        pracasSelected === 0
          ? "Selecione ao menos uma praça para ver o funil"
          : `Lead → Proposta → Visita → Venda · volume absoluto em cada etapa (${
              pracasSelected === 1 ? "1 praça" : `${pracasSelected} praças`
            })`
      }
    >
      <div className="p-6">
        <FunnelChart
          className="min-h-[300px]"
          data={stages}
          edges="curved"
          gap={10}
          grid={{ bands: true, bandColor: "rgba(249,42,130,0.08)", lines: false }}
          labelAlign="center"
          labelLayout="spread"
          layers={4}
          orientation="horizontal"
          showLabels
          showPercentage
          showValues
          style={{ height: 320, aspectRatio: "auto" }}
        />
      </div>
    </Panel>
  );
}

function ConversionSteps({ totals }: { totals: ReturnType<typeof sum> }) {
  const stages = [
    { label: "Lead", qty: totals.leads },
    { label: "Proposta", qty: totals.proposals },
    { label: "Visita", qty: totals.visits },
    { label: "Venda", qty: totals.sales },
  ];
  const transitions = [
    totals.leads ? totals.proposals / totals.leads : 0,
    totals.proposals ? totals.visits / totals.proposals : 0,
    totals.visits ? totals.sales / totals.visits : 0,
  ];
  const overall = totals.leads ? totals.sales / totals.leads : 0;

  return (
    <div className="border-t border-white/10 px-5 py-5">
      <div className="flex items-stretch">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.label}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="grid size-12 place-items-center rounded-full border-2 border-[var(--palette-orange)] bg-[var(--surface-panel)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-base font-semibold tabular-nums">{fmtInt(stage.qty)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {stage.label}
              </p>
            </div>
            {i < transitions.length ? (
              <div className="flex flex-1 flex-col items-center justify-start pt-3.5">
                <div className="flex w-full items-center gap-1.5 text-[var(--palette-orange)]/70">
                  <span className="h-px flex-1 bg-current" />
                  <ChevronRight className="size-3.5" />
                </div>
                <p className="mt-1.5 text-sm font-bold tabular-nums text-[var(--palette-orange)]">
                  {fmtPct(transitions[i])}
                </p>
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  conversão
                </p>
              </div>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-xs">
        <span className="text-muted-foreground">Conversão lead → venda:</span>
        <span className="text-lg font-semibold text-[var(--palette-orange)]">
          {fmtPct(overall)}
        </span>
      </div>
    </div>
  );
}

// ─── Cost cards ──────────────────────────────────────────────────────────────

function CostCards({ totals }: { totals: ReturnType<typeof sum> }) {
  const cells = [
    {
      stage: "CPL · custo por lead",
      value: fmtMoney(calcCpl(totals)),
      sub: "−2,4% vs. ant.",
      dot: "var(--palette-blue)",
    },
    {
      stage: "CP · proposta",
      value: fmtMoney(cpProposal(totals)),
      sub: "+0,8% vs. ant.",
      dot: "var(--palette-orange)",
    },
    {
      stage: "CP · visita",
      value: fmtMoney(cpVisit(totals)),
      sub: "−3,1% vs. ant.",
      dot: "var(--palette-pink)",
    },
    {
      stage: "CPA · venda",
      value: fmtMoney(calcCpa(totals)),
      sub: "−5,8% vs. ant.",
      dot: "var(--palette-yellow)",
      featured: true,
    },
  ];

  return (
    <Panel
      title="Custo por etapa do funil"
      subtitle={`Quanto cada R$ investido custa em cada nível do pipeline · total ${fmtMoney(totals.investment)}`}
    >
      <div className="grid grid-cols-2">
        {cells.map((cell, i) => (
          <motion.div
            key={cell.stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
            className={cn(
              "relative px-5 py-5",
              i < 2 && "border-b border-white/10",
              i % 2 === 0 && "border-r border-white/10",
              cell.featured && "bg-[var(--palette-orange)]/8",
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: cell.dot }} />
              {cell.stage}
              {cell.featured ? (
                <Star className="ml-auto size-3 text-[var(--palette-orange)]" />
              ) : null}
            </div>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums tracking-tight",
                cell.featured && "text-[var(--palette-orange)]",
              )}
            >
              {cell.value}
            </p>
            <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{cell.sub}</p>
          </motion.div>
        ))}
      </div>
      <ConversionSteps totals={totals} />
    </Panel>
  );
}

// ─── Comparison table ────────────────────────────────────────────────────────

function ComparisonPanel({
  rows,
  dimension,
  onDimensionChange,
}: {
  rows: FormatRow[];
  dimension: Dimension;
  onDimensionChange: (d: Dimension) => void;
}) {
  const grouped = React.useMemo(() => groupBy(rows, dimension), [rows, dimension]);
  const totals = React.useMemo(() => sum(rows), [rows]);

  return (
    <Panel
      title="Comparativo por dimensão"
      subtitle="Volume, taxa de passagem e CPA em cada etapa · alterne a quebra para a leitura que importa"
      toolbar={
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Quebrar por
          </span>
          {DIMENSIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDimensionChange(d)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                d === dimension
                  ? "border-foreground bg-foreground text-background"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      }
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th rowSpan={2} className="px-4 py-3 align-bottom">
                {dimension}
              </th>
              <th colSpan={2} className="px-4 pb-1 pt-3 text-right italic tracking-normal text-muted-foreground/70">
                Lead
              </th>
              <th
                colSpan={2}
                className="border-l border-white/10 px-4 pb-1 pt-3 text-right italic tracking-normal text-muted-foreground/70"
              >
                Proposta
              </th>
              <th
                colSpan={2}
                className="border-l border-white/10 px-4 pb-1 pt-3 text-right italic tracking-normal text-muted-foreground/70"
              >
                Visita
              </th>
              <th
                colSpan={2}
                className="border-l border-white/10 px-4 pb-1 pt-3 text-right italic tracking-normal text-[var(--palette-orange)]"
              >
                Venda ★
              </th>
            </tr>
            <tr className="border-b border-white/10 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-2">Qtd</th>
              <th className="px-3 py-2">CPL</th>
              <th className="border-l border-white/10 px-3 py-2">Qtd</th>
              <th className="px-3 py-2">%</th>
              <th className="border-l border-white/10 px-3 py-2">Qtd</th>
              <th className="px-3 py-2">%</th>
              <th className="border-l border-white/10 px-3 py-2 text-[var(--palette-orange)]">Qtd</th>
              <th className="px-3 py-2">CPA</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ key, agg, badge }) => {
              const leadToProp = agg.leads ? agg.proposals / agg.leads : 0;
              const propToVisit = agg.proposals ? agg.visits / agg.proposals : 0;
              return (
                <tr
                  key={key}
                  className="border-b border-white/10 transition hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{key}</span>
                      {badge ? (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                            badge === "G"
                              ? "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]"
                              : "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]",
                          )}
                        >
                          {badge}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtInt(agg.leads)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtDec(calcCpl(agg))}</td>
                  <td className="border-l border-white/10 px-3 py-3 text-right tabular-nums">
                    {fmtInt(agg.proposals)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {fmtPct(leadToProp)}
                  </td>
                  <td className="border-l border-white/10 px-3 py-3 text-right tabular-nums">
                    {fmtInt(agg.visits)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {fmtPct(propToVisit)}
                  </td>
                  <td className="border-l border-white/10 px-3 py-3 text-right tabular-nums text-[var(--palette-orange)]">
                    {fmtInt(agg.sales)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtInt(calcCpa(agg))}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/30 bg-white/[0.04] font-semibold">
              <td className="px-4 py-3">Total</td>
              <td className="px-3 py-3 text-right tabular-nums">{fmtInt(totals.leads)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{fmtDec(calcCpl(totals))}</td>
              <td className="border-l border-white/10 px-3 py-3 text-right tabular-nums">
                {fmtInt(totals.proposals)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                {fmtPct(totals.leads ? totals.proposals / totals.leads : 0)}
              </td>
              <td className="border-l border-white/10 px-3 py-3 text-right tabular-nums">
                {fmtInt(totals.visits)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                {fmtPct(totals.proposals ? totals.visits / totals.proposals : 0)}
              </td>
              <td className="border-l border-white/10 px-3 py-3 text-right tabular-nums text-[var(--palette-orange)]">
                {fmtInt(totals.sales)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">{fmtInt(calcCpa(totals))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

type Grouped = {
  key: string;
  agg: ReturnType<typeof sum>;
  badge?: "G" | "M";
};

function groupBy(rows: FormatRow[], dimension: Dimension): Grouped[] {
  const map = new Map<string, FormatRow[]>();
  for (const row of rows) {
    const key =
      dimension === "Formato"
        ? row.format
        : dimension === "Praça"
          ? row.praca
          : row.platform;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  const out: Grouped[] = [];
  for (const [key, list] of map) {
    const agg = sum(list);
    let badge: "G" | "M" | undefined;
    if (dimension === "Formato") {
      const platform = list[0]?.platform;
      badge = platform === "Google" ? "G" : "M";
    } else if (dimension === "Plataforma") {
      badge = key === "Google" ? "G" : "M";
    }
    out.push({ key, agg, badge });
  }
  return out.sort((a, b) => b.agg.sales - a.agg.sales);
}

// ─── Evolução das taxas de conversão ─────────────────────────────────────────

const conversionConfig = {
  leadToProposta: { label: "Lead → Proposta", color: "var(--palette-blue)" },
  propostaToVisita: { label: "Proposta → Visita", color: "var(--palette-yellow)" },
  visitaToVenda: { label: "Visita → Venda", color: "var(--palette-orange)" },
} satisfies ChartConfig;

function EvolucaoConversaoPanel({ range }: { range: { start: Date; end: Date } }) {
  const data = React.useMemo<DailyPoint[]>(
    () => filterDailyByRange(range.start, range.end),
    [range],
  );
  const empty = data.length === 0;

  return (
    <Panel
      title="Evolução das taxas de conversão"
      subtitle="Diagnóstico por etapa — onde e quando o funil está vazando ao longo do tempo"
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
            <ChartContainer config={conversionConfig} className="aspect-auto h-[260px] w-full">
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
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
                  tickFormatter={(v) => `${Math.round(v)}%`}
                  width={42}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B5ADB9", fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v)}%`}
                  width={42}
                />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
                  content={<ConversionTooltip />}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leadToProposta"
                  stroke="var(--palette-blue)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="propostaToVisita"
                  stroke="var(--palette-yellow)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="visitaToVenda"
                  stroke="var(--palette-orange)"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <ConvSwatch color="var(--palette-blue)" label="Lead → Proposta (%)" />
              <ConvSwatch color="var(--palette-yellow)" label="Proposta → Visita (%) · eixo dir." />
              <ConvSwatch color="var(--palette-orange)" dashed label="Visita → Venda (%) · eixo dir." />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground/80">
              <span>Lead→Proposta: qualidade dos leads (marketing)</span>
              <span>Proposta→Visita: eficiência do SDR</span>
              <span>Visita→Venda: eficiência comercial</span>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

function ConvSwatch({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("block h-[2.5px] w-6 rounded-sm", dashed && "bg-transparent")}
        style={
          dashed
            ? { backgroundImage: `linear-gradient(90deg, ${color} 50%, transparent 50%)`, backgroundSize: "8px 2.5px", height: "2.5px" }
            : { backgroundColor: color }
        }
      />
      {label}
    </span>
  );
}

type ConvTooltipItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
};

const CONV_LABELS: Record<string, string> = {
  leadToProposta: "Lead → Proposta",
  propostaToVisita: "Proposta → Visita",
  visitaToVenda: "Visita → Venda",
};

function ConversionTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: ConvTooltipItem[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[200px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-white/10 pb-2 font-semibold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {CONV_LABELS[String(item.dataKey)] ?? String(item.dataKey)}
            </span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: item.color }}>
              {`${fmtDec(Number(item.value))}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Conversion diagnostic (grouped horizontal bars) ─────────────────────────

const DIAG_LABELS: Record<string, string> = {
  ltp: "Lead → Proposta",
  ptv: "Proposta → Visita",
  vtv: "Visita → Venda",
};

const diagConfig = {
  ltp: { label: "Lead → Proposta", color: "var(--palette-blue)" },
  ptv: { label: "Proposta → Visita", color: "var(--palette-yellow)" },
  vtv: { label: "Visita → Venda", color: "var(--palette-orange)" },
} satisfies ChartConfig;

function ConversionDiagnosticPanel({
  rows,
  dimension,
}: {
  rows: FormatRow[];
  dimension: Dimension;
}) {
  const grouped = React.useMemo(() => groupBy(rows, dimension), [rows, dimension]);
  const data = grouped.map((g) => ({
    name: g.key,
    ltp: g.agg.leads ? (g.agg.proposals / g.agg.leads) * 100 : 0,
    ptv: g.agg.proposals ? (g.agg.visits / g.agg.proposals) * 100 : 0,
    vtv: g.agg.visits ? (g.agg.sales / g.agg.visits) * 100 : 0,
  }));

  return (
    <Panel
      title="Diagnóstico por etapa"
      subtitle="Taxa de passagem em cada estágio · onde cada item vaza"
    >
      <div className="p-4">
        {data.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Sem dados no período filtrado.
          </p>
        ) : (
          <>
            <ChartContainer
              config={diagConfig}
              className="aspect-auto w-full"
              style={{ height: Math.max(160, data.length * 56) }}
            >
              <BarChart
                data={data}
                layout="vertical"
                barCategoryGap="22%"
                margin={{ top: 4, right: 28, bottom: 4, left: 0 }}
              >
                <XAxis type="number" hide domain={[0, "dataMax + 8"]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={92}
                  tick={{ fill: "#B5ADB9", fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(value: string) =>
                    value === "(bateria) lead_ad" ? "bateria lead_ad" : value
                  }
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={<DiagnosticTooltip />}
                />
                <Bar dataKey="ltp" fill="var(--palette-blue)" radius={[0, 3, 3, 0]} barSize={9} />
                <Bar dataKey="ptv" fill="var(--palette-yellow)" radius={[0, 3, 3, 0]} barSize={9} />
                <Bar dataKey="vtv" fill="var(--palette-orange)" radius={[0, 3, 3, 0]} barSize={9} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <DiagSwatch color="var(--palette-blue)" label="L→P" />
              <DiagSwatch color="var(--palette-yellow)" label="P→V" />
              <DiagSwatch color="var(--palette-orange)" label="V→V" />
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

function DiagSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="block size-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DiagnosticTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: ConvTooltipItem[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-white/10 pb-2 font-semibold">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {DIAG_LABELS[String(item.dataKey)] ?? String(item.dataKey)}
            </span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: item.color }}>
              {`${fmtDec(Number(item.value))}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


