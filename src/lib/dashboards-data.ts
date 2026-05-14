export type Platform = "Google" | "Meta · Bidu";
export const ALL_PLATFORMS: Platform[] = ["Google", "Meta · Bidu"];

export type FormatKey =
  | "pesquisa"
  | "demand gen"
  | "pmax"
  | "lead_ad"
  | "(bateria) lead_ad"
  | "forms";

export const FORMATS_BY_PLATFORM: Record<Platform, FormatKey[]> = {
  Google: ["pesquisa", "demand gen", "pmax"],
  "Meta · Bidu": ["lead_ad", "(bateria) lead_ad", "forms"],
};

export const ALL_FORMATS: FormatKey[] = [
  "pesquisa",
  "demand gen",
  "pmax",
  "lead_ad",
  "(bateria) lead_ad",
  "forms",
];

export const PRACAS = [
  "Mogi das Cruzes 2",
  "Mogi das Cruzes 1",
  "Mogi das Cruzes 3",
  "Indaiatuba",
  "São Carlos",
  "São José dos Campos",
  "Curitiba — PR",
  "Campinas",
  "Belo Horizonte — MG",
  "Goiânia",
  "Franca",
] as const;
export type Praca = (typeof PRACAS)[number];

export type FormatRow = {
  format: FormatKey;
  platform: Platform;
  praca: Praca;
  investment: number;
  leads: number;
  proposals: number;
  visits: number;
  sales: number;
  revenue: number;
};

// Seeded LCG so the mock is stable on reload but varies per "session" if we want
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Baseline per praça/format to keep numbers realistic + similar to mockup
const PRACA_BASE: Record<Praca, number> = {
  "Mogi das Cruzes 2": 103230,
  "Mogi das Cruzes 1": 92664,
  "Mogi das Cruzes 3": 93418,
  Indaiatuba: 92412,
  "São Carlos": 87818,
  "São José dos Campos": 70704,
  "Curitiba — PR": 69791,
  Campinas: 54526,
  "Belo Horizonte — MG": 32738,
  Goiânia: 18900,
  Franca: 14200,
};

const FORMAT_PROFILE: Record<
  FormatKey,
  { cpl: number; leadToProp: number; propToVisit: number; visitToSale: number; ticket: number }
> = {
  pesquisa: { cpl: 19, leadToProp: 0.12, propToVisit: 0.48, visitToSale: 0.26, ticket: 24000 },
  "demand gen": { cpl: 15, leadToProp: 0.095, propToVisit: 0.41, visitToSale: 0.21, ticket: 23000 },
  pmax: { cpl: 16, leadToProp: 0.088, propToVisit: 0.42, visitToSale: 0.24, ticket: 23500 },
  lead_ad: { cpl: 13.2, leadToProp: 0.096, propToVisit: 0.34, visitToSale: 0.21, ticket: 23000 },
  "(bateria) lead_ad": { cpl: 13.4, leadToProp: 0.091, propToVisit: 0.4, visitToSale: 0.205, ticket: 22500 },
  forms: { cpl: 16.8, leadToProp: 0.095, propToVisit: 0.49, visitToSale: 0.155, ticket: 22000 },
};

const PRACA_MULT: Record<Praca, number> = {
  "Mogi das Cruzes 2": 1.18,
  "Mogi das Cruzes 1": 1.0,
  "Mogi das Cruzes 3": 0.95,
  Indaiatuba: 0.86,
  "São Carlos": 0.82,
  "São José dos Campos": 0.84,
  "Curitiba — PR": 0.9,
  Campinas: 1.22,
  "Belo Horizonte — MG": 0.88,
  Goiânia: 0.78,
  Franca: 0.74,
};

export function generateDataset(seed = 42): FormatRow[] {
  const rand = seeded(seed);
  const rows: FormatRow[] = [];

  for (const praca of PRACAS) {
    const base = PRACA_BASE[praca];
    const mult = PRACA_MULT[praca];

    for (const platform of ALL_PLATFORMS) {
      const platformShare = platform === "Google" ? 0.56 : 0.44;
      const platformBudget = base * platformShare * (0.92 + rand() * 0.16);

      const formats = FORMATS_BY_PLATFORM[platform];
      const weights = formats.map(() => 0.7 + rand() * 0.6);
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      formats.forEach((format, i) => {
        const fmt = FORMAT_PROFILE[format];
        const investment = (platformBudget * (weights[i] / totalWeight));
        const cplJitter = 0.9 + rand() * 0.22;
        const cpl = fmt.cpl * cplJitter;
        const leads = Math.max(40, investment / cpl);

        const propRate = fmt.leadToProp * mult * (0.92 + rand() * 0.16);
        const proposals = leads * propRate;
        const visitRate = fmt.propToVisit * (0.92 + rand() * 0.16);
        const visits = proposals * visitRate;
        const saleRate = fmt.visitToSale * mult * (0.85 + rand() * 0.3);
        const sales = visits * saleRate;
        const ticket = fmt.ticket * (0.95 + rand() * 0.1);
        const revenue = sales * ticket;

        rows.push({
          praca,
          platform,
          format,
          investment: round(investment),
          leads: Math.round(leads),
          proposals: Math.round(proposals),
          visits: Math.round(visits),
          sales: roundSale(sales),
          revenue: round(revenue),
        });
      });
    }
  }

  return rows;
}

function round(value: number) {
  return Math.round(value);
}

function roundSale(value: number) {
  // Floor to whole sales but keep proportional rounding by carrying fractional via seed
  return Math.max(0, Math.round(value));
}

// ─── Aggregation helpers ─────────────────────────────────────────────────────

export type Aggregate = {
  investment: number;
  leads: number;
  proposals: number;
  visits: number;
  sales: number;
  revenue: number;
};

export function emptyAggregate(): Aggregate {
  return { investment: 0, leads: 0, proposals: 0, visits: 0, sales: 0, revenue: 0 };
}

export function sum(rows: FormatRow[]): Aggregate {
  return rows.reduce(
    (acc, r) => ({
      investment: acc.investment + r.investment,
      leads: acc.leads + r.leads,
      proposals: acc.proposals + r.proposals,
      visits: acc.visits + r.visits,
      sales: acc.sales + r.sales,
      revenue: acc.revenue + r.revenue,
    }),
    emptyAggregate(),
  );
}

export function cpl(agg: Aggregate) {
  return agg.leads ? agg.investment / agg.leads : 0;
}
export function cpa(agg: Aggregate) {
  return agg.sales ? agg.investment / agg.sales : 0;
}
export function roas(agg: Aggregate) {
  return agg.investment ? agg.revenue / agg.investment : 0;
}
export function cpProposal(agg: Aggregate) {
  return agg.proposals ? agg.investment / agg.proposals : 0;
}
export function cpVisit(agg: Aggregate) {
  return agg.visits ? agg.investment / agg.visits : 0;
}

// ─── Format helpers ──────────────────────────────────────────────────────────

const intFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtInt(value: number) {
  return intFmt.format(Math.round(value));
}

export function fmtMoney(value: number) {
  return `R$ ${intFmt.format(Math.round(value))}`;
}

export function fmtMoneyShort(value: number) {
  if (Math.abs(value) >= 1_000_000) return `R$ ${decFmt.format(value / 1_000_000)} mi`;
  if (Math.abs(value) >= 1_000) return `R$ ${intFmt.format(value / 1_000)}k`;
  return fmtMoney(value);
}

export function fmtDec(value: number) {
  return decFmt.format(value);
}

export function fmtPct(value: number) {
  return `${decFmt.format(value * 100)}%`;
}

export function fmtRoas(value: number) {
  return `${decFmt.format(value)}×`;
}

// ─── Daily time series (1 abr — 6 mai 2026) ──────────────────────────────────

export type DailyPoint = {
  date: Date;
  label: string;
  investment: number;
  roas: number;
  sales: number;
  logs: number;
  leadToProposta: number; // percentage 0-100
  propostaToVisita: number; // percentage 0-100
  visitaToVenda: number; // percentage 0-100
};

export type LogStatus = "success" | "warning" | "error";

export type LogEntry = {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  target: string;
  status: LogStatus;
};

const SERIES_INVEST = [26487, 22100, 20785, 19709, 19565, 20203, 21060, 20203, 18701, 17639, 20800, 22500, 24413, 24039, 23856, 25197, 24015, 22659, 19356, 18361, 17921, 19168, 19406, 24406, 24362, 23741, 25262, 26225, 25037, 24976, 24301, 24977, 24380, 26225, 26785, 26785];
const SERIES_ROAS = [11.5, 10.8, 10.1, 9.8, 10.5, 11.2, 12.1, 11.8, 9.4, 8.8, 10.2, 11.5, 12.4, 13.2, 13.5, 14.1, 13.8, 12.9, 11.4, 10.8, 10.2, 11.5, 12.8, 13.1, 14.1, 13.9, 14.5, 15.2, 14.8, 15.1, 14.2, 13.9, 14.6, 15.8, 12.2, 12.1];
const SERIES_SALES = [8, 7, 8, 10, 9, 11, 12, 5, 5, 10, 11, 12, 13, 11, 10, 8, 7, 7, 9, 11, 12, 13, 11, 13, 14, 13, 14, 12, 11, 13, 15, 13, 12, 14, 13, 14];
const SERIES_LP = [9.2, 8.8, 9.1, 9.5, 10.2, 11.1, 10.8, 8.5, 8.1, 10.5, 11.2, 11.5, 12.1, 11.8, 10.9, 9.8, 9.2, 8.8, 9.8, 10.9, 11.1, 12.1, 11.9, 12.4, 13.1, 12.8, 13.0, 12.2, 11.9, 12.5, 13.5, 12.4, 12.1, 12.8, 9.8, 9.7];
const SERIES_PV = [38, 36, 39, 38, 42, 44, 43, 34, 32, 41, 43, 45, 47, 45, 42, 40, 37, 35, 40, 43, 44, 46, 44, 46, 48, 47, 48, 45, 44, 47, 49, 46, 45, 47, 41, 40];
const SERIES_VV = [18, 17, 19, 19, 21, 23, 22, 15, 13, 21, 22, 23, 24, 23, 22, 20, 18, 17, 21, 22, 23, 24, 23, 24, 25, 24, 25, 23, 22, 24, 26, 23, 22, 24, 22, 22];
const SERIES_LOGS = [42, 58, 31, 67, 49, 73, 51, 38, 44, 65, 81, 56, 70, 62, 48, 59, 73, 41, 36, 64, 78, 55, 49, 86, 71, 54, 67, 82, 59, 73, 91, 64, 57, 79, 68, 62];

const MONTH_SHORT_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const DAILY_START = new Date(2026, 3, 1); // 2026-04-01

export const DAILY_SERIES: DailyPoint[] = SERIES_INVEST.map((_, i) => {
  const date = new Date(DAILY_START);
  date.setDate(date.getDate() + i);
  return {
    date,
    label: `${date.getDate()} ${MONTH_SHORT_PT[date.getMonth()]}`,
    investment: SERIES_INVEST[i],
    roas: SERIES_ROAS[i],
    sales: SERIES_SALES[i],
    leadToProposta: SERIES_LP[i],
    propostaToVisita: SERIES_PV[i],
    visitaToVenda: SERIES_VV[i],
    logs: SERIES_LOGS[i],
  };
});

export function filterDailyByRange(start: Date, end: Date): DailyPoint[] {
  const s = start.getTime();
  const e = end.getTime();
  return DAILY_SERIES.filter((p) => p.date.getTime() >= s && p.date.getTime() <= e);
}

// ─── Log entries (mocked actions for the modal) ──────────────────────────────

const LOG_USERS = [
  "Vinicius Tavares",
  "Kyro Ferreira",
  "Bidu Bot",
  "Ana Souza",
  "Marina Lopes",
  "Daniel Costa",
];

const LOG_ACTIONS: { action: string; status: LogStatus }[] = [
  { action: "Orçamento ajustado", status: "success" },
  { action: "Campanha pausada", status: "warning" },
  { action: "Novo anúncio publicado", status: "success" },
  { action: "Conjunto de anúncios duplicado", status: "success" },
  { action: "Bid cap atualizado", status: "success" },
  { action: "Criativo aprovado", status: "success" },
  { action: "Criativo rejeitado", status: "error" },
  { action: "Audiência sincronizada", status: "success" },
  { action: "Exportação concluída", status: "success" },
  { action: "Falha na importação", status: "error" },
  { action: "Conversão API revisada", status: "warning" },
  { action: "Pixel reinstalado", status: "success" },
];

const LOG_TARGETS = [
  "Mogi 2 · Google · pesquisa",
  "Mogi 1 · Meta · lead_ad",
  "Indaiatuba · Google · pmax",
  "Campinas · Meta · forms",
  "São Carlos · Google · demand gen",
  "Curitiba · Meta · bateria lead_ad",
  "SJC · Google · pesquisa",
  "BH · Meta · lead_ad",
  "Mogi 3 · Google · pmax",
];

function hashSeed(date: Date): number {
  return (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()) >>> 0;
}

function pseudoRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function getLogsForDate(date: Date, count: number): LogEntry[] {
  const rand = pseudoRandom(hashSeed(date));
  const entries: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    const action = LOG_ACTIONS[Math.floor(rand() * LOG_ACTIONS.length)]!;
    const user = LOG_USERS[Math.floor(rand() * LOG_USERS.length)]!;
    const target = LOG_TARGETS[Math.floor(rand() * LOG_TARGETS.length)]!;
    const hours = Math.floor(rand() * 12) + 8; // 08-19
    const minutes = Math.floor(rand() * 60);
    const ts = new Date(date);
    ts.setHours(hours, minutes, Math.floor(rand() * 60));
    entries.push({
      id: `${hashSeed(date)}-${i}`,
      timestamp: ts,
      user,
      action: action.action,
      target,
      status: action.status,
    });
  }
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
