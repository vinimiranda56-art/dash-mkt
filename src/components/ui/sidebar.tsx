"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  name: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  items?: SidebarItem[];
};

type SidebarProps = {
  logo?: React.ReactNode;
  items: SidebarItem[];
  footerItems?: SidebarItem[];
  compact?: boolean;
  className?: string;
};

export function Sidebar({
  logo,
  items,
  footerItems = [],
  compact = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-background p-3 sm:flex",
        compact ? "w-[74px]" : "w-72",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col rounded-3xl bg-[var(--surface-panel)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
          compact ? "items-center py-4" : "px-3 py-4",
        )}
      >
        {logo ? <div className={cn("mb-6", compact && "grid place-items-center")}>{logo}</div> : null}

        <nav className={cn("flex flex-1 flex-col gap-1", compact && "items-center")}>
          {items.map((item) => (
            <SidebarNavItem key={item.name} item={item} compact={compact} />
          ))}
        </nav>

        {footerItems.length ? (
          <div className={cn("mt-6 flex flex-col gap-1", compact && "items-center")}>
            {footerItems.map((item) => (
              <SidebarNavItem key={item.name} item={item} compact={compact} />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function SidebarNavItem({
  item,
  compact,
}: {
  item: SidebarItem;
  compact: boolean;
}) {
  const [open, setOpen] = React.useState(Boolean(item.active));
  const hasChildren = Boolean(item.items?.length);

  if (hasChildren && !compact) {
    return (
      <div>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-lg p-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground",
            item.active && "bg-[var(--palette-blue)] text-white shadow-sm",
          )}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.name}
          </span>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open ? (
          <div className="ml-4 mt-1 border-l border-border pl-2">
            {item.items?.map((subItem) => (
              <a
                key={subItem.name}
                href={subItem.href ?? "#"}
                className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                {subItem.icon}
                {subItem.name}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const content = compact ? item.icon : (
    <>
      {item.icon}
      <span>{item.name}</span>
    </>
  );

  return (
    <a
      href={item.href ?? "#"}
      className={cn(
        "flex items-center gap-2 rounded-xl text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground",
        compact ? "grid size-9 place-items-center" : "p-2",
        item.active && "bg-[var(--palette-blue)] text-white shadow-sm",
      )}
      aria-label={compact ? item.name : undefined}
      title={compact ? item.name : undefined}
    >
      {content}
    </a>
  );
}
