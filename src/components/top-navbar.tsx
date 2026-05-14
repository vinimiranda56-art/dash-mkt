"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, LogOut, Moon, Search, Settings2, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-2 flex h-14 items-center gap-4 border-b border-white/10 bg-background/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Left slot (reserved) */}
      <div className="flex flex-1 items-center" aria-hidden />

      {/* Center: search */}
      <div className="flex w-full max-w-[480px] justify-center">
        <SearchBar />
      </div>

      {/* Right: actions */}
      <div className="flex flex-1 items-center justify-end gap-1.5">
        <ThemeToggle />
        <NotificationButton />
        <UserMenu />
      </div>
    </div>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

function SearchBar() {
  const [value, setValue] = React.useState("");

  return (
    <label className="group relative flex h-9 w-full items-center rounded-full border border-white/10 bg-white/5 text-sm transition focus-within:border-[var(--palette-blue)]/50 focus-within:bg-white/[0.07]">
      <Search className="ml-3 size-4 shrink-0 text-muted-foreground transition group-focus-within:text-foreground" />
      <input
        type="text"
        placeholder="Buscar páginas e sistemas..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <kbd className="mr-2 hidden h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] leading-none text-muted-foreground sm:inline-flex">
        ⌘ K
      </kbd>
    </label>
  );
}

// ─── Theme toggle ────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = React.useState(true);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={dark ? "Tema escuro" : "Tema claro"}
    >
      {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────

function NotificationButton() {
  return (
    <button
      type="button"
      className="relative grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      aria-label="Notificações"
      title="Notificações"
    >
      <Bell className="size-4" />
      <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--palette-orange)] shadow-[0_0_8px_var(--palette-orange)]" />
    </button>
  );
}

// ─── User menu (hover) ───────────────────────────────────────────────────────

function UserMenu() {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  }

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onFocus={openMenu}
        onBlur={scheduleClose}
        className={cn(
          "grid size-9 place-items-center rounded-full border bg-[var(--palette-blue)]/15 text-[var(--palette-blue)] transition",
          open ? "border-[var(--palette-blue)]/60" : "border-white/10 hover:border-white/20",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User className="size-4" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 top-full z-40 mt-2 w-[220px] origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-panel)] shadow-xl"
            role="menu"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Vinicius Tavares</p>
              <p className="truncate text-xs text-muted-foreground">kyro@collision.cx</p>
            </div>
            <UserMenuItem icon={User} label="Perfil" />
            <UserMenuItem icon={Settings2} label="Configurações" />
            <div className="my-1 h-px bg-white/10" />
            <UserMenuItem icon={LogOut} label="Sair" danger />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function UserMenuItem({
  icon: Icon,
  label,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-white/5",
        danger
          ? "text-[var(--palette-pink)] hover:bg-[var(--palette-pink)]/10"
          : "text-foreground/90 hover:text-foreground",
      )}
    >
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </button>
  );
}
