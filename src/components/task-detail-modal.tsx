"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock,
  FolderOpen,
  Hourglass,
  Loader2,
  Pencil,
  Plug,
  Target as TargetIcon,
  Timer,
  User as UserIcon,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDateLong,
  formatTime,
  KIND_LABEL,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  STATUS_LABEL,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks-data";

const STATUS_ACCENT: Record<TaskStatus, string> = {
  success: "var(--palette-yellow)",
  warning: "var(--palette-orange)",
  error: "var(--palette-pink)",
  pending: "rgb(168, 162, 154)",
  in_progress: "var(--palette-blue)",
};

export function TaskDetailModal({
  open,
  task,
  onClose,
  onEdit,
  onMarkComplete,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onMarkComplete?: (task: Task) => void;
}) {
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
      {open && task ? (
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
            className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-panel)] shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Accent bar on left edge */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1"
              style={{ backgroundColor: STATUS_ACCENT[task.status] }}
            />

            <Header task={task} onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <BadgesRow task={task} />
              <TargetCard target={task.target} />
              <DetailGrid task={task} />
            </div>

            <Footer task={task} onEdit={onEdit} onMarkComplete={onMarkComplete} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pt-6 pb-5">
      <div className="flex min-w-0 items-start gap-3">
        <StatusIconLarge status={task.status} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>{KIND_LABEL[task.kind]}</span>
            <span className="text-muted-foreground/30">·</span>
            <span style={{ color: STATUS_ACCENT[task.status] }}>{STATUS_LABEL[task.status]}</span>
          </p>
          <h2 className="mt-1.5 text-xl font-semibold leading-tight">{task.action}</h2>
          {task.description ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{task.description}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </header>
  );
}

// ─── Badges row (Status · Prioridade · Projeto) ──────────────────────────────

function BadgesRow({ task }: { task: Task }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <PriorityPill priority={task.priority} />
      <ProjectPill project={task.project} />
    </div>
  );
}

function PriorityPill({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    high: "border-[var(--palette-pink)]/40 bg-[var(--palette-pink)]/15 text-[var(--palette-pink)]",
    medium: "border-[var(--palette-yellow)]/40 bg-[var(--palette-yellow)]/15 text-[var(--palette-yellow)]",
    low: "border-white/15 bg-white/[0.06] text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        styles[priority],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      Prioridade {PRIORITY_LABEL[priority]}
    </span>
  );
}

function ProjectPill({ project }: { project?: string }) {
  if (!project) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
        <FolderOpen className="size-3" />
        Aberta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--palette-blue)]/30 bg-[var(--palette-blue)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--palette-blue)]">
      <FolderOpen className="size-3" />
      {project}
    </span>
  );
}

// ─── Target card with chips ──────────────────────────────────────────────────

function TargetCard({ target }: { target: string }) {
  const chips = target.split(/\s*·\s*/).filter(Boolean);
  return (
    <div className="mb-4 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <TargetIcon className="size-3" />
        Alvo
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {chips.length > 1 ? (
          chips.map((chip, i) => (
            <React.Fragment key={`${chip}-${i}`}>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium">
                {chip}
              </span>
              {i < chips.length - 1 ? (
                <span className="text-muted-foreground/40">›</span>
              ) : null}
            </React.Fragment>
          ))
        ) : (
          <span className="text-sm">{target}</span>
        )}
      </div>
    </div>
  );
}

// ─── Detail grid (responsável, datas, fonte, etc) ────────────────────────────

function DetailGrid({ task }: { task: Task }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <DetailItem icon={UserIcon} label="Responsável" value={task.user} />
      <DetailItem icon={Plug} label="Fonte" value={SOURCE_LABEL[task.source]} />
      <DetailItem
        icon={Calendar}
        label={task.kind === "task" ? "Criado em" : "Executado em"}
        value={`${formatDateLong(task.timestamp)} · ${formatTime(task.timestamp)}`}
      />
      {task.dueDate ? (
        <DetailItem
          icon={CalendarClock}
          label="Vencimento"
          value={`${formatDateLong(task.dueDate)} · ${formatTime(task.dueDate)}`}
          tone="warning"
        />
      ) : null}
      {task.completedAt ? (
        <DetailItem
          icon={CalendarCheck2}
          label="Concluído em"
          value={`${formatDateLong(task.completedAt)} · ${formatTime(task.completedAt)}`}
          tone="success"
        />
      ) : null}
      {task.durationMin !== undefined ? (
        <DetailItem icon={Hourglass} label="Duração" value={`${task.durationMin} min`} />
      ) : null}
      <DetailItem
        icon={Timer}
        label="ID"
        value={task.id}
        mono
        muted
        full={!task.dueDate && !task.completedAt && task.durationMin === undefined}
      />
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  mono,
  muted,
  full,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  full?: boolean;
  tone?: "warning" | "success";
}) {
  const valueTone =
    tone === "warning"
      ? "text-[var(--palette-orange)]"
      : tone === "success"
        ? "text-[var(--palette-yellow)]"
        : muted
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/10",
        full && "sm:col-span-2",
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/5 text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 break-words text-sm",
            mono && "font-mono text-xs",
            valueTone,
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Footer (actions) ────────────────────────────────────────────────────────

function Footer({
  task,
  onEdit,
  onMarkComplete,
}: {
  task: Task;
  onEdit?: (task: Task) => void;
  onMarkComplete?: (task: Task) => void;
}) {
  const canMark = (task.status === "pending" || task.status === "in_progress") && Boolean(onMarkComplete);
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
        ESC fecha · clique fora também
      </span>
      <div className="flex items-center gap-2">
        {canMark ? (
          <button
            type="button"
            onClick={() => onMarkComplete!(task)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--palette-yellow)]/15 px-3.5 py-2 text-xs font-semibold text-[var(--palette-yellow)] ring-1 ring-[var(--palette-yellow)]/30 transition hover:bg-[var(--palette-yellow)]/25"
          >
            <Check className="size-3.5" />
            Marcar concluída
          </button>
        ) : null}
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold transition hover:bg-white/10"
          >
            <Pencil className="size-3.5" />
            Editar
          </button>
        ) : null}
      </div>
    </footer>
  );
}

// ─── Status icons (shared) ───────────────────────────────────────────────────

const STATUS_ICONS: Record<TaskStatus, { Icon: LucideIcon; classes: string }> = {
  success: {
    Icon: CheckCircle2,
    classes: "bg-[var(--palette-yellow)]/15 text-[var(--palette-yellow)]",
  },
  warning: {
    Icon: AlertTriangle,
    classes: "bg-[var(--palette-orange)]/15 text-[var(--palette-orange)]",
  },
  error: {
    Icon: XCircle,
    classes: "bg-[var(--palette-pink)]/15 text-[var(--palette-pink)]",
  },
  pending: {
    Icon: Clock,
    classes: "bg-white/10 text-muted-foreground",
  },
  in_progress: {
    Icon: Loader2,
    classes: "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]",
  },
};

function StatusIconLarge({ status }: { status: TaskStatus }) {
  const { Icon, classes } = STATUS_ICONS[status];
  return (
    <span className={cn("mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl", classes)}>
      <Icon className={cn("size-5", status === "in_progress" && "animate-spin")} />
    </span>
  );
}

export function TaskStatusIcon({ status, size = "sm" }: { status: TaskStatus; size?: "sm" | "md" }) {
  const { Icon, classes } = STATUS_ICONS[status];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        size === "sm" ? "size-6" : "size-8",
        classes,
      )}
    >
      <Icon className={cn(size === "sm" ? "size-3.5" : "size-4", status === "in_progress" && "animate-spin")} />
    </span>
  );
}
