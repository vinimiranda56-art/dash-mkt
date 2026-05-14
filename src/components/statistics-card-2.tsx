"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
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
  accent?: "default" | "orange";
  className?: string;
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function StatisticsCard2({
  label,
  value,
  delta,
  icon: Icon,
  rows = [],
  progress = 92,
  trend = "up",
  accent = "default",
  className,
}: StatisticsCard2Props) {
  const isPositive = trend === "up";
  const isOrange = accent === "orange";

  const iconClass = isOrange
    ? "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]"
    : "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]";

  const fillClass = isOrange
    ? "bg-[var(--palette-orange)]"
    : isPositive
      ? "bg-[var(--palette-yellow)]"
      : "bg-[var(--palette-pink)]";

  const textClass = isOrange
    ? "text-[var(--palette-orange)]"
    : isPositive
      ? "text-[var(--palette-yellow)]"
      : "text-[var(--palette-pink)]";

  return (
    <motion.div variants={cardVariants} className="h-full">
      <Card
        variant="accent"
        className={cn(
          "min-h-[154px] h-full rounded-[22px] border bg-[var(--surface-panel)] p-0 shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition-[border-color,box-shadow] duration-300",
          isOrange
            ? "border-[var(--palette-orange)]/50 hover:border-[var(--palette-orange)]/80 hover:shadow-[0_22px_55px_rgba(242,100,25,0.18)]"
            : "border-white/10 hover:border-white/20 hover:shadow-[0_22px_55px_rgba(55,119,255,0.10)]",
          className,
        )}
      >
        <CardContent className="rounded-[20px] bg-transparent p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-[var(--text-soft)]">{label}</p>
            <motion.span
              className={cn("grid size-7 place-items-center rounded-full", iconClass)}
              whileHover={{ scale: 1.18, rotate: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Icon className="size-4" />
            </motion.span>
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
            <motion.div
              className={cn("h-full rounded-full", fillClass)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
            />
          </div>

          <p className={cn("mt-2 text-xs font-medium", textClass)}>{delta} vs anterior</p>

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
    </motion.div>
  );
}

export const Component = StatisticsCard2;
