"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Calendar,
  Check,
  Database,
  Download,
  FileBarChart,
  Filter,
  Home,
  LineChartIcon,
  Pencil,
  PieChartIcon,
  Plug,
  Plus,
  RefreshCcw,
  Settings2,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sidebar as AppSidebar, type SidebarItem } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type BudgetTab = "overview" | "detail";
type BudgetLevel = "social" | "unit" | "format";
type InputMode = "value" | "percent";
type CityBudget = typeof cityBudgets[number];
type BudgetModalMode = "create" | "edit";
type BudgetModalDraft = {
  mode: BudgetModalMode;
  level: BudgetLevel;
  inputMode: InputMode;
  socialId: string;
  unit: string;
};
type BudgetItem = {
  id: string;
  label: string;
  description: string;
  reference: number;
};

const navItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: <Home className="size-4" /> },
  { name: "Performance", href: "/dashboard", icon: <BarChart3 className="size-4" /> },
  { name: "Orcamentos", href: "/orcamentos", icon: <LineChartIcon className="size-4" />, active: true },
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

const kpis = [
  { label: "Planejado total", value: "R$ 2,0M", icon: Briefcase, tone: "blue" },
  { label: "Atual ativo", value: "R$ 2,0M", icon: Database, tone: "blue" },
  { label: "Variacao", value: "-0,3%", icon: ArrowDownRight, tone: "yellow" },
  { label: "Previsao 30d", value: "R$ 2,7M", icon: Calendar, tone: "yellow" },
];

const cityBudgets = [
  { id: 0, title: "Social 0", city: "Mogi", planned: 260, actual: 259, diff: -0.5, rows: [["Lead_ad", 120, 116.4, -3.6], ["Form", 80, 84.5, 4.5], ["Bateria", 60, 57.8, -2.2]] },
  { id: 1, title: "Social 1", city: "Indaiatuba", planned: 320, actual: 320.3, diff: 0.1, rows: [["Lead_ad", 150, 142.3, -7.7], ["Form", 100, 108.9, 8.9], ["Bateria", 70, 69.1, -0.9]] },
  { id: 2, title: "Social 2", city: "Sao Carlos", planned: 280, actual: 285.3, diff: 1.9, rows: [["Lead_ad", 130, 135.6, 5.6], ["Form", 90, 87.4, -2.6], ["Bateria", 60, 62.3, 2.3]] },
  { id: 3, title: "Social 3", city: "BH", planned: 330, actual: 318, diff: -3.6, rows: [["Lead_ad", 140, 129.2, -10.8], ["Form", 110, 111.6, 1.6], ["Bateria", 80, 77.2, -2.8]] },
  { id: 4, title: "Social 4", city: "Curitiba", planned: 370, actual: 373.4, diff: 0.9, rows: [["Lead_ad", 160, 155.1, -4.9], ["Form", 120, 124.7, 4.7], ["Bateria", 90, 93.6, 3.6]] },
  { id: 5, title: "Social 5", city: "SJC", planned: 230, actual: 225.1, diff: -2.1, rows: [["Lead_ad", 110, 104.7, -5.3], ["Form", 70, 71.8, 1.8], ["Bateria", 50, 48.6, -1.4]] },
  { id: 6, title: "Social 6", city: "Goias", planned: 190, actual: 192.6, diff: 1.4, rows: [["Lead_ad", 90, 93.2, 3.2], ["Form", 55, 53.2, -1.8], ["Bateria", 45, 46.4, 1.4]] },
];

const matrixRows = [
  { short: "Mogi", name: "Mogi das Cruzes", values: [-3.0, 5.6, -3.7], amounts: ["R$ -4k", "+R$ 5k", "R$ -2k"], total: -0.5, actual: "R$ 259k", planned: "R$ 260k" },
  { short: "Indaiatuba", name: "Indaiatuba", values: [-5.1, 8.9, -1.3], amounts: ["R$ -8k", "+R$ 9k", "-R$ 900"], total: 0.1, actual: "R$ 320k", planned: "R$ 320k" },
  { short: "Sao Carlos", name: "Sao Carlos", values: [4.3, -2.9, 3.8], amounts: ["+R$ 6k", "R$ -3k", "+R$ 2k"], total: 1.9, actual: "R$ 285k", planned: "R$ 280k" },
  { short: "BH", name: "Belo Horizonte", values: [-7.7, 1.5, -3.5], amounts: ["R$ -11k", "+R$ 2k", "R$ -3k"], total: -3.6, actual: "R$ 318k", planned: "R$ 330k" },
  { short: "Curitiba", name: "Curitiba - PR", values: [-3.1, 3.9, 4.0], amounts: ["R$ -5k", "+R$ 5k", "+R$ 4k"], total: 0.9, actual: "R$ 373k", planned: "R$ 370k" },
  { short: "SJC", name: "Sao Jose dos Campos", values: [-4.8, 2.6, -2.8], amounts: ["R$ -5k", "+R$ 2k", "R$ -1k"], total: -2.1, actual: "R$ 225k", planned: "R$ 230k" },
  { short: "Goias", name: "Goias", values: [3.6, -3.2, 3.3], amounts: ["+R$ 3k", "R$ -2k", "+R$ 1k"], total: 1.4, actual: "R$ 193k", planned: "R$ 190k" },
];

const formats = ["Lead_ad", "Form", "Bateria"];
const unitOptions = ["BR", "SP", "RJ"];

const budgetLevels: Array<{ id: BudgetLevel; label: string; description: string }> = [
  { id: "social", label: "Social", description: "Define o total por praca Social." },
  { id: "unit", label: "Social > Unidade", description: "Divide o total da praca entre BR, SP e RJ." },
  { id: "format", label: "Social > Unidade > Formato", description: "Define cada Lead_ad, Form e Bateria." },
];

const detailRows = cityBudgets.flatMap((city) => [
  { kind: "Social", name: `${city.title} - ${city.city}`, planned: `R$ ${money(city.planned)}`, actual: `R$ ${money(city.actual)}`, diff: diffMoney(city.actual - city.planned), pct: formatSignedPercent(city.diff), source: "-" },
  ...city.rows.map(([name, planned, actual, diff]) => ({
    kind: "fmt",
    name: String(name),
    planned: `R$ ${money(Number(planned))}`,
    actual: `R$ ${money(Number(actual))}`,
    diff: diffMoney(Number(diff)),
    pct: "",
    source: name === "Form" ? "ADSET" : "CAMPAIGN",
  })),
]);

export function BudgetControlDashboard() {
  const [activeTab, setActiveTab] = useState<BudgetTab>("overview");
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetModalDraft, setBudgetModalDraft] = useState<BudgetModalDraft>(() => getDefaultBudgetModalDraft());

  function openCreateBudgetModal() {
    setBudgetModalDraft(getDefaultBudgetModalDraft());
    setBudgetModalOpen(true);
  }

  function openEditBudgetModal(cityId: number) {
    setBudgetModalDraft({
      mode: "edit",
      level: "format",
      inputMode: "value",
      socialId: String(cityId),
      unit: "BR",
    });
    setBudgetModalOpen(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <BudgetSidebar />
        <section className="flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1660px] flex-col gap-4">
            <PageHeader onOpenBudgetModal={openCreateBudgetModal} />
            <KpiStrip />
            <BudgetTabs activeTab={activeTab} onChange={setActiveTab} />
            {activeTab === "overview" ? <OverviewTab /> : <DetailTab onEditBudgetModal={openEditBudgetModal} onOpenBudgetModal={openCreateBudgetModal} />}
          </div>
        </section>
      </div>
      {budgetModalOpen ? (
        <BudgetPlannerModal
          key={`${budgetModalDraft.mode}-${budgetModalDraft.level}-${budgetModalDraft.socialId}-${budgetModalDraft.unit}-${budgetModalDraft.inputMode}`}
          initialDraft={budgetModalDraft}
          onClose={() => setBudgetModalOpen(false)}
        />
      ) : null}
    </main>
  );
}

function PageHeader({ onOpenBudgetModal }: { onOpenBudgetModal: () => void }) {
  return (
    <header className="flex flex-col gap-4 pt-2 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--palette-blue)]">
          Command Center - Meta Ads
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Controle de Orcamentos</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Snapshot 08/05/2026 14:32</span>
          <span>-</span>
          <span>21 itens classificados</span>
          <span>-</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--palette-blue)]" />
            cache valido
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button className="border-white/10 bg-transparent hover:bg-white/10" variant="outline" onClick={onOpenBudgetModal}>
          <Plus className="size-4" />
          Definir orcamentos
        </Button>
        <Button>
          <RefreshCcw className="size-4" />
          Atualizar dados
        </Button>
      </div>
    </header>
  );
}

function KpiStrip() {
  return (
    <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
      <CardContent className="grid grid-cols-1 divide-y divide-white/10 p-0 md:grid-cols-4 md:divide-x md:divide-y-0">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-4 px-6 py-5">
            <span className={cn("grid size-11 place-items-center rounded-xl", iconTone(kpi.tone))}>
              <kpi.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{kpi.label}</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", kpi.tone === "yellow" && kpi.label === "Variacao" && "text-[var(--palette-yellow)]")}>
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BudgetTabs({ activeTab, onChange }: { activeTab: BudgetTab; onChange: (tab: BudgetTab) => void }) {
  const tabs = [
    { id: "overview" as const, title: "Visao Geral", subtitle: "Grafico + Cards por Praca" },
    { id: "detail" as const, title: "Orcamentos & Detalhamento", subtitle: "Controle + Tabela hierarquica" },
  ];

  return (
    <div className="border-b border-white/10">
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              className={cn(
                "min-w-[170px] border-b-2 px-5 pb-3 pt-2 text-left transition",
                selected ? "border-[var(--palette-blue)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              type="button"
              onClick={() => onChange(tab.id)}
            >
              <span className="block text-sm font-semibold">{tab.title}</span>
              <span className="mt-1 block text-xs">{tab.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>(() => cityBudgets.map((city) => city.id));
  const [selectedFormats, setSelectedFormats] = useState<string[]>(() => [...formats]);
  const [activeOnly, setActiveOnly] = useState(true);

  const visibleBudgets = useMemo(
    () => cityBudgets
      .filter((city) => selectedCityIds.includes(city.id))
      .map((city) => filterCityBudgetByFormat(city, selectedFormats)),
    [selectedCityIds, selectedFormats],
  );

  function toggleCity(cityId: number) {
    setSelectedCityIds((current) => (
      current.includes(cityId)
        ? current.filter((id) => id !== cityId)
        : [...current, cityId]
    ));
  }

  function toggleAllCities() {
    setSelectedCityIds((current) => (
      current.length === cityBudgets.length ? [] : cityBudgets.map((city) => city.id)
    ));
  }

  function toggleFormat(format: string) {
    setSelectedFormats((current) => (
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format]
    ));
  }

  function resetFilters() {
    setSelectedCityIds(cityBudgets.map((city) => city.id));
    setSelectedFormats([...formats]);
    setActiveOnly(true);
  }

  return (
    <>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
          <CardHeader>
            <CardTitle className="text-base">Planejado vs Atual por Praca</CardTitle>
            <CardDescription>Comparativo agregado por unidade Social</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetBars cities={visibleBudgets} />
          </CardContent>
        </Card>
        <OverviewAside
          activeOnly={activeOnly}
          onReset={resetFilters}
          onToggleActiveOnly={() => setActiveOnly((current) => !current)}
          onToggleAllCities={toggleAllCities}
          onToggleCity={toggleCity}
          onToggleFormat={toggleFormat}
          selectedCityIds={selectedCityIds}
          selectedFormats={selectedFormats}
          visibleBudgets={visibleBudgets}
        />
      </section>
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Pracas - clique num card para drill-down
        </p>
        {visibleBudgets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleBudgets.map((city) => (
            <CityCard key={city.id} city={city} />
            ))}
          </div>
        ) : (
          <EmptyFilterState />
        )}
      </section>
    </>
  );
}

function DetailTab({
  onEditBudgetModal,
  onOpenBudgetModal,
}: {
  onEditBudgetModal: (cityId: number) => void;
  onOpenBudgetModal: () => void;
}) {
  return (
    <>
      <ControlPanel onEditBudgetModal={onEditBudgetModal} onOpenBudgetModal={onOpenBudgetModal} />
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <VariationMatrix />
        <SelectedBudgetCard />
      </section>
      <BudgetDetailTable />
    </>
  );
}

function BudgetBars({ cities }: { cities: CityBudget[] }) {
  const max = Math.max(120, ...cities.flatMap((city) => [city.planned, city.actual])) * 1.16;

  if (cities.length === 0) {
    return <EmptyFilterState />;
  }

  return (
    <div className="h-[520px] px-4 pb-4 pt-8">
      <div
        className="grid h-full items-end gap-5 border-b border-white/10"
        style={{ gridTemplateColumns: `repeat(${cities.length}, minmax(72px, 1fr))` }}
      >
        {cities.map((city) => {
          const over = city.actual > city.planned;
          const actualColor = over ? "bg-[var(--palette-orange)]" : "bg-[var(--palette-blue)]/80";

          return (
            <div key={city.id} className="flex h-full flex-col items-center justify-end gap-2">
              <div className="flex h-[390px] w-full items-end justify-center gap-2">
                <Bar value={city.planned} max={max} label={`R$ ${city.planned}k`} className="bg-[var(--palette-blue)]" />
                <Bar value={city.actual} max={max} label={`R$ ${Math.round(city.actual)}k`} className={actualColor} />
              </div>
              <p className="mt-2 text-center text-base font-semibold text-muted-foreground">{city.city}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-8 text-sm text-muted-foreground">
        <LegendSwatch color="bg-[var(--palette-blue)]" label="Planejado" />
        <LegendSwatch color="bg-[var(--palette-blue)]/80" label="Atual (abaixo)" />
        <LegendSwatch color="bg-[var(--palette-orange)]" label="Atual (acima)" />
      </div>
    </div>
  );
}

function Bar({ value, max, label, className }: { value: number; max: number; label: string; className: string }) {
  return (
    <div className="flex h-full flex-1 flex-col justify-end">
      <p className="mb-2 text-center text-sm font-semibold text-muted-foreground">{label}</p>
      <div className={cn("min-h-8 rounded-md", className)} style={{ height: `${(value / max) * 100}%` }} />
    </div>
  );
}

function OverviewAside({
  activeOnly,
  onReset,
  onToggleActiveOnly,
  onToggleAllCities,
  onToggleCity,
  onToggleFormat,
  selectedCityIds,
  selectedFormats,
  visibleBudgets,
}: {
  activeOnly: boolean;
  onReset: () => void;
  onToggleActiveOnly: () => void;
  onToggleAllCities: () => void;
  onToggleCity: (cityId: number) => void;
  onToggleFormat: (format: string) => void;
  selectedCityIds: number[];
  selectedFormats: string[];
  visibleBudgets: CityBudget[];
}) {
  const allCitiesSelected = selectedCityIds.length === cityBudgets.length;
  const totalPlanned = visibleBudgets.reduce((sum, city) => sum + city.planned, 0);
  const belowCount = visibleBudgets.filter((city) => city.actual <= city.planned).length;
  const health = visibleBudgets.length === 0 ? 0 : Math.round((belowCount / visibleBudgets.length) * 100);
  const formatTotals = selectedFormats.map((format) => {
    const total = visibleBudgets.reduce((sum, city) => {
      const row = city.rows.find(([name]) => name === format);
      return sum + (row ? Number(row[2]) : 0);
    }, 0);
    const planned = visibleBudgets.reduce((sum, city) => {
      const row = city.rows.find(([name]) => name === format);
      return sum + (row ? Number(row[1]) : 0);
    }, 0);
    return { name: format, value: `R$ ${money(total)}k`, diff: planned === 0 ? 0 : ((total - planned) / planned) * 100 };
  });

  return (
    <aside className="flex flex-col gap-4">
      <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Filter className="size-4" />
              Filtros
            </CardTitle>
            <button className="text-xs font-semibold text-[var(--palette-blue)]" type="button" onClick={onReset}>Limpar</button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Praca</p>
            <div className="space-y-2 rounded-xl border border-white/10 bg-background/70 p-2">
              <FilterCheckRow checked={allCitiesSelected} label="Todas as pracas" onClick={onToggleAllCities} />
              <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                {cityBudgets.map((city) => (
                  <FilterCheckRow
                    key={city.id}
                    checked={selectedCityIds.includes(city.id)}
                    label={`${city.title} - ${city.city}`}
                    onClick={() => onToggleCity(city.id)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Formato</p>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    selectedFormats.includes(format)
                      ? "border-[var(--palette-blue)] bg-[var(--palette-blue)] text-white shadow-[0_0_18px_rgba(55,119,255,0.22)]"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                  )}
                  onClick={() => onToggleFormat(format)}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm" type="button" onClick={onToggleActiveOnly}>
            <span className={cn("grid size-4 place-items-center rounded border", activeOnly ? "border-[var(--palette-blue)] bg-[var(--palette-blue)] text-white" : "border-white/20 bg-transparent")}>
              {activeOnly ? <Check className="size-3" /> : null}
            </span>
            Apenas ativos
          </button>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
        <CardHeader className="pb-2">
          <CardDescription>Saude do orcamento</CardDescription>
          <CardTitle className="text-3xl text-[var(--palette-yellow)]">{health}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[var(--palette-yellow)]" style={{ width: `${health}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{belowCount} abaixo - {Math.max(visibleBudgets.length - belowCount, 0)} acima</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
        <CardHeader className="pb-2">
          <CardDescription>Maiores desvios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...visibleBudgets]
            .sort((left, right) => Math.abs(right.diff) - Math.abs(left.diff))
            .slice(0, 3)
            .map((city) => (
            <div key={city.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted-foreground">{city.city}</span>
              <span className={variationText(city.diff)}>{formatSignedPercent(city.diff)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
        <CardHeader className="pb-2">
          <CardDescription>Por formato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formatTotals.length > 0 ? formatTotals.map(({ name, value, diff }) => (
            <div key={name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{name}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={cn("h-full rounded-full", diff > 0 ? "bg-[var(--palette-orange)]" : "bg-[var(--palette-blue)]")} style={{ width: `${Math.min(100, 65 + Math.abs(diff) * 5)}%` }} />
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Selecione um formato para ver os totais.</p>
          )}
          <p className="border-t border-white/10 pt-3 text-xs text-muted-foreground">Total filtrado: R$ {money(totalPlanned)}k</p>
        </CardContent>
      </Card>
    </aside>
  );
}

function FilterCheckRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-white/[0.06]"
      onClick={onClick}
    >
      <span className={cn("grid size-4 shrink-0 place-items-center rounded border", checked ? "border-[var(--palette-blue)] bg-[var(--palette-blue)] text-white" : "border-white/20 bg-transparent")}>
        {checked ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function EmptyFilterState() {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
      Nenhum dado para os filtros selecionados.
    </div>
  );
}

function CityCard({ city }: { city: typeof cityBudgets[number] }) {
  return (
    <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]">
              <Users className="size-5" />
            </span>
            <div>
              <CardTitle className="text-lg">{city.title}</CardTitle>
              <CardDescription>{city.city}</CardDescription>
            </div>
          </div>
          <Badge className="border-[var(--palette-blue)]/20 bg-[var(--palette-blue)]/12 text-[var(--palette-blue)]" variant="outline">Ativo</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="py-2 text-left">Formato</th>
              <th className="py-2 text-right">Planejado</th>
              <th className="py-2 text-right">Atual</th>
              <th className="py-2 text-right">Dif.</th>
            </tr>
          </thead>
          <tbody>
            {city.rows.map(([name, planned, actual, diff]) => (
              <tr key={String(name)} className="border-t border-white/10">
                <td className="py-2 font-semibold">{name}</td>
                <td className="py-2 text-right tabular-nums">R$ {money(Number(planned))}</td>
                <td className="py-2 text-right tabular-nums">R$ {money(Number(actual))}</td>
                <td className="py-2 text-right">
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold tabular-nums", Number(diff) > 0 ? "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]" : "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]")}>
                    {diffMoney(Number(diff))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-semibold">
          <span>Total</span>
          <span className={variationText(city.diff)}>{formatSignedPercent(city.diff)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ControlPanel({
  onEditBudgetModal,
  onOpenBudgetModal,
}: {
  onEditBudgetModal: (cityId: number) => void;
  onOpenBudgetModal: () => void;
}) {
  return (
    <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-base">Controle de Orcamentos</CardTitle>
            <CardDescription className="mt-2 max-w-[720px]">
              Defina valores planejados manualmente em 3 niveis: Social, Social x Unidade ou Social x Unidade x Formato.
              Aceita valor absoluto (R$) ou porcentagem do total.
            </CardDescription>
            <div className="mt-5 grid grid-cols-3 gap-8">
              <InfoMetric label="Total planejado" value="R$ 1.980.000" />
              <InfoMetric label="Pracas configuradas" value="7/7" />
              <InfoMetric label="Ultima edicao" value="07/05 - 18:04" />
            </div>
          </div>
          <Button className="min-w-[190px]" onClick={onOpenBudgetModal}>
            <Plus className="size-4" />
            Definir orcamentos
          </Button>
        </div>
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Distribuicao atual por praca</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {cityBudgets.map((city) => (
              <div key={city.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{city.title}</p>
                    <p className="text-xs text-muted-foreground">{city.city}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar orcamento de ${city.title} - ${city.city}`}
                    className="grid size-7 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-[var(--palette-blue)]/40 hover:bg-[var(--palette-blue)]/12 hover:text-[var(--palette-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-blue)]"
                    onClick={() => onEditBudgetModal(city.id)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
                <p className="mt-4 font-semibold">R$ {city.planned}k</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[var(--palette-blue)]" style={{ width: `${(city.planned / 370) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDecimal((city.planned / 1980) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VariationMatrix() {
  return (
    <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Matriz de Variacao - Praca x Formato</CardTitle>
            <CardDescription>
              Azul = abaixo do planejado. Laranja = acima. Clique numa celula para ver detalhes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>-15%</span>
            <span className="h-2 w-36 rounded-full bg-gradient-to-r from-[var(--palette-blue)] via-[var(--palette-yellow)] to-[var(--palette-orange)]" />
            <span>+15%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[150px_repeat(3,minmax(130px,1fr))_120px] gap-2 text-sm">
          <div />
          {formats.map((format) => <MatrixHead key={format}>{format}</MatrixHead>)}
          <MatrixHead>Total</MatrixHead>
          {matrixRows.map((row, rowIndex) => (
            <div key={row.short} className="contents">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="grid size-7 place-items-center rounded-lg border border-white/10 text-xs text-[var(--palette-blue)]">{rowIndex}</span>
                <div>
                  <p className="font-semibold">{row.short}</p>
                  <p className="text-xs text-muted-foreground">{row.name}</p>
                </div>
              </div>
              {row.values.map((value, index) => (
                <MatrixCell key={`${row.short}-${formats[index]}`} amount={row.amounts[index]} value={value} />
              ))}
              <div className="flex flex-col items-end justify-center rounded-lg px-3 py-2 text-right">
                <span className={cn("font-semibold", variationText(row.total))}>{formatSignedPercent(row.total)}</span>
                <span className="mt-1 text-xs text-muted-foreground">{row.actual} / {row.planned}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MatrixHead({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</div>;
}

function MatrixCell({ value, amount }: { value: number; amount: string }) {
  const positive = value > 0;
  return (
    <div className={cn("grid min-h-[58px] place-items-center rounded-lg px-4 py-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]", positive ? "bg-[var(--palette-orange)]/28" : "bg-[var(--palette-blue)]/22")}>
      <div>
        <p className="text-base font-semibold tabular-nums">{formatSignedPercent(value)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{amount}</p>
      </div>
    </div>
  );
}

function SelectedBudgetCard() {
  return (
    <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
      <CardHeader>
        <CardDescription>Social 1 - Form</CardDescription>
        <CardTitle className="text-2xl">Indaiatuba</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {["BR", "SP", "RJ", "adset"].map((tag) => (
            <Badge key={tag} className="border-white/10 bg-white/8 text-muted-foreground" variant="outline">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoMetric label="Planejado" value="R$ 100.000" />
          <InfoMetric label="Atual ativo" value="R$ 108.900" />
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Execucao do</span>
            <span className="font-semibold text-[var(--palette-orange)]">108,9%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-[var(--palette-orange)]" />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--palette-orange)]/30 bg-[var(--palette-orange)]/12 p-4">
          <p className="flex items-center gap-2 font-semibold text-[var(--palette-orange)]">
            <ArrowUpRight className="size-4" />
            Acima do planejado
          </p>
          <p className="mt-3 font-semibold">+R$ 8.900 - +8,9% vs planejado</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetDetailTable() {
  return (
    <Card className="rounded-xl border-white/10 bg-[var(--surface-panel)]">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Detalhamento por Social, Unidade e Formato</CardTitle>
          <CardDescription>Clique numa linha para expandir os formatos</CardDescription>
        </div>
        <Button className="border-white/10 bg-transparent hover:bg-white/10" variant="outline">
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="px-6">Social / Formato</TableHead>
              <TableHead className="text-center">Planejado</TableHead>
              <TableHead className="text-center">Atual</TableHead>
              <TableHead className="text-center">Diferenca</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailRows.map((row, index) => {
              const positive = row.diff.startsWith("+");
              const isFormat = row.kind === "fmt";
              return (
                <TableRow key={`${row.name}-${index}`} className="border-white/10 hover:bg-white/[0.06]">
                  <TableCell className={cn("px-6 font-semibold", isFormat && "pl-14 font-medium text-muted-foreground")}>
                    {row.name}
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums">{row.planned}</TableCell>
                  <TableCell className="text-center font-medium tabular-nums">{row.actual}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold tabular-nums", positive ? "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]" : "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]")}>
                      {row.diff} {row.pct}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BudgetPlannerModal({
  initialDraft,
  onClose,
}: {
  initialDraft: BudgetModalDraft;
  onClose: () => void;
}) {
  const [level, setLevel] = useState<BudgetLevel>(initialDraft.level);
  const [inputMode, setInputMode] = useState<InputMode>(initialDraft.inputMode);
  const [socialId, setSocialId] = useState(initialDraft.socialId);
  const [unit, setUnit] = useState(initialDraft.unit);
  const items = useMemo(() => getBudgetItems(level, Number(socialId), unit), [level, socialId, unit]);
  const [values, setValues] = useState<Record<string, number>>(() => getDefaultBudgetValues(items, initialDraft.inputMode));
  const selectedSocial = cityBudgets.find((city) => city.id === Number(socialId));
  const isEditing = initialDraft.mode === "edit";

  const total = items.reduce((sum, item) => sum + (values[item.id] ?? 0), 0);
  const percentModeInvalid = inputMode === "percent" && Math.round(total * 100) / 100 !== 100;
  const valueTotal = inputMode === "value"
    ? total
    : items.reduce((sum, item) => sum + item.reference * ((values[item.id] ?? 0) / 100), 0);

  function updateValue(itemId: string, nextValue: string) {
    const parsed = Number(nextValue.replace(",", "."));
    setValues((current) => ({
      ...current,
      [itemId]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }

  function updateLevel(nextLevel: BudgetLevel) {
    const nextItems = getBudgetItems(nextLevel, Number(socialId), unit);
    setLevel(nextLevel);
    setValues(getDefaultBudgetValues(nextItems, inputMode));
  }

  function updateInputMode(nextMode: InputMode) {
    setInputMode(nextMode);
    setValues(getDefaultBudgetValues(items, nextMode));
  }

  function updateSocial(nextSocialId: string) {
    const nextItems = getBudgetItems(level, Number(nextSocialId), unit);
    setSocialId(nextSocialId);
    setValues(getDefaultBudgetValues(nextItems, inputMode));
  }

  function updateUnit(nextUnit: string) {
    const nextItems = getBudgetItems(level, Number(socialId), nextUnit);
    setUnit(nextUnit);
    setValues(getDefaultBudgetValues(nextItems, inputMode));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-panel)] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--palette-blue)]">Configuracao</p>
            <h2 id="budget-modal-title" className="mt-2 text-xl font-semibold">
              {isEditing ? "Editar orcamento planejado" : "Definir orcamento planejado"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing && selectedSocial
                ? `Editando os valores salvos de ${selectedSocial.title} - ${selectedSocial.city}.`
                : "Escolha o nivel e o modo de entrada. Valores atuais ficam como referencia."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar modal"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="overflow-y-auto">
          <section className="border-b border-white/10 px-6 py-5">
            <StepLabel>1 - Nivel do orcamento</StepLabel>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {budgetLevels.map((option) => {
                const selected = level === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      selected ? "border-[var(--palette-blue)] bg-[var(--palette-blue)]/12" : "border-white/10 bg-background/40 hover:bg-white/5",
                    )}
                    onClick={() => updateLevel(option.id)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className={cn("grid size-4 place-items-center rounded-full border", selected ? "border-[var(--palette-blue)]" : "border-white/20")}>
                        {selected ? <span className="size-2 rounded-full bg-[var(--palette-blue)]" /> : null}
                      </span>
                      {option.label}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{option.description}</span>
                  </button>
                );
              })}
            </div>

            {level !== "social" ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <FieldSelect
                  label="Praca (Social)"
                  value={socialId}
                  onChange={updateSocial}
                  options={cityBudgets.map((city) => ({
                    label: `${city.title} - ${city.city}`,
                    value: String(city.id),
                  }))}
                />
                {level === "format" ? (
                  <FieldSelect
                    label="Unidade"
                    value={unit}
                    onChange={updateUnit}
                    options={unitOptions.map((unitOption) => ({ label: unitOption, value: unitOption }))}
                  />
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="border-b border-white/10 px-6 py-5">
            <StepLabel>2 - Modo de entrada</StepLabel>
            <div className="mt-3 inline-grid rounded-lg border border-white/10 bg-background p-1 sm:grid-cols-2">
              <ModeButton active={inputMode === "value"} onClick={() => updateInputMode("value")}>Valor (R$)</ModeButton>
              <ModeButton active={inputMode === "percent"} onClick={() => updateInputMode("percent")}>Porcentagem (%)</ModeButton>
            </div>
          </section>

          <section className="px-6 py-5">
            <StepLabel>3 - Valores ({items.length})</StepLabel>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              {items.map((item) => {
                const rawValue = values[item.id] ?? 0;
                const equivalent = item.reference * (rawValue / 100);

                return (
                  <div key={item.id} className="grid gap-3 border-b border-white/10 bg-background/35 p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      {inputMode === "percent" ? (
                        <p className="mt-1 text-xs text-[var(--palette-yellow)]">
                          Equivale a R$ {money(equivalent)}
                        </p>
                      ) : null}
                    </div>
                    <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-[var(--surface-panel-strong)] px-3 focus-within:ring-1 focus-within:ring-ring">
                      {inputMode === "value" ? <span className="text-xs font-semibold text-muted-foreground">R$</span> : null}
                      <input
                        className="min-w-0 flex-1 bg-transparent text-right font-semibold tabular-nums outline-none"
                        inputMode="decimal"
                        type="number"
                        min="0"
                        value={rawValue}
                        onChange={(event) => updateValue(item.id, event.target.value)}
                      />
                      {inputMode === "percent" ? <span className="text-xs font-semibold text-muted-foreground">%</span> : null}
                    </label>
                  </div>
                );
              })}
            </div>
            {inputMode === "percent" ? (
              <p className={cn("mt-3 text-sm font-semibold", percentModeInvalid ? "text-[var(--palette-orange)]" : "text-[var(--palette-blue)]")}>
                Soma: {formatDecimal(total)}% {percentModeInvalid ? "- precisa fechar em 100%" : "- validado"}
              </p>
            ) : null}
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold tabular-nums">
            Total: R$ {money(valueTotal)}
          </p>
          <div className="flex justify-end gap-2">
            <Button className="border-white/10 bg-transparent hover:bg-white/10" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={percentModeInvalid} onClick={onClose}>
              {isEditing ? "Salvar alteracoes" : "Salvar orcamento"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{children}</p>;
}

function ModeButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn("h-8 rounded-md px-4 text-sm font-semibold transition", active ? "bg-[var(--palette-blue)] text-white" : "text-muted-foreground hover:text-foreground")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 border-white/10 bg-background text-foreground focus:ring-1 focus:ring-ring focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[var(--surface-panel)] text-foreground">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getDefaultBudgetModalDraft(): BudgetModalDraft {
  return {
    mode: "create",
    level: "format",
    inputMode: "value",
    socialId: "0",
    unit: "BR",
  };
}

function filterCityBudgetByFormat(city: CityBudget, selectedFormats: string[]): CityBudget {
  const rows = city.rows.filter(([name]) => selectedFormats.includes(String(name)));
  const planned = rows.reduce((sum, [, rowPlanned]) => sum + Number(rowPlanned), 0);
  const actual = rows.reduce((sum, [, , rowActual]) => sum + Number(rowActual), 0);
  const diff = planned === 0 ? 0 : ((actual - planned) / planned) * 100;

  return {
    ...city,
    planned,
    actual,
    diff,
    rows,
  };
}

function getBudgetItems(level: BudgetLevel, socialId: number, unit: string): BudgetItem[] {
  const social = cityBudgets.find((city) => city.id === socialId) ?? cityBudgets[0];

  if (level === "social") {
    return cityBudgets.map((city) => ({
      id: `social-${city.id}`,
      label: `${city.title} - ${city.city}`,
      description: "Total planejado da praca Social",
      reference: city.planned * 1000,
    }));
  }

  if (level === "unit") {
    const total = social.planned * 1000;
    const unitShares = [
      { label: "BR", value: 0.48 },
      { label: "SP", value: 0.34 },
      { label: "RJ", value: 0.18 },
    ];

    return unitShares.map((unitShare) => ({
      id: `unit-${social.id}-${unitShare.label}`,
      label: unitShare.label,
      description: `${social.title} - ${social.city}`,
      reference: Math.round(total * unitShare.value),
    }));
  }

  return social.rows.map(([name, planned]) => ({
    id: `format-${social.id}-${unit}-${String(name)}`,
    label: String(name),
    description: `${social.title} - Unidade ${unit} - fonte ${name === "Form" ? "adset" : "campaign"}`,
    reference: Number(planned) * 1000,
  }));
}

function getDefaultBudgetValues(items: BudgetItem[], inputMode: InputMode) {
  const total = items.reduce((sum, item) => sum + item.reference, 0);

  return Object.fromEntries(
    items.map((item) => [
      item.id,
      inputMode === "value"
        ? item.reference
        : Number(((item.reference / total) * 100).toFixed(1)),
    ]),
  );
}

function BudgetSidebar() {
  return (
    <AppSidebar
      compact
      className="border-white/10 bg-[#0c090d]"
      footerItems={footerItems}
      items={navItems}
      logo={
        <div className="grid size-9 place-items-center rounded-xl bg-[var(--palette-blue)] text-white shadow-[0_0_24px_rgba(55,119,255,0.35)]">
          <Wallet className="size-5" />
        </div>
      }
    />
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-3 rounded", color)} />
      {label}
    </span>
  );
}

function iconTone(tone: string) {
  if (tone === "yellow") return "bg-[var(--palette-yellow)]/15 text-[var(--palette-yellow)]";
  return "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]";
}

function variationText(value: number) {
  return value > 0 ? "text-[var(--palette-orange)]" : "text-[var(--palette-blue)]";
}

function formatSignedPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatDecimal(value)}%`;
}

function formatDecimal(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 1 });
}

function diffMoney(value: number) {
  const sign = value > 0 ? "+R$" : "-R$";
  return `${sign} ${money(Math.abs(value))}`;
}
