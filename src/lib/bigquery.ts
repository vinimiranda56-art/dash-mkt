import "server-only";

import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "biduquery";

const bigquery = new BigQuery({
  projectId,
});

export async function runBigQuery<T>(
  query: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const [rows] = await bigquery.query({
    query,
    params,
    location: "southamerica-east1",
    useLegacySql: false,
  });

  return rows as T[];
}
