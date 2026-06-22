# BigQuery Marketing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mocked dashboard data with live BigQuery data from `biduquery`.

**Architecture:** BigQuery access stays server-side through a Next.js API route. Client components fetch a normalized dashboard row contract and keep their current filtering, aggregation, and chart rendering behavior.

**Tech Stack:** Next.js App Router, React, TypeScript, Recharts, `@google-cloud/bigquery`, Google ADC/service account credentials.

---

## File Structure

- Create `src/lib/marketing-dashboard-types.ts`
  Shared dashboard row, filters, and response types.

- Create `src/lib/bigquery.ts`
  Server-only BigQuery client and query helper.

- Create `src/lib/marketing-dashboard-query.ts`
  SQL builder and raw BigQuery row normalization.

- Create `src/app/api/marketing-dashboard/route.ts`
  API route that validates filters and returns dashboard rows.

- Create `src/lib/marketing-dashboard-client.ts`
  Browser fetch helper for dashboard data.

- Modify `src/components/allocation-dashboard.tsx`
  Replace `generateDataset(42)` with fetched live data.

- Modify `src/components/funnel-dashboard.tsx`
  Replace `generateDataset(42)` with fetched live data.

- Modify `package.json`
  Add `@google-cloud/bigquery`.

---

### Task 1: Add Shared Dashboard Types

**Files:**
- Create: `src/lib/marketing-dashboard-types.ts`

- [ ] **Step 1: Create the shared types**

```ts
export type MarketingPlatform = "Google" | "Meta - Bidu" | "Outros";

export type MarketingFormat =
  | "Pesquisa"
  | "Discovery"
  | "Pmax"
  | "Lead_ad"
  | "Forms"
  | "Outros";

export type MarketingDashboardRow = {
  praca: string;
  platform: MarketingPlatform;
  format: MarketingFormat;
  investment: number;
  leads: number;
  proposals: number;
  visits: number;
  sales: number;
  revenue: number;
};

export type MarketingDashboardFilters = {
  startDate?: string;
  endDate?: string;
  pracas?: string[];
  platforms?: MarketingPlatform[];
  formats?: MarketingFormat[];
};

export type MarketingDashboardResponse = {
  generatedAt: string;
  rows: MarketingDashboardRow[];
};
```

- [ ] **Step 2: Verify TypeScript sees the file**

Run: `npx tsc --noEmit`

Expected: no new errors from `marketing-dashboard-types.ts`.

---

### Task 2: Install BigQuery Client

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependency**

Run:

```bash
npm install @google-cloud/bigquery
```

- [ ] **Step 2: Verify dependency is recorded**

Run:

```bash
npm ls @google-cloud/bigquery
```

Expected: package appears under `marketing-dashboard`.

---

### Task 3: Add Server-Side BigQuery Helper

**Files:**
- Create: `src/lib/bigquery.ts`

- [ ] **Step 1: Create the helper**

```ts
import "server-only";

import { BigQuery, type QueryRowsResponse } from "@google-cloud/bigquery";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "biduquery";

const bigquery = new BigQuery({
  projectId,
});

export async function runBigQuery<T>(
  query: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const [rows]: QueryRowsResponse = await bigquery.query({
    query,
    params,
    location: "southamerica-east1",
    useLegacySql: false,
  });

  return rows as T[];
}
```

- [ ] **Step 2: Verify server-only import compiles**

Run: `npx tsc --noEmit`

Expected: no new errors from `src/lib/bigquery.ts`.

---

### Task 4: Build Dashboard Query and Normalizer

**Files:**
- Create: `src/lib/marketing-dashboard-query.ts`

- [ ] **Step 1: Add SQL and normalization**

```ts
import "server-only";

import { runBigQuery } from "@/lib/bigquery";
import type {
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
  investment: number | string | null;
  leads: number | string | null;
  proposals: number | string | null;
  visits: number | string | null;
  sales: number | string | null;
  revenue: number | string | null;
};

const dashboardSql = `
WITH params AS (
  SELECT
    @start_date AS start_date,
    @end_date AS end_date
),
leads AS (
  SELECT
    data_comercial AS data,
    unidade_nome AS praca,
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
    lead_date AS data,
    COALESCE(unidade_nome, unidade_canonico, unidade_consolidado) AS praca,
    CASE source
      WHEN 'google' THEN 'Google'
      WHEN 'meta' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    COALESCE(tipo_campanha, 'Outros') AS format,
    COUNTIF(tem_proposta) AS proposals,
    COUNTIF(tem_visita) AS visits,
    COUNTIF(tem_venda_fotovoltaico OR tem_venda_bitrix) AS sales
  FROM \`biduquery.curated_marketing.vw_funil_deals_marketing\`, params
  WHERE lead_date BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3, 4
),
spend AS (
  SELECT
    data,
    canal AS social,
    CASE grupo
      WHEN 'Google' THEN 'Google'
      WHEN 'Bidu' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    SUM(gasto) AS investment
  FROM \`biduquery.curated_marketing.vw_spend_canal\`, params
  WHERE data BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3
),
vendas AS (
  SELECT
    data,
    unidade AS praca,
    CASE grupo
      WHEN 'Google' THEN 'Google'
      WHEN 'Bidu' THEN 'Meta - Bidu'
      ELSE 'Outros'
    END AS platform,
    SUM(vendas) AS revenue,
    SUM(n_vendas) AS sales_from_sales_view
  FROM \`biduquery.curated_marketing.vw_vendas_canal\`, params
  WHERE data BETWEEN params.start_date AND params.end_date
  GROUP BY 1, 2, 3
),
keys AS (
  SELECT data, praca, platform, format FROM leads
  UNION DISTINCT
  SELECT data, praca, platform, format FROM funil
),
joined AS (
  SELECT
    k.praca,
    k.platform,
    k.format,
    COALESCE(l.leads, 0) AS leads,
    COALESCE(f.proposals, 0) AS proposals,
    COALESCE(f.visits, 0) AS visits,
    COALESCE(f.sales, 0) AS sales,
    COALESCE(v.revenue, 0) AS revenue,
    COALESCE(s.investment, 0) AS investment
  FROM keys k
  LEFT JOIN leads l
    ON l.data = k.data AND l.praca = k.praca AND l.platform = k.platform AND l.format = k.format
  LEFT JOIN funil f
    ON f.data = k.data AND f.praca = k.praca AND f.platform = k.platform AND f.format = k.format
  LEFT JOIN vendas v
    ON v.data = k.data AND v.praca = k.praca AND v.platform = k.platform
  LEFT JOIN \`biduquery.curated_marketing.unidade_map\` um
    ON um.nome = k.praca
  LEFT JOIN spend s
    ON s.data = k.data AND s.platform = k.platform AND s.social = um.social_canal
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

export async function getMarketingDashboardData(
  filters: Required<Pick<MarketingDashboardFilters, "startDate" | "endDate">>,
): Promise<MarketingDashboardResponse> {
  const rows = await runBigQuery<BigQueryDashboardRow>(dashboardSql, {
    start_date: filters.startDate,
    end_date: filters.endDate,
  });

  return {
    generatedAt: new Date().toISOString(),
    rows: rows.map(normalizeRow),
  };
}

function normalizeRow(row: BigQueryDashboardRow): MarketingDashboardRow {
  return {
    praca: row.praca ?? "Sem praca",
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

function toNumber(value: number | string | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: no new TypeScript errors from the query module.

---

### Task 5: Add API Route

**Files:**
- Create: `src/app/api/marketing-dashboard/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse, type NextRequest } from "next/server";

import { getMarketingDashboardData } from "@/lib/marketing-dashboard-query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") ?? "2026-01-01";
  const endDate = searchParams.get("endDate") ?? new Date().toISOString().slice(0, 10);

  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return NextResponse.json(
      { error: "Invalid date filters. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const data = await getMarketingDashboardData({ startDate, endDate });
    return NextResponse.json(data);
  } catch (error) {
    console.error("marketing-dashboard BigQuery error", error);
    return NextResponse.json(
      { error: "Could not load marketing dashboard data." },
      { status: 500 },
    );
  }
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
```

- [ ] **Step 2: Verify endpoint compiles**

Run: `npx tsc --noEmit`

Expected: no new TypeScript errors from the route.

---

### Task 6: Add Client Fetch Helper

**Files:**
- Create: `src/lib/marketing-dashboard-client.ts`

- [ ] **Step 1: Create fetch helper**

```ts
import type {
  MarketingDashboardFilters,
  MarketingDashboardResponse,
} from "@/lib/marketing-dashboard-types";

export async function fetchMarketingDashboardData(
  filters: MarketingDashboardFilters,
): Promise<MarketingDashboardResponse> {
  const params = new URLSearchParams();

  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  const response = await fetch(`/api/marketing-dashboard?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados de marketing.");
  }

  return response.json() as Promise<MarketingDashboardResponse>;
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: no new TypeScript errors from the client helper.

---

### Task 7: Adapt Dashboard Constants to Live Values

**Files:**
- Modify: `src/lib/dashboards-data.ts`

- [ ] **Step 1: Add a live row-compatible alias**

At the top-level exports, import the shared type:

```ts
import type { MarketingDashboardRow } from "@/lib/marketing-dashboard-types";
```

Then change:

```ts
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
```

to:

```ts
export type FormatRow = MarketingDashboardRow;
```

- [ ] **Step 2: Loosen filter option types**

Change `Platform`, `FormatKey`, and `Praca` definitions to accept live strings while keeping the existing option arrays:

```ts
export type Platform = "Google" | "Meta - Bidu" | "Outros";
export const ALL_PLATFORMS: Platform[] = ["Google", "Meta - Bidu", "Outros"];

export type FormatKey = "Pesquisa" | "Discovery" | "Pmax" | "Lead_ad" | "Forms" | "Outros";
export const ALL_FORMATS: FormatKey[] = ["Pesquisa", "Discovery", "Pmax", "Lead_ad", "Forms", "Outros"];

export const PRACAS = [
  "Mogi das Cruzes 2",
  "Mogi das Cruzes 1",
  "Mogi das Cruzes 3",
  "Indaiatuba",
  "Sao Carlos",
  "Sao Jose dos Campos",
  "Curitiba - PR",
  "Campinas",
  "Belo Horizonte - MG",
  "Goias - GO",
  "Franca",
  "Brasilia",
] as const;
export type Praca = string;
```

- [ ] **Step 3: Keep mock generator compiling**

Update mock constants to use the new `FormatKey` and `Platform` labels. The mock will remain available only as fallback data.

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit`

Expected: type errors reveal any component assumptions that still require old labels.

---

### Task 8: Replace Mock Data in Allocation Dashboard

**Files:**
- Modify: `src/components/allocation-dashboard.tsx`

- [ ] **Step 1: Add fetch imports**

```ts
import { fetchMarketingDashboardData } from "@/lib/marketing-dashboard-client";
```

- [ ] **Step 2: Replace mock dataset state**

Replace:

```ts
const dataset = React.useMemo(() => generateDataset(42), []);
```

with:

```ts
const [dataset, setDataset] = React.useState<FormatRow[]>([]);
const [isLoading, setIsLoading] = React.useState(true);
const [loadError, setLoadError] = React.useState<string | null>(null);

React.useEffect(() => {
  let active = true;

  setIsLoading(true);
  setLoadError(null);

  fetchMarketingDashboardData({
    startDate: toIsoDate(dateValue.range.start),
    endDate: toIsoDate(dateValue.range.end),
  })
    .then((response) => {
      if (active) setDataset(response.rows);
    })
    .catch((error) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Erro ao carregar dados.");
    })
    .finally(() => {
      if (active) setIsLoading(false);
    });

  return () => {
    active = false;
  };
}, [dateValue.range.start, dateValue.range.end]);
```

Add this helper near the bottom of the file:

```ts
function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
```

- [ ] **Step 3: Add loading/error display**

After `<FilterBar>...</FilterBar>`, add:

```tsx
{isLoading ? (
  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
    Carregando dados do BigQuery...
  </div>
) : null}
{loadError ? (
  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
    {loadError}
  </div>
) : null}
```

- [ ] **Step 4: Remove unused `generateDataset` import**

Delete `generateDataset` from the import list.

- [ ] **Step 5: Verify compile**

Run: `npx tsc --noEmit`

Expected: allocation dashboard compiles.

---

### Task 9: Replace Mock Data in Funnel Dashboard

**Files:**
- Modify: `src/components/funnel-dashboard.tsx`

- [ ] **Step 1: Add fetch import**

```ts
import { fetchMarketingDashboardData } from "@/lib/marketing-dashboard-client";
```

- [ ] **Step 2: Replace mock dataset state**

Replace:

```ts
const dataset = React.useMemo(() => generateDataset(42), []);
```

with the same state/effect pattern used in Task 8.

- [ ] **Step 3: Add loading/error display**

After the `<FilterBar>...</FilterBar>`, add the same loading/error blocks from Task 8.

- [ ] **Step 4: Remove unused `generateDataset` import**

Delete `generateDataset` from the import list.

- [ ] **Step 5: Verify compile**

Run: `npx tsc --noEmit`

Expected: funnel dashboard compiles.

---

### Task 10: Verify API Locally

**Files:**
- No file changes expected.

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts on a local port.

- [ ] **Step 2: Call API**

Run in another terminal:

```bash
Invoke-RestMethod 'http://localhost:3000/api/marketing-dashboard?startDate=2026-05-01&endDate=2026-05-31' | ConvertTo-Json -Depth 5
```

Expected: JSON has `generatedAt` and a non-empty `rows` array.

- [ ] **Step 3: Confirm `Digital - WhatsApp` effect**

Run:

```bash
bq query --use_legacy_sql=false --format=pretty "SELECT COUNT(*) qtd FROM biduquery.curated_marketing.curated_marketing WHERE canal_vendas = 'Digital - WhatsApp'"
```

Expected: `qtd` is greater than `0`.

---

### Task 11: Browser Verification

**Files:**
- No file changes expected unless visual issues are found.

- [ ] **Step 1: Open dashboard**

Open:

```text
http://localhost:3000/dashboard
```

- [ ] **Step 2: Verify live dashboard behavior**

Expected:

- Page renders without console errors.
- KPI values are populated from BigQuery.
- Date filter triggers a reload.
- Platform, praca, and format filters still filter in the browser.
- Empty filter combinations show existing empty states instead of crashing.

- [ ] **Step 3: Capture issues and fix only dashboard data issues**

If the UI breaks because of label mismatches, fix the mapping in `marketing-dashboard-query.ts` or `dashboards-data.ts`. Do not redesign the dashboard in this task.

---

### Task 12: Final Verification

**Files:**
- No file changes expected unless verification finds issues.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: pass, or document preexisting unrelated lint failures.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: pass, or document preexisting unrelated build failures.

- [ ] **Step 3: Review diff**

Run:

```bash
git diff -- src package.json package-lock.json docs/superpowers
```

Expected: changes are limited to the BigQuery dashboard integration and docs.

---

## Notes

- Do not expose Google credentials through `NEXT_PUBLIC_*`.
- Keep BigQuery imports out of client components.
- If production deployment is required, configure credentials separately on the VPS before `next start`.
- If `gold_marketing.fact_funil_tipo_campanha` is refreshed and validated, it can replace the more verbose curated query later.
