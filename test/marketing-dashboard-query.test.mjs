import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const querySource = readFileSync(new URL("../src/lib/marketing-dashboard-query.ts", import.meta.url), "utf8");

test("marketing dashboard investment uses the Looker unit source", () => {
  assert.match(querySource, /curated_marketing\.leads_por_unidade/);
});

test("marketing dashboard sales come from sales date without funnel fallback", () => {
  assert.match(querySource, /SAFE_CAST\(data_venda AS DATE\) BETWEEN params\.start_date AND params\.end_date/);

  assert.doesNotMatch(querySource, /COALESCE\(v\.sales(?:_from_sales_view)?,\s*f\.sales,\s*0\)/);
});
