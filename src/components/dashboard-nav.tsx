"use client";

import {
  FileBarChart,
  Home,
  LineChartIcon,
  PieChartIcon,
  Plug,
  Settings2,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import type { SidebarItem } from "@/components/ui/sidebar";

export type DashboardNavKey =
  | "novos"
  | "orcamentos"
  | "leads"
  | "metas"
  | null;

export function getNavItems(active: DashboardNavKey): SidebarItem[] {
  return [
    {
      name: "Dashboard",
      href: "/dashboard/novos",
      icon: <Home className="size-4" />,
      active: active === "novos",
    },
    {
      name: "Orcamentos",
      href: "/orcamentos",
      icon: <LineChartIcon className="size-4" />,
      active: active === "orcamentos",
    },
    {
      name: "Leads",
      href: "#",
      icon: <UserPlus className="size-4" />,
      active: active === "leads",
    },
    {
      name: "Metas",
      href: "#",
      icon: <Target className="size-4" />,
      active: active === "metas",
    },
    {
      name: "Relatorios",
      href: "#",
      icon: <FileBarChart className="size-4" />,
      items: [
        { name: "Canais", href: "#", icon: <PieChartIcon className="size-4" /> },
        { name: "Integracoes", href: "#", icon: <Plug className="size-4" /> },
        { name: "Equipe", href: "#", icon: <Users className="size-4" /> },
      ],
    },
  ];
}

export const dashboardFooterItems: SidebarItem[] = [
  { name: "Metas", href: "#", icon: <Target className="size-4" /> },
  { name: "Configuracoes", href: "#", icon: <Settings2 className="size-4" /> },
];
