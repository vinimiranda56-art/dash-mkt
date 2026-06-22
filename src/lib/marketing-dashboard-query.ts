import "server-only";

import { generateDataset } from "@/lib/dashboards-data";
import { runBigQuery } from "@/lib/bigquery";
import type {
  MarketingDashboardDailyPoint,
  MarketingDashboardFilters,
  MarketingDashboardResponse,
  MarketingDashboardRow,
  MarketingFormat,
  MarketingPlatform,
} from "@/lib/marketing-dashboard-types";

type BigQueryDashboardRow = {
  praca: string | null;
  platform: string | null;
  format: string | null;
  investment: BigQueryNumber;
  leads: BigQueryNumber;
  proposals: BigQueryNumber;
  visits: BigQueryNumber;
  sales: BigQueryNumber;
  revenue: BigQueryNumber;
};

type BigQueryDailyRow = {
  date: { value?: string } | string;
  label: string;
  investment: BigQueryNumber;
  roas: BigQueryNumber;
  sales: BigQueryNumber;
  logs: BigQueryNumber;
  lead_to_proposta: BigQueryNumber;
  proposta_to_visita: BigQueryNumber;
  visita_to_venda: BigQueryNumber;
};

type BigQueryNumber = number | string | { value?: string | number } | null;

const dashboardSql = `
CREATE TEMP FUNCTION normalize_unit(value STRING) AS (
  CASE
    WHEN value IS NULL OR TRIM(value) = '' THEN 'Sem praca'
    WHEN value IN ('São Carlos', 'São_Carlos', 'Sanca') THEN 'Sao Carlos'
    WHEN value IN ('São José dos Campos', 'SJC') THEN 'Sao Jose dos Campos'
    WHEN value IN ('Goiânia - GO', 'Goiás - GO', 'Goias') THEN 'Goias - GO'
    WHEN value IN ('Brasília - DF', 'Brasília') THEN 'Brasilia'
    ELSE value
  END
);

CREATE TEMP FUNCTION normalize_format(value STRING) AS (
  CASE
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(value, '')), r'pesquisa|search') THEN 'Pesquisa'
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(value, '')), r'discovery|demand') THEN 'Discovery'
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(value, '')), r'pmax') THEN 'Pmax'
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(value, '')), r'lead_ad|lead ad|bateria') THEN 'Lead_ad'
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(value, '')), r'forms|form') THEN 'Forms'
    ELSE 'Outros'
  END
);

WITH params AS (
  SELECT
    DATE(@start_date) AS start_date,
    DATE(@end_date) AS end_date
),
unit_map AS (
  SELECT
    id_bitrix,
    nome,
    social_canal
  FROM \`biduquery.curated_marketing.unidade_map\`
),
leads AS (
  SELECT
    normalize_unit(unidade_nome) AS praca,
    social_canal AS social,
    CASE grupo
      WHEN 'Google' THEN 'Google'
      WHEN 'Bidu' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    COALESCE(tipo_campanha, 'Outros') AS format,
    COUNTIF(is_lead) AS leads
  FROM \`biduquery.curated_marketing.vw_leads_base\`, params
  WHERE data_comercial BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3, 4
),
funil AS (
  SELECT
    normalize_unit(COALESCE(um.nome, unidade_nome, unidade_canonico, unidade_consolidado)) AS praca,
    um.social_canal AS social,
    CASE source
      WHEN 'google' THEN 'Google'
      WHEN 'meta' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    COALESCE(tipo_campanha, 'Outros') AS format,
    COUNTIF(tem_proposta) AS proposals,
    COUNTIF(tem_visita) AS visits,
    COUNTIF(tem_venda_fotovoltaico OR tem_venda_bitrix) AS sales
  FROM \`biduquery.curated_marketing.vw_funil_deals_marketing\`
  LEFT JOIN unit_map um ON um.id_bitrix = unidade_codigo,
  params
  WHERE lead_date BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3, 4
),
spend_social AS (
  SELECT
    CASE plataforma
      WHEN 'google_ads' THEN 'Google'
      WHEN 'meta' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    CASE unidade
      WHEN 'Sanca' THEN 'São Carlos'
      ELSE unidade
    END AS social,
    normalize_format(tipo_campanha) AS format,
    SUM(spend) AS investment
  FROM \`biduquery.gold_marketing.fact_marketing_daily\`, params
  WHERE date BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3
),
lead_share AS (
  SELECT
    praca,
    social,
    platform,
    format,
    SAFE_DIVIDE(
      l.leads,
      SUM(l.leads) OVER (PARTITION BY social, platform, format)
    ) AS share
  FROM leads l
),
spend AS (
  SELECT
    ls.praca,
    ls.platform,
    ls.format,
    SUM(ss.investment * ls.share) AS investment
  FROM lead_share ls
  JOIN spend_social ss
    ON ss.social = ls.social
   AND ss.platform = ls.platform
   AND ss.format = ls.format
  GROUP BY 1, 2, 3
),
vendas AS (
  SELECT
    normalize_unit(unidade) AS praca,
    CASE LOWER(TRIM(COALESCE(utm_source, '')))
      WHEN 'google' THEN 'Google'
      WHEN 'meta' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    COALESCE(tipo_campanha, 'Outros') AS format,
    SUM(SAFE_CAST(REPLACE(valor, ',', '.') AS NUMERIC)) AS revenue,
    COUNT(*) AS sales_from_sales_view
  FROM \`biduquery.curated_marketing.curated_marketing\`, params
  WHERE SAFE_CAST(data_venda AS DATE) BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3
),
keys AS (
  SELECT praca, platform, format FROM leads
  UNION DISTINCT
  SELECT praca, platform, format FROM funil
  UNION DISTINCT
  SELECT praca, platform, format FROM vendas
  UNION DISTINCT
  SELECT praca, platform, format FROM spend
),
joined AS (
  SELECT
    k.praca,
    k.platform,
    k.format,
    COALESCE(l.leads, 0) AS leads,
    COALESCE(f.proposals, 0) AS proposals,
    COALESCE(f.visits, 0) AS visits,
    COALESCE(v.sales_from_sales_view, f.sales, 0) AS sales,
    COALESCE(v.revenue, 0) AS revenue,
    COALESCE(s.investment, 0) AS investment
  FROM keys k
  LEFT JOIN leads l
    ON l.praca = k.praca AND l.platform = k.platform AND l.format = k.format
  LEFT JOIN funil f
    ON f.praca = k.praca AND f.platform = k.platform AND f.format = k.format
  LEFT JOIN vendas v
    ON v.praca = k.praca AND v.platform = k.platform AND v.format = k.format
  LEFT JOIN spend s
    ON s.praca = k.praca AND s.platform = k.platform AND s.format = k.format
)
SELECT
  praca,
  platform,
  format,
  SUM(investment) AS investment,
  SUM(leads) AS leads,
  SUM(proposals) AS proposals,
  SUM(visits) AS visits,
  SUM(sales) AS sales,
  SUM(revenue) AS revenue
FROM joined
WHERE praca IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY revenue DESC, leads DESC
`;

const dailySql = `
WITH params AS (
  SELECT
    DATE(@start_date) AS start_date,
    DATE(@end_date) AS end_date
),
spend_daily AS (
  SELECT
    date,
    SUM(spend) AS investment
  FROM \`biduquery.gold_marketing.fact_marketing_daily\`, params
  WHERE date BETWEEN params.start_date AND params.end_date
  GROUP BY 1
),
leads_daily AS (
  SELECT
    data_comercial AS date,
    COUNTIF(is_lead) AS leads
  FROM \`biduquery.curated_marketing.vw_leads_base\`, params
  WHERE data_comercial BETWEEN params.start_date AND params.end_date
  GROUP BY 1
),
funil_daily AS (
  SELECT
    lead_date AS date,
    COUNTIF(tem_proposta) AS proposals,
    COUNTIF(tem_visita) AS visits,
    COUNTIF(tem_venda_fotovoltaico OR tem_venda_bitrix) AS sales
  FROM \`biduquery.curated_marketing.vw_funil_deals_marketing\`, params
  WHERE lead_date BETWEEN params.start_date AND params.end_date
  GROUP BY 1
),
vendas_daily AS (
  SELECT
    SAFE_CAST(data_venda AS DATE) AS date,
    SUM(SAFE_CAST(REPLACE(valor, ',', '.') AS NUMERIC)) AS revenue,
    COUNT(*) AS sales
  FROM \`biduquery.curated_marketing.curated_marketing\`, params
  WHERE SAFE_CAST(data_venda AS DATE) BETWEEN params.start_date AND params.end_date
  GROUP BY 1
)
SELECT
  s.date,
  FORMAT_DATE('%d %b', s.date) AS label,
  COALESCE(s.investment, 0) AS investment,
  SAFE_DIVIDE(COALESCE(v.revenue, 0), NULLIF(s.investment, 0)) AS roas,
  COALESCE(v.sales, f.sales, 0) AS sales,
  0 AS logs,
  SAFE_MULTIPLY(SAFE_DIVIDE(COALESCE(f.proposals, 0), NULLIF(l.leads, 0)), 100) AS lead_to_proposta,
  SAFE_MULTIPLY(SAFE_DIVIDE(COALESCE(f.visits, 0), NULLIF(f.proposals, 0)), 100) AS proposta_to_visita,
  SAFE_MULTIPLY(SAFE_DIVIDE(COALESCE(v.sales, f.sales, 0), NULLIF(f.visits, 0)), 100) AS visita_to_venda
FROM spend_daily s
LEFT JOIN leads_daily l ON l.date = s.date
LEFT JOIN funil_daily f ON f.date = s.date
LEFT JOIN vendas_daily v ON v.date = s.date
WHERE s.investment > 0
ORDER BY s.date
`;

export async function getMarketingDashboardData(
  filters: Required<Pick<MarketingDashboardFilters, "startDate" | "endDate">>,
): Promise<MarketingDashboardResponse> {
  const params = {
    start_date: filters.startDate,
    end_date: filters.endDate,
  };

  try {
    const [rows, daily] = await Promise.all([
      runBigQuery<BigQueryDashboardRow>(dashboardSql, params),
      runBigQuery<BigQueryDailyRow>(dailySql, params),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      rows: rows.map(normalizeRow),
      daily: daily.map(normalizeDailyPoint),
      source: "bigquery",
    };
  } catch (error) {
    console.warn("marketing-dashboard BigQuery unavailable; using fallback dataset", error);
    return getFallbackMarketingDashboardData(filters);
  }
}

function getFallbackMarketingDashboardData(
  filters: Required<Pick<MarketingDashboardFilters, "startDate" | "endDate">>,
): MarketingDashboardResponse {
  const rows = generateDataset(42);

  return {
    generatedAt: new Date().toISOString(),
    rows,
    daily: generateFallbackDaily(rows, filters),
    source: "fallback",
  };
}

function generateFallbackDaily(
  rows: MarketingDashboardRow[],
  filters: Required<Pick<MarketingDashboardFilters, "startDate" | "endDate">>,
): MarketingDashboardDailyPoint[] {
  const totalInvestment = rows.reduce((sum, row) => sum + row.investment, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);
  const start = new Date(`${filters.startDate}T00:00:00Z`);
  const end = new Date(`${filters.endDate}T00:00:00Z`);
  const dayMs = 24 * 60 * 60 * 1000;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / dayMs) + 1);
  const visibleDays = Math.min(totalDays, 30);
  const offsetDays = totalDays - visibleDays;
  const dailyInvestment = totalInvestment / visibleDays;
  const dailySales = totalSales / visibleDays;
  const baseRoas = totalInvestment ? totalRevenue / totalInvestment : 0;

  return Array.from({ length: visibleDays }, (_, index) => {
    const date = new Date(start.getTime() + (offsetDays + index) * dayMs);
    const wave = 0.92 + ((index % 7) * 0.025);
    const investment = Math.round(dailyInvestment * wave);
    const sales = Math.max(0, Math.round(dailySales * (0.9 + ((index % 5) * 0.05))));

    return {
      date: date.toISOString().slice(0, 10),
      label: normalizeDateLabel(date.toISOString().slice(0, 10)),
      investment,
      roas: Number((baseRoas * (0.95 + ((index % 6) * 0.02))).toFixed(2)),
      sales,
      logs: 0,
      leadToProposta: 10 + (index % 4),
      propostaToVisita: 38 + (index % 8),
      visitaToVenda: 18 + (index % 5),
    };
  });
}

function normalizeRow(row: BigQueryDashboardRow): MarketingDashboardRow {
  return {
    praca: normalizePraca(row.praca),
    platform: normalizePlatform(row.platform),
    format: normalizeFormat(row.format),
    investment: toNumber(row.investment),
    leads: toNumber(row.leads),
    proposals: toNumber(row.proposals),
    visits: toNumber(row.visits),
    sales: toNumber(row.sales),
    revenue: toNumber(row.revenue),
  };
}

function normalizePraca(value: string | null): string {
  if (!value?.trim()) return "Sem praca";

  return value
    .replace("São_Carlos", "Sao Carlos")
    .replace("São Carlos", "Sao Carlos")
    .replace("São José dos Campos", "Sao Jose dos Campos")
    .replace("Goiás - GO", "Goias - GO")
    .replace("Brasília", "Brasilia");
}

function normalizePlatform(value: string | null): MarketingPlatform {
  if (value === "Google") return "Google";
  if (value === "Meta - Bidu") return "Meta - Bidu";
  return "Outros";
}

function normalizeFormat(value: string | null): MarketingFormat {
  if (
    value === "Pesquisa" ||
    value === "Discovery" ||
    value === "Pmax" ||
    value === "Lead_ad" ||
    value === "Forms"
  ) {
    return value;
  }

  return "Outros";
}

function normalizeDailyPoint(row: BigQueryDailyRow): MarketingDashboardDailyPoint {
  return {
    date: normalizeDate(row.date),
    label: normalizeDateLabel(normalizeDate(row.date)),
    investment: toNumber(row.investment),
    roas: toNumber(row.roas),
    sales: toNumber(row.sales),
    logs: toNumber(row.logs),
    leadToProposta: toNumber(row.lead_to_proposta),
    propostaToVisita: toNumber(row.proposta_to_visita),
    visitaToVenda: toNumber(row.visita_to_venda),
  };
}

function normalizeDate(value: BigQueryDailyRow["date"]): string {
  if (typeof value === "string") return value;
  return value.value ?? "";
}

function normalizeDateLabel(value: string): string {
  const [, month, day] = value.split("-");
  const date = new Date(`${value}T00:00:00`);
  if (!month || !day || Number.isNaN(date.getTime())) return value;

  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${Number(day)} ${months[date.getMonth()]}`;
}

function toNumber(value: BigQueryNumber): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "value" in value) {
    return toNumber(value.value ?? null);
  }
  if (value && typeof value === "object") {
    const serialized = value.toString();
    if (serialized !== "[object Object]") {
      return toNumber(serialized);
    }
  }
  return 0;
}
