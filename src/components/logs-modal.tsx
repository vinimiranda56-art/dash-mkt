"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLogsForDate, type LogEntry, type LogStatus } from "@/lib/dashboards-data";

type Props = {
  open: boolean;
  date: Date | null;
  count: number;
  onClose: () => void;
};

export function LogsModal({ open, date, count, onClose }: Props) {
  const logs = React.useMemo<LogEntry[]>(() => {
    if (!date) return [];
    return getLogsForDate(date, count);
  }, [date, count]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && date ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-panel)] shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--palette-orange)]">
                  Logs do dia
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {formatLongDate(date)}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {count} {count === 1 ? "ação registrada" : "ações registradas"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-white/[0.06]">
                {logs.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 px-6 py-3 transition hover:bg-white/[0.03]"
                  >
                    <StatusIcon status={entry.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{entry.action}</p>
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {entry.target}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
                        por {entry.user}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              ESC fecha · clique fora também
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StatusIcon({ status }: { status: LogStatus }) {
  const map = {
    success: {
      Icon: CheckCircle2,
      cls: "bg-[var(--palette-yellow)]/15 text-[var(--palette-yellow)]",
    },
    warning: {
      Icon: AlertTriangle,
      cls: "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]",
    },
    error: {
      Icon: XCircle,
      cls: "bg-[var(--palette-pink)]/15 text-[var(--palette-pink)]",
    },
  } as const;
  const { Icon, cls } = map[status];
  return (
    <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", cls)}>
      <Icon className="size-3.5" />
    </span>
  );
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatLongDate(date: Date) {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
