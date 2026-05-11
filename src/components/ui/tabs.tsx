"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
};

type TabsProps = {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
  expandable?: boolean;
  onValueChange?: (value: string) => void;
};

export function Tabs({
  tabs,
  defaultValue = tabs[0]?.id,
  className,
  expandable = false,
  onValueChange,
}: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);

  function selectTab(nextValue: string) {
    setValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-md bg-muted p-1 text-sm",
        expandable && "items-center gap-2 rounded-2xl bg-background p-2 shadow-sm",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              "h-8 rounded px-3 font-medium text-muted-foreground transition-all",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isActive && "bg-background text-foreground shadow-sm",
              expandable &&
                "flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-xl px-3",
              expandable && tab.color,
              expandable && isActive && "min-w-[128px] text-white shadow-sm",
              expandable && !isActive && "px-0 text-white/90",
            )}
            onClick={() => selectTab(tab.id)}
          >
            {Icon ? <Icon className="size-4 shrink-0" /> : null}
            <span className={cn(Icon && "ml-2", expandable && !isActive && "sr-only")}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
