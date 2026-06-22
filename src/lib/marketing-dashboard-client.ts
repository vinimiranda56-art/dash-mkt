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
