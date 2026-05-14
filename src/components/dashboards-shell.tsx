"use client";

import { Wallet } from "lucide-react";
import { motion } from "motion/react";
import { Sidebar as AppSidebar } from "@/components/ui/sidebar";
import { dashboardFooterItems, getNavItems } from "@/components/dashboard-nav";
import { TopNavbar } from "@/components/top-navbar";

type Props = {
  title?: string;
  eyebrow?: string;
  description?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardsShell({ title, eyebrow, description, toolbar, children }: Props) {
  const hasHeader = Boolean(title || eyebrow || description || toolbar);
  const navItems = getNavItems("novos");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar
          compact
          className="border-white/10 bg-[#0c090d]"
          items={navItems}
          footerItems={dashboardFooterItems}
          logo={
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--palette-blue)] text-white shadow-[0_0_24px_rgba(55,119,255,0.35)]">
              <Wallet className="size-5" />
            </div>
          }
        />

        <section className="flex-1 px-4 pb-5 sm:px-6 lg:px-8">
          <TopNavbar />
          <div className="mx-auto flex max-w-[1600px] flex-col gap-10 pt-4">
            {hasHeader ? (
              <motion.header
                className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div>
                  {eyebrow ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--palette-orange)]">
                      {eyebrow}
                    </p>
                  ) : null}
                  {title ? (
                    <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground">
                      {title}
                    </h1>
                  ) : null}
                  {description ? (
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                  ) : null}
                </div>
                {toolbar}
              </motion.header>
            ) : null}

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

// ─── Section header (per-section, inside the unified shell) ──────────────────

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-end gap-5 border-b border-white/10 pb-4">
      <span className="font-serif text-5xl italic leading-none text-[var(--palette-orange)]">
        {index}
      </span>
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ─── Shared small primitives ─────────────────────────────────────────────────

// ─── RichPanel — elevated card style (preview) ───────────────────────────────

export function RichPanel({
  title,
  subtitle,
  toolbar,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "group relative overflow-hidden rounded-[24px] border border-white/[0.08] " +
        "bg-gradient-to-b from-[var(--surface-panel)] to-[#13101A] " +
        "shadow-[0_28px_70px_-20px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] " +
        "transition-[border-color,box-shadow,transform] duration-300 " +
        "hover:border-white/[0.16] hover:shadow-[0_32px_80px_-20px_rgba(55,119,255,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] " +
        (className ?? "")
      }
    >
      {/* Top sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.045] to-transparent"
      />
      {/* Corner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[var(--palette-blue)]/[0.06] blur-3xl"
      />

      {(title || toolbar) ? (
        <>
          <div className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div>
              {title ? (
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
          </div>
          <div
            aria-hidden
            className="relative h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent"
          />
        </>
      ) : null}

      <div className="relative">{children}</div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  toolbar,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-[22px] border border-white/10 bg-[var(--surface-panel)] shadow-[0_18px_45px_rgba(0,0,0,0.22)] " +
        (className ?? "")
      }
    >
      {(title || toolbar) && (
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {toolbar}
        </div>
      )}
      {children}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border-l-2 border-[var(--palette-orange)] bg-[var(--surface-panel)]/60 px-5 py-4 text-sm text-muted-foreground">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--palette-orange)]">
        Como ler
      </p>
      {children}
    </div>
  );
}
