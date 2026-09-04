import "server-only";

import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "biduquery";
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

const bigquery = new BigQuery({
  projectId,
  ...(credentialsJson ? { credentials: JSON.parse(credentialsJson) } : {}),
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
