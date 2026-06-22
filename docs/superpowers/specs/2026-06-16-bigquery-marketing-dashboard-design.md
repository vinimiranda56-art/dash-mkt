# BigQuery Marketing Dashboard Design

**Goal:** Replace the current mocked marketing dashboard data with live server-side data from BigQuery project `biduquery`.

**Approved approach:** Use a Next.js API route backed by `@google-cloud/bigquery`. React components fetch normalized dashboard rows from this route instead of calling `generateDataset(42)`.

## Current State

The Next.js app currently renders dashboard data from `src/lib/dashboards-data.ts`.

The main mocked consumers are:

- `src/components/allocation-dashboard.tsx`
- `src/components/funnel-dashboard.tsx`

Both screens use the same core row shape:

```ts
{
  praca: string;
  platform: "Google" | "Meta - Bidu";
  format: string;
  investment: number;
  leads: number;
  proposals: number;
  visits: number;
  sales: number;
  revenue: number;
}
```

## BigQuery Sources

Use `curated_marketing` as the first production data source because it reflects current view changes, including `Digital - WhatsApp` in `curated_marketing.curated_marketing`.

Initial sources:

- `biduquery.curated_marketing.vw_leads_base`: lead count, date, unit, platform group, campaign type.
- `biduquery.curated_marketing.vw_funil_deals_marketing`: proposal, visit, sale stage indicators, attribution fields.
- `biduquery.curated_marketing.vw_spend_canal`: spend by date, channel, and group.
- `biduquery.curated_marketing.vw_vendas_canal`: sales count and revenue by date, unit, and group.

Use `gold_marketing.fact_funil_tipo_campanha` later only after confirming the rebuild is current enough for dashboard use.

## Architecture

Server-only BigQuery access:

- `src/lib/bigquery.ts`: create the BigQuery client and expose a small query helper.
- `src/lib/marketing-dashboard-query.ts`: hold SQL and row normalization.
- `src/app/api/marketing-dashboard/route.ts`: validate query params, execute the query, return JSON.

Client data loading:

- `src/lib/marketing-dashboard-data.ts`: shared types and fetch helper.
- `src/components/allocation-dashboard.tsx`: consume fetched data and preserve current interactions.
- `src/components/funnel-dashboard.tsx`: consume fetched data and preserve current interactions.

## Runtime

Local development can use Google Application Default Credentials already available through the installed Google SDK.

Production/VPS must use a server-side credential mechanism. The browser must never receive Google credentials.

## Error Handling

The API route returns:

- `200` with `{ rows, generatedAt }` on success.
- `400` for invalid query parameters.
- `500` with a generic error message for BigQuery/runtime failures.

The UI shows:

- loading state while fetching.
- error state if the API fails.
- empty state when filters return no rows.

## Acceptance Criteria

- The mocked `generateDataset(42)` source is no longer used by allocation and funnel dashboards.
- The API returns rows grouped by `praca`, `platform`, and `format`.
- The dashboard renders with real BigQuery data.
- Filtering by date, platform, praca, and format still works.
- No BigQuery credentials are exposed to client code.
- `npm run lint` and `npm run build` complete or any unrelated existing failures are documented.
