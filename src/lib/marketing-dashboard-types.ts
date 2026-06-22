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

export type MarketingDashboardDailyPoint = {
  date: string;
  label: string;
  investment: number;
  roas: number;
  sales: number;
  logs: number;
  leadToProposta: number;
  propostaToVisita: number;
  visitaToVenda: number;
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
  daily: MarketingDashboardDailyPoint[];
};
