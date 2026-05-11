"use client";

import { useEffect, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileBarChart,
  Gauge,
  Home,
  LineChartIcon,
  PieChartIcon,
  Plug,
  Settings2,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Sidebar as AppSidebar, type SidebarItem } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Tabs } from "@/components/ui/tabs";
import { MarketingChannelTable, type MarketingChannelRow } from "@/components/marketing-channel-table";
import { RoasAccordionTable, RoasHeatmap } from "@/components/roas-analysis-section";
import { FunnelChart, type FunnelStage } from "@/components/funnel-chart";
import { StatisticsCard2 } from "@/components/statistics-card-2";
import {
  ChartContainer as BarChartContainer,
  ChartTooltip as BarChartTooltip,
  type ChartConfig as BarChartConfig,
} from "@/components/bar-chart";

const kpis = [
  {
    label: "Investimento",
    value: "R$ 284k",
    delta: "+18,3%",
    trend: "up",
    icon: DollarSign,
    rows: [
      { label: "Meta Ads", value: "R$ 150.000,00" },
      { label: "Google Ads", value: "R$ 134.000,00" },
    ],
  },
  {
    label: "Receita",
    value: "R$ 771k",
    delta: "+27,4%",
    trend: "up",
    icon: Gauge,
    rows: [
      { label: "Meta Ads", value: "R$ 440.020,00" },
      { label: "Google Ads", value: "R$ 331.000,00" },
    ],
  },
  {
    label: "ROI",
    value: "271,3%",
    delta: "+12,6%",
    trend: "up",
    icon: TrendingUp,
    rows: [
      { label: "Meta Ads", value: "2,93" },
      { label: "Google Ads", value: "2,47" },
    ],
  },
];

const salesByChannel = [
  { channel: "Google Ads", revenue: 312, percent: 41 },
  { channel: "Meta Ads", revenue: 219, percent: 28 },
  { channel: "Organico", revenue: 134, percent: 17 },
  { channel: "Indicacao", revenue: 73, percent: 9 },
  { channel: "Email", revenue: 33, percent: 4 },
];

const revenueByMonth = [
  { month: "Jan", value: 542 },
  { month: "Fev", value: 498 },
  { month: "Mar", value: 632 },
  { month: "Abr", value: 589 },
  { month: "Mai", value: 771 },
  { month: "Jun", value: 0 },
  { month: "Jul", value: 0 },
  { month: "Ago", value: 0 },
  { month: "Set", value: 0 },
  { month: "Out", value: 0 },
  { month: "Nov", value: 0 },
  { month: "Dez", value: 0 },
];

const salesBarConfig = {
  revenue: {
    label: "Receita",
    color: "#3777FF",
  },
} satisfies BarChartConfig;

const revenueBarConfig = {
  value: {
    label: "Faturamento",
    color: "#F9C22E",
  },
} satisfies BarChartConfig;

const leadsTimeline = [
  { day: "01/05", total: 78, meta: 32, google: 24, organico: 15 },
  { day: "04/05", total: 128, meta: 59, google: 41, organico: 22 },
  { day: "07/05", total: 82, meta: 39, google: 27, organico: 14 },
  { day: "10/05", total: 164, meta: 72, google: 55, organico: 28 },
  { day: "13/05", total: 201, meta: 84, google: 68, organico: 36 },
  { day: "16/05", total: 153, meta: 69, google: 49, organico: 26 },
  { day: "19/05", total: 236, meta: 101, google: 75, organico: 42 },
  { day: "22/05", total: 177, meta: 81, google: 57, organico: 31 },
  { day: "25/05", total: 227, meta: 96, google: 72, organico: 39 },
  { day: "28/05", total: 262, meta: 112, google: 83, organico: 44 },
  { day: "31/05", total: 166, meta: 73, google: 51, organico: 29 },
];

const leadOrigins = [
  { name: "Google Ads", value: 1240, percent: 42, color: "#3777FF" },
  { name: "Meta Ads", value: 870, percent: 30, color: "#F92A82" },
  { name: "Organico", value: 530, percent: 18, color: "#F26419" },
  { name: "Indicacao", value: 210, percent: 7, color: "#F9C22E" },
  { name: "Email", value: 98, percent: 3, color: "#6D5E73" },
];

const funnelData: FunnelStage[] = [
  {
    label: "Leads",
    value: 2246,
    displayValue: "2.246",
    gradient: [
      { offset: "0%", color: "#F26419" },
      { offset: "100%", color: "#F26419" },
    ],
  },
  {
    label: "Propostas",
    value: 312,
    displayValue: "312",
    gradient: [
      { offset: "0%", color: "#3777FF" },
      { offset: "100%", color: "#6FA0FF" },
    ],
  },
  {
    label: "Visitas comercial",
    value: 87,
    displayValue: "87",
    gradient: [
      { offset: "0%", color: "#F92A82" },
      { offset: "100%", color: "#FF6AA8" },
    ],
  },
  {
    label: "Vendas",
    value: 42,
    displayValue: "42",
    gradient: [
      { offset: "0%", color: "#F9C22E" },
      { offset: "100%", color: "#FFE08A" },
    ],
  },
];

const channelRows: MarketingChannelRow[] = [
  {
    stage: "Leads",
    meta: { value: "R$ 150.000", quantity: "870", cpa: "R$ 172,41" },
    google: { value: "R$ 134.000", quantity: "1.240", cpa: "R$ 108,06" },
  },
  {
    stage: "Proposta",
    meta: { value: "R$ 43.500", quantity: "118", cpa: "R$ 1.271,19" },
    google: { value: "R$ 52.080", quantity: "194", cpa: "R$ 690,72" },
  },
  {
    stage: "Visitas",
    meta: { value: "R$ 29.600", quantity: "46", cpa: "R$ 3.260,87" },
    google: { value: "R$ 38.400", quantity: "61", cpa: "R$ 2.196,72" },
  },
  {
    stage: "Venda",
    meta: { value: "R$ 219.000", quantity: "18", cpa: "R$ 8.333,33" },
    google: { value: "R$ 312.000", quantity: "24", cpa: "R$ 5.583,33" },
  },
];

const navItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: <Home className="size-4" /> },
  { name: "Performance", href: "/dashboard", icon: <BarChart3 className="size-4" />, active: true },
  { name: "Orcamentos", href: "/orcamentos", icon: <LineChartIcon className="size-4" /> },
  { name: "Leads", href: "#", icon: <LineChartIcon className="size-4" /> },
  { name: "Metas", href: "#", icon: <Target className="size-4" /> },
  {
    name: "Relatorios",
    href: "#",
    icon: <FileBarChart className="size-4" />,
    items: [
      { name: "Canais", href: "#", icon: <PieChartIcon className="size-4" /> },
      { name: "Integracoes", href: "#", icon: <Plug className="size-4" /> },
      { name: "Equipe", href: "#", icon: <Users className="size-4" /> },
    ],
  },
];

const footerItems: SidebarItem[] = [
  { name: "Metas", href: "#", icon: <Target className="size-4" /> },
  { name: "Configuracoes", href: "#", icon: <Settings2 className="size-4" /> },
];

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const socialOptions = ["Mogi", "Indaiatuba", "Sanca", "BH", "Curitiba", "SJC", "Goias"];
const platformOptions = ["Google", "Meta"];

export function MarketingDashboard() {
  const [mounted, setMounted] = useState(false);
  const [revenuePage, setRevenuePage] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: { day: 1, month: 4, year: 2026 },
    end: { day: 10, month: 4, year: 2026 },
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedSocials, setSelectedSocials] = useState<string[]>(socialOptions);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(platformOptions);
  const visibleRevenueMonths = revenueByMonth.slice(
    revenuePage * 6,
    revenuePage * 6 + 6,
  );
  const hasPreviousRevenuePage = revenuePage > 0;
  const hasNextRevenuePage = (revenuePage + 1) * 6 < revenueByMonth.length;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <section className="flex-1 overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
            <header className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-foreground">
                  Dashboard de Performance
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">demo</p>
              </div>
              <div className="grid w-full grid-cols-2 items-center gap-2 sm:w-auto sm:grid-cols-[auto_200px_200px]">
                <div className="col-span-2 sm:col-span-1">
                  <DailyDatePicker
                    isOpen={isDatePickerOpen}
                    onOpenChange={setIsDatePickerOpen}
                    selectedRange={selectedDateRange}
                    onSelect={setSelectedDateRange}
                  />
                </div>
                <FilterCheckboxGroup
                  label="Social"
                  values={selectedSocials}
                  options={socialOptions}
                  onChange={setSelectedSocials}
                />
                <FilterCheckboxGroup
                  label="Plataforma"
                  values={selectedPlatforms}
                  options={platformOptions}
                  onChange={setSelectedPlatforms}
                />
              </div>
            </header>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(720px,1.35fr)_minmax(560px,1fr)]">
              <div className="flex flex-col gap-4">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {kpis.map((kpi) => (
                    <StatisticsCard2
                      key={kpi.label}
                      {...kpi}
                      trend={kpi.trend as "up" | "down"}
                    />
                  ))}
                </section>

                <ChartPanel className="min-h-[432px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold">Funil de Conversao</h2>
                      <p className="text-sm text-muted-foreground">Conversao etapa a etapa do pipeline</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Conversao Geral</p>
                      <p className="text-xl font-semibold">1,9%</p>
                    </div>
                  </div>
                  <FunnelChart
                    className="mt-6 min-h-[328px]"
                    data={funnelData}
                    edges="curved"
                    gap={10}
                    grid={{
                      bands: true,
                      bandColor: "rgba(249,42,130,0.12)",
                      lines: false,
                    }}
                    labelAlign="center"
                    labelLayout="spread"
                    layers={4}
                    orientation="horizontal"
                    showLabels
                    showPercentage
                    showValues
                    style={{ height: 328, aspectRatio: "auto" }}
                  />
                </ChartPanel>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-2">
                <ChartPanel className="min-h-[280px]">
                  <PanelTitle title="Vendas" subtitle="Agrupado por origem" />
                  <div className="h-[210px]">
                    {mounted ? (
                      <BarChartContainer
                        className="h-full aspect-auto"
                        config={salesBarConfig}
                      >
                        <BarChart data={salesByChannel} layout="vertical" margin={{ left: 0, right: 42 }}>
                          <XAxis type="number" hide domain={[0, 360]} />
                          <YAxis
                            type="category"
                            dataKey="channel"
                            width={88}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#B5ADB9", fontSize: 10 }}
                          />
                          <BarChartTooltip
                            content={<SalesTooltip />}
                            cursor={{ fill: "rgba(55,119,255,0.10)" }}
                          />
                          <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="#3777FF" barSize={24} minPointSize={28}>
                            <LabelList dataKey="revenue" content={renderSalesValueLabel} />
                            <LabelList dataKey="percent" content={renderSalesPercentLabel} />
                          </Bar>
                        </BarChart>
                      </BarChartContainer>
                    ) : (
                      <ChartFallback />
                    )}
                  </div>
                </ChartPanel>

                <ChartPanel className="min-h-[280px]">
                  <div className="flex items-start justify-between">
                    <PanelTitle title="Faturamento" subtitle="Agrupado por mes" />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Meses anteriores"
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-[var(--palette-yellow)] disabled:pointer-events-none disabled:opacity-30"
                        disabled={!hasPreviousRevenuePage}
                        onClick={() => setRevenuePage((page) => Math.max(0, page - 1))}
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <p className="min-w-[72px] text-right text-base font-semibold">R$ 3.0M</p>
                      <button
                        type="button"
                        aria-label="Proximos meses"
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-[var(--palette-yellow)] disabled:pointer-events-none disabled:opacity-30"
                        disabled={!hasNextRevenuePage}
                        onClick={() =>
                          setRevenuePage((page) =>
                            (page + 1) * 6 < revenueByMonth.length ? page + 1 : page,
                          )
                        }
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-[210px]">
                    {mounted ? (
                      <BarChartContainer
                        className="h-full aspect-auto"
                        config={revenueBarConfig}
                      >
                        <BarChart data={visibleRevenueMonths} margin={{ top: 34, right: 12, left: 6, bottom: 2 }}>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="month" axisLine={false} interval={0} minTickGap={10} tickLine={false} tick={{ fill: "#B5ADB9", fontSize: 11 }} />
                          <YAxis hide domain={[0, 820]} />
                          <BarChartTooltip
                            content={<RevenueTooltip />}
                            cursor={{ fill: "rgba(249,194,46,0.08)" }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                            {visibleRevenueMonths.map((item) => (
                              <Cell key={item.month} fill={item.month === "Mai" ? "#F9C22E" : item.value ? "#3777FF" : "#2B2030"} />
                            ))}
                            <LabelList dataKey="value" content={renderRevenueValueLabel} />
                          </Bar>
                        </BarChart>
                      </BarChartContainer>
                    ) : (
                      <ChartFallback />
                    )}
                  </div>
                </ChartPanel>

                <ChartPanel className="min-h-[280px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <PanelTitle title="Leads Gerados" subtitle="Detalhado por dia" />
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <LegendLine color="#F9C22E" label="Total" />
                        <LegendLine color="#F92A82" label="Meta Ads" />
                        <LegendLine color="#3777FF" label="Google Ads" />
                        <LegendLine color="#F26419" label="Organico" />
                      </div>
                    </div>
                    <p className="text-base font-semibold">2.246</p>
                  </div>
                  <div className="mt-2 h-[190px]">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={leadsTimeline} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
                          <defs>
                            <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F9C22E" stopOpacity={0.22} />
                              <stop offset="100%" stopColor="#F9C22E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#B5ADB9", fontSize: 11 }} interval={1} />
                          <YAxis hide />
                          <Tooltip
                            content={<LeadsTooltip />}
                            cursor={{
                              stroke: "rgba(249,194,46,0.55)",
                              strokeDasharray: "4 4",
                              strokeWidth: 1,
                            }}
                          />
                          <Area type="monotone" dataKey="total" stroke="none" fill="url(#leadFill)" />
                          <Line type="monotone" dataKey="total" stroke="#F9C22E" strokeWidth={2.5} dot={false} activeDot={{ r: 5, stroke: "#171219", strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="meta" stroke="#F92A82" strokeWidth={2.25} dot={false} activeDot={{ r: 4, stroke: "#171219", strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="google" stroke="#3777FF" strokeWidth={2.25} dot={false} activeDot={{ r: 4, stroke: "#171219", strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="organico" stroke="#F26419" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#171219", strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartFallback />
                    )}
                  </div>
                </ChartPanel>

                <ChartPanel className="min-h-[280px]">
                  <PanelTitle title="Origem dos Leads" subtitle="Agrupado por origem" />
                  <div className="grid h-[220px] grid-cols-[minmax(120px,1fr)_minmax(128px,0.9fr)] items-center gap-2">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={leadOrigins} dataKey="value" innerRadius="52%" outerRadius="82%" paddingAngle={2} stroke="#171219" strokeWidth={2}>
                            {leadOrigins.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<LeadOriginTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartFallback />
                    )}
                    <div className="space-y-3">
                      {leadOrigins.map((item) => (
                        <div key={item.name} className="grid grid-cols-[12px_1fr_auto_auto] items-center gap-2 text-xs">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-muted-foreground">{item.name}</span>
                          <span className="font-semibold">{item.value}</span>
                          <span className="text-[var(--text-soft)]">{item.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartPanel>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-1 pt-1">
              <div>
                <h2 className="text-xl font-semibold tracking-normal text-foreground">
                  Detalhamento por canal
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Meta Ads, Google Ads e canais organicos
                </p>
              </div>
              <Tabs
                expandable
                className="bg-[var(--surface-panel-strong)]/90 p-1"
                tabs={[
                  { id: "geral", label: "Geral", icon: BarChart3, color: "bg-[var(--palette-blue)]" },
                  { id: "canais", label: "Canais", icon: PieChartIcon, color: "bg-[var(--palette-pink)]" },
                  { id: "campanhas", label: "Campanhas", icon: FileBarChart, color: "bg-[var(--palette-orange)]" },
                ]}
              />
            </div>

            <ChartPanel className="p-4">
              <div className="sr-only">
                <PanelTitle title="Detalhamento por canal" subtitle="Meta Ads, Google Ads e canais organicos" />
              </div>
              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(460px,0.65fr)]">
                <MarketingChannelTable rows={channelRows} />
                <RoasHeatmap />
              </div>
            </ChartPanel>

            <RoasAccordionTable />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardSidebar() {
  return (
    <AppSidebar
      compact
      className="border-white/10 bg-[#0c090d]"
      items={navItems}
      footerItems={footerItems}
      logo={
        <div className="grid size-9 place-items-center rounded-xl bg-[var(--palette-blue)] text-white shadow-[0_0_24px_rgba(55,119,255,0.35)]">
          <Wallet className="size-5" />
        </div>
      }
    />
  );
}

function DailyDatePicker({
  selectedRange,
  isOpen,
  onOpenChange,
  onSelect,
}: {
  selectedRange: DateRangeValue;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (value: DateRangeValue) => void;
}) {
  const [viewDate, setViewDate] = useState({
    month: selectedRange.start.month,
    year: selectedRange.start.year,
  });
  const [selectingEnd, setSelectingEnd] = useState(false);
  const daysInMonth = getDaysInMonth(viewDate.month, viewDate.year);
  const firstWeekday = getFirstWeekday(viewDate.month, viewDate.year);
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function shiftMonth(direction: -1 | 1) {
    const nextMonth = viewDate.month + direction;

    if (nextMonth < 0) {
      setViewDate({ month: 11, year: viewDate.year - 1 });
      return;
    }

    if (nextMonth > 11) {
      setViewDate({ month: 0, year: viewDate.year + 1 });
      return;
    }

    setViewDate({ ...viewDate, month: nextMonth });
  }

  function selectDay(day: number) {
    const pickedDate = { day, month: viewDate.month, year: viewDate.year };

    if (!selectingEnd) {
      onSelect({ start: pickedDate, end: pickedDate });
      setSelectingEnd(true);
      return;
    }

    if (compareDateParts(pickedDate, selectedRange.start) < 0) {
      onSelect({ start: pickedDate, end: selectedRange.start });
    } else {
      onSelect({ start: selectedRange.start, end: pickedDate });
    }

    setSelectingEnd(false);
    onOpenChange(false);
  }

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        className="inline-flex h-9 min-w-[178px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[var(--surface-panel)] px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-[var(--surface-panel-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => onOpenChange(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenChange(!isOpen);
          }
        }}
      >
        <button
          type="button"
          aria-label="Mes anterior"
          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-white/10 hover:text-[var(--palette-yellow)]"
          onClick={(event) => {
            event.stopPropagation();
            shiftMonth(-1);
          }}
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <Calendar className="size-4" />
        <span className="flex-1 text-center tabular-nums">
          {formatDateRangeLabel(selectedRange)}
        </span>
        <button
          type="button"
          aria-label="Proximo mes"
          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-white/10 hover:text-[var(--palette-yellow)]"
          onClick={(event) => {
            event.stopPropagation();
            shiftMonth(1);
          }}
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-[304px] rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-[var(--palette-yellow)]"
              onClick={() => shiftMonth(-1)}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">
              {monthNames[viewDate.month]} {viewDate.year}
            </p>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-[var(--palette-yellow)]"
              onClick={() => shiftMonth(1)}
              aria-label="Proximo mes"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((weekday, index) => (
              <span key={`${weekday}-${index}`}>{weekday}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} className="size-9" />;
              }

              const cellDate = { day, month: viewDate.month, year: viewDate.year };
              const isStart = isSameDatePart(cellDate, selectedRange.start);
              const isEnd = isSameDatePart(cellDate, selectedRange.end);
              const isInRange =
                compareDateParts(cellDate, selectedRange.start) >= 0 &&
                compareDateParts(cellDate, selectedRange.end) <= 0;

              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    "grid size-9 place-items-center rounded-md text-sm font-medium text-muted-foreground transition",
                    "hover:bg-white/10 hover:text-foreground",
                    isInRange && "bg-[var(--palette-blue)]/15 text-foreground",
                    (isStart || isEnd) && "bg-[var(--palette-blue)] text-white hover:bg-[var(--palette-blue)] hover:text-white",
                  )}
                  onClick={() => {
                    selectDay(day);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {selectingEnd ? "Selecione a data final" : "Selecione a data inicial"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function FilterCheckboxGroup({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const allSelected = values.length === options.length;
  const buttonLabel = allSelected
    ? "Todos"
    : values.length === 0
      ? "Nenhum"
      : values.length === 1
        ? values[0]
        : `${values.length} selecionados`;

  function toggleOption(option: string, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...values, option])));
      return;
    }

    onChange(values.filter((value) => value !== option));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-white/10 bg-[var(--surface-panel)] px-3 text-sm text-foreground shadow-sm transition hover:bg-[var(--surface-panel-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="min-w-0 truncate">
            <span className="mr-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </span>
            <span className="font-semibold text-white">{buttonLabel}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[220px] border-white/10 bg-[var(--surface-panel)] text-foreground shadow-lg"
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={values.includes(option)}
            className="focus:bg-white/10 data-[state=checked]:text-white"
            onCheckedChange={(checked) => toggleOption(option, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type DatePart = { day: number; month: number; year: number };
type DateRangeValue = { start: DatePart; end: DatePart };

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

function datePartToTime(date: DatePart) {
  return new Date(date.year, date.month, date.day).getTime();
}

function compareDateParts(a: DatePart, b: DatePart) {
  return datePartToTime(a) - datePartToTime(b);
}

function isSameDatePart(a: DatePart, b: DatePart) {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

function formatDatePart(date: DatePart, includeYear: boolean) {
  return `${date.day} ${monthNames[date.month].slice(0, 3)}${includeYear ? ` ${date.year}` : ""}`;
}

function formatDateRangeLabel(range: DateRangeValue) {
  const sameYear = range.start.year === range.end.year;
  return `${formatDatePart(range.start, !sameYear)} - ${formatDatePart(range.end, true)}`;
}

function ChartPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("rounded-[22px] border border-white/10 bg-[var(--surface-panel)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]", className)}>
      {children}
    </Card>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

type LeadsTooltipPayloadItem = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  payload?: Record<string, unknown>;
  value?: number | string;
};

type LeadsTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: LeadsTooltipPayloadItem[];
};

const leadTooltipLabels: Record<string, string> = {
  total: "Total",
  meta: "Meta Ads",
  google: "Google Ads",
  organico: "Organico",
};

const leadTooltipOrder = ["total", "google", "meta", "organico"];

function LeadsTooltip({ active, label, payload }: LeadsTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const valuesByKey = new Map(
    payload.map((item) => [String(item.dataKey ?? item.name), item]),
  );

  return (
    <div className="min-w-[168px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <span className="font-semibold text-white">{label}</span>
        <span className="rounded-full bg-[var(--palette-yellow)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--palette-yellow)]">
          Leads
        </span>
      </div>
      <div className="space-y-1.5">
        {leadTooltipOrder.map((key) => {
          const item = valuesByKey.get(key);

          if (!item) {
            return null;
          }

          return (
            <div key={key} className="flex items-center justify-between gap-5">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 rounded-full shadow-[0_0_12px_currentColor]"
                  style={{ backgroundColor: item.color, color: item.color }}
                />
                {leadTooltipLabels[key]}
              </span>
              <span className="font-semibold tabular-nums" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SalesTooltip({ active, label, payload }: LeadsTooltipProps) {
  const item = payload?.[0];

  if (!active || !item) {
    return null;
  }

  const percent = typeof item.payload?.percent === "number" ? item.payload.percent : null;

  return (
    <div className="min-w-[150px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <span className="font-semibold text-white">{label}</span>
        {percent !== null ? (
          <span className="rounded-full bg-[var(--palette-blue)]/15 px-2 py-0.5 font-semibold text-[var(--palette-blue)]">
            {percent}%
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full bg-[var(--palette-blue)] shadow-[0_0_12px_rgba(55,119,255,0.8)]" />
          Receita
        </span>
        <span className="font-semibold tabular-nums text-[var(--palette-blue)]">
          R${item.value}k
        </span>
      </div>
    </div>
  );
}

function RevenueTooltip({ active, label, payload }: LeadsTooltipProps) {
  const item = payload?.[0];

  if (!active || !item) {
    return null;
  }

  return (
    <div className="min-w-[148px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <span className="font-semibold text-white">{label}</span>
        <span className="rounded-full bg-[var(--palette-yellow)]/15 px-2 py-0.5 font-semibold text-[var(--palette-yellow)]">
          Mes
        </span>
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full bg-[var(--palette-yellow)] shadow-[0_0_12px_rgba(249,194,46,0.8)]" />
          Faturamento
        </span>
        <span className="font-semibold tabular-nums text-[var(--palette-yellow)]">
          R${item.value}k
        </span>
      </div>
    </div>
  );
}

function LeadOriginTooltip({ active, payload }: LeadsTooltipProps) {
  const item = payload?.[0];

  if (!active || !item) {
    return null;
  }

  const percent = typeof item.payload?.percent === "number" ? item.payload.percent : null;
  const name = String(item.name ?? item.payload?.name ?? "Origem");
  const color = item.color ?? "#3777FF";

  return (
    <div className="min-w-[172px] rounded-xl border border-white/10 bg-[#0c090d]/95 p-3 text-xs text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-white">
          <span
            className="size-2 rounded-full shrink-0 shadow-[0_0_12px_currentColor]"
            style={{ backgroundColor: color, color }}
          />
          <span className="truncate">{name}</span>
        </span>
        {percent !== null ? (
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ backgroundColor: `${color}26`, color }}>
            {percent}%
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-muted-foreground">Leads</span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {item.value}
        </span>
      </div>
    </div>
  );
}

function ChartFallback() {
  return (
    <div className="flex h-full min-h-[160px] items-end gap-2">
      {[48, 68, 54, 78, 62, 86, 44].map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-t bg-[var(--surface-panel-strong)]"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

type RechartsLabelPayload = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
  index?: number;
};

function readLabelPayload(props: unknown): RechartsLabelPayload {
  if (!props || typeof props !== "object") {
    return {};
  }

  return props as RechartsLabelPayload;
}

function toNumber(value: number | string | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function renderSalesValueLabel(props: unknown) {
  const payload = readLabelPayload(props);
  const value = toNumber(payload.value);

  if (!value) {
    return null;
  }

  const x = toNumber(payload.x);
  const y = toNumber(payload.y);
  const width = toNumber(payload.width);
  const height = toNumber(payload.height);
  const isSmallBar = width < 54;
  const label = `R$${value}k`;

  return (
    <text
      dominantBaseline="middle"
      fill={isSmallBar ? "#B5ADB9" : "#fff"}
      fontSize={10}
      fontWeight={700}
      textAnchor={isSmallBar ? "start" : "end"}
      x={isSmallBar ? x + width + 5 : x + width - 6}
      y={y + height / 2}
    >
      {label}
    </text>
  );
}

function renderSalesPercentLabel(props: unknown) {
  const payload = readLabelPayload(props);
  const value = toNumber(payload.value);

  if (!value) {
    return null;
  }

  const x = toNumber(payload.x);
  const y = toNumber(payload.y);
  const width = toNumber(payload.width);
  const height = toNumber(payload.height);
  const isSmallBar = width < 54;

  return (
    <text
      dominantBaseline="middle"
      fill="#B5ADB9"
      fontSize={10}
      textAnchor="start"
      x={x + width + (isSmallBar ? 38 : 6)}
      y={y + height / 2}
    >
      {value}%
    </text>
  );
}

function renderRevenueValueLabel(props: unknown) {
  const payload = readLabelPayload(props);
  const value = toNumber(payload.value);

  if (!value) {
    return null;
  }

  const x = toNumber(payload.x);
  const y = toNumber(payload.y);
  const width = toNumber(payload.width);

  return (
    <text
      fill="#F9C22E"
      fontSize={9}
      fontWeight={700}
      textAnchor="middle"
      x={x + width / 2}
      y={Math.max(10, y - 6)}
    >
      {`R$${value}k`}
    </text>
  );
}
