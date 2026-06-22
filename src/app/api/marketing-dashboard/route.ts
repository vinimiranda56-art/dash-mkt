import { NextResponse, type NextRequest } from "next/server";

import { getMarketingDashboardData } from "@/lib/marketing-dashboard-query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") ?? "2026-01-01";
  const endDate =
    searchParams.get("endDate") ?? new Date().toISOString().slice(0, 10);

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
