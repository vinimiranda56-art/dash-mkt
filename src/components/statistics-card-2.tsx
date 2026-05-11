"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/badge-2";
import { Card, CardContent } from "@/components/card";

export type StatisticsRow = {
  label: string;
  value: string;
};

export type StatisticsCard2Props = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  rows?: StatisticsRow[];
  progress?: number;
  trend?: "up" | "down";
  className?: string;
};

export function StatisticsCard2({
  label,
  value,
  delta,
  icon: Icon,
  rows = [],
  progress = 92,
  trend = "up",
  className,
}: StatisticsCard2Props) {
  const isPositive = trend === "up";

  return (
    <Card
      variant="accent"
      className={cn(
        "min-h-[154px] rounded-[22px] border border-white/10 bg-[var(--surface-panel)] p-0 shadow-[0_18px_45px_rgba(0,0,0,0.22)]",
        className,
      )}
    >
      <CardContent className="rounded-[20px] bg-transparent p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-[var(--text-soft)]">{label}</p>
          <span className="grid size-7 place-items-center rounded-full bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]">
            <Icon className="size-4" />
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <Badge
            appearance="light"
            size="sm"
            variant={isPositive ? "success" : "destructive"}
            className="mb-0.5"
          >
            {delta}
          </Badge>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full",
              isPositive ? "bg-[var(--palette-yellow)]" : "bg-[var(--palette-pink)]",
            )}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>

        <p
          className={cn(
            "mt-2 text-xs font-medium",
            isPositive ? "text-[var(--palette-yellow)]" : "text-[var(--palette-pink)]",
          )}
        >
          {delta} vs anterior
        </p>

        {rows.length ? (
          <div className="mt-3 space-y-1.5 text-xs">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export const Component = StatisticsCard2;
