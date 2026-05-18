"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_KINDS,
  ALL_PRIORITIES,
  KIND_LABEL,
  PRIORITY_LABEL,
  PROJECTS,
  STATUS_LABEL,
  type Task,
  type TaskKind,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks-data";

type Mode = "create" | "edit";

type FormState = {
  kind: TaskKind;
  status: TaskStatus;
  priority: TaskPriority;
  action: string;
  description: string;
  target: string;
  user: string;
  project: string; // "" = aberta / sem projeto
  dueDate: string;
};

const STATUSES_BY_KIND: Record<TaskKind, TaskStatus[]> = {
  task: ["pending", "in_progress", "success"],
  action: ["success", "warning", "error"],
};

const STEPS = [
  { id: 0, label: "Tipo & título", helper: "Defina o tipo da entrada e o que ela é" },
  { id: 1, label: "Alvo & responsável", helper: "Onde acontece e quem é responsável" },
  { id: 2, label: "Prioridade & prazo", helper: "Defina urgência, status e quando precisa estar pronto" },
] as const;

function isoLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromForm(form: FormState, base: Task | null): Task {
  const now = new Date();
  const due = form.dueDate ? new Date(form.dueDate) : undefined;
  const id = base?.id ?? `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    id,
    kind: form.kind,
    timestamp: base?.timestamp ?? now,
    dueDate: form.kind === "task" ? due : undefined,
    completedAt:
      form.status === "success" || form.status === "warning" || form.status === "error"
        ? (base?.completedAt ?? now)
        : undefined,
    user: form.user.trim() || "Não atribuído",
    action: form.action.trim(),
    description: form.description.trim(),
    target: form.target.trim(),
    targetId: form.target.trim().replace(/\s+·\s+/g, "/"),
    status: form.status,
    priority: form.priority,
    durationMin: base?.durationMin,
    source: base?.source ?? "manual",
    project: form.project.trim() ? form.project.trim() : undefined,
  };
}

function toForm(task: Task | null): FormState {
  if (!task) {
    const dueDefault = new Date();
    dueDefault.setDate(dueDefault.getDate() + 1);
    dueDefault.setHours(10, 0);
    return {
      kind: "task",
      status: "pending",
      priority: "medium",
      action: "",
      description: "",
      target: "",
      user: "",
      project: "",
      dueDate: isoLocal(dueDefault),
    };
  }
  return {
    kind: task.kind,
    status: task.status,
    priority: task.priority,
    action: task.action,
    description: task.description,
    target: task.target,
    user: task.user,
    project: task.project ?? "",
    dueDate: task.dueDate ? isoLocal(task.dueDate) : "",
  };
}

export function TaskEditorModal({
  open,
  mode,
  task,
  users,
  onSave,
  onClose,
}: {
  open: boolean;
  mode: Mode;
  task?: Task | null;
  users: string[];
  onSave: (task: Task) => void;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(() => toForm(task ?? null));
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setForm(toForm(task ?? null));
      setStep(0);
    }
  }, [open, task]);

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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "kind") {
        const validStatuses = STATUSES_BY_KIND[value as TaskKind];
        if (!validStatuses.includes(next.status)) {
          next.status = validStatuses[0]!;
        }
      }
      return next;
    });
  }

  const stepValid = (() => {
    if (step === 0) return form.action.trim().length > 0;
    if (step === 1) return form.target.trim().length > 0;
    return true;
  })();

  const isLast = step === STEPS.length - 1;

  function next() {
    if (!stepValid) return;
    if (isLast) {
      onSave(fromForm(form, task ?? null));
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    next();
  }

  function jumpTo(target: number) {
    // Allow jumping back freely, forward only if previous steps are valid
    if (target <= step) {
      setStep(target);
      return;
    }
    if (target === 1 && form.action.trim().length === 0) return;
    if (target === 2 && (form.action.trim().length === 0 || form.target.trim().length === 0)) return;
    setStep(target);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-panel)] shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-4 pt-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--palette-orange)]">
                  {mode === "create" ? "Criar" : "Editar"} {KIND_LABEL[form.kind].toLowerCase()}
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {STEPS[step].label}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{STEPS[step].helper}</p>
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

            <Stepper current={step} onJump={jumpTo} />

            <div className="relative flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="grid grid-cols-2 gap-4 text-sm"
                >
                  {step === 0 ? <StepTypeAndTitle form={form} update={update} /> : null}
                  {step === 1 ? <StepTargetAndOwner form={form} update={update} users={users} /> : null}
                  {step === 2 ? <StepPriorityAndDue form={form} update={update} /> : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={step === 0 ? onClose : back}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
              >
                {step === 0 ? "Cancelar" : (
                  <>
                    <ArrowLeft className="size-4" />
                    Voltar
                  </>
                )}
              </button>

              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                Passo {step + 1} de {STEPS.length}
              </span>

              <button
                type="submit"
                disabled={!stepValid}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
                  isLast
                    ? "bg-[var(--palette-yellow)] text-background hover:opacity-90 disabled:bg-[var(--palette-yellow)]/40"
                    : "bg-[var(--palette-blue)] hover:opacity-90 disabled:bg-[var(--palette-blue)]/40",
                )}
              >
                {isLast ? (
                  <>
                    <Check className="size-4" />
                    {mode === "create" ? "Criar" : "Salvar"}
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </footer>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-6 py-3.5">
      {STEPS.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-semibold transition",
                active
                  ? "text-foreground"
                  : done
                    ? "text-[var(--palette-blue)] hover:bg-white/5"
                    : "text-muted-foreground/60 hover:text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[10px] font-bold tabular-nums transition",
                  active
                    ? "bg-[var(--palette-blue)] text-white shadow-[0_0_12px_rgba(55,119,255,0.5)]"
                    : done
                      ? "bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]"
                      : "bg-white/5 text-muted-foreground/60",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1 transition",
                  i < current ? "bg-[var(--palette-blue)]/40" : "bg-white/10",
                )}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

type StepProps = {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function StepTypeAndTitle({ form, update }: StepProps) {
  return (
    <>
      <Field label="Tipo" full>
        <div className="flex gap-2">
          {ALL_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => update("kind", kind)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition",
                form.kind === kind
                  ? "border-[var(--palette-blue)] bg-[var(--palette-blue)]/15 text-[var(--palette-blue)]"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {KIND_LABEL[kind]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Título" full required>
        <input
          required
          autoFocus
          type="text"
          value={form.action}
          onChange={(e) => update("action", e.target.value)}
          placeholder="Ex: Revisar criativos da campanha Mogi"
          className={inputCls}
        />
      </Field>

      <Field label="Descrição" full>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Detalhes ou contexto adicional (opcional)"
          rows={3}
          className={cn(inputCls, "h-auto resize-none py-2")}
        />
      </Field>
    </>
  );
}

function StepTargetAndOwner({
  form,
  update,
  users,
}: StepProps & { users: string[] }) {
  return (
    <>
      <Field label="Alvo" full required>
        <input
          required
          autoFocus
          type="text"
          value={form.target}
          onChange={(e) => update("target", e.target.value)}
          placeholder="Ex: Mogi 2 · Google · pesquisa"
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground/70">
          Use o padrão Praça · Plataforma · Formato
        </p>
      </Field>

      <Field label="Responsável">
        <input
          type="text"
          value={form.user}
          onChange={(e) => update("user", e.target.value)}
          list="task-users"
          placeholder="Nome do responsável"
          className={inputCls}
        />
        <datalist id="task-users">
          {users.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </Field>

      <Field label="Projeto">
        <select
          value={form.project}
          onChange={(e) => update("project", e.target.value)}
          className={inputCls}
        >
          <option value="">— Aberta (sem projeto)</option>
          {PROJECTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-muted-foreground/70">
          Vincule a um projeto ou deixe em aberto
        </p>
      </Field>
    </>
  );
}

function StepPriorityAndDue({ form, update }: StepProps) {
  return (
    <>
      <Field label="Prioridade" full>
        <div className="grid grid-cols-3 gap-2">
          {ALL_PRIORITIES.map((p) => {
            const active = form.priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update("priority", p)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition",
                  active
                    ? p === "high"
                      ? "border-[var(--palette-pink)] bg-[var(--palette-pink)]/15 text-[var(--palette-pink)]"
                      : p === "medium"
                        ? "border-[var(--palette-yellow)] bg-[var(--palette-yellow)]/15 text-[var(--palette-yellow)]"
                        : "border-white/20 bg-white/10 text-foreground"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                )}
              >
                {PRIORITY_LABEL[p]}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Status">
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value as TaskStatus)}
          className={inputCls}
        >
          {STATUSES_BY_KIND[form.kind].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>

      {form.kind === "task" ? (
        <Field label="Vencimento">
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            className={inputCls}
          />
        </Field>
      ) : (
        <div />
      )}
    </>
  );
}

// ─── Field primitives ────────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--palette-blue)]/50 focus:bg-white/[0.07]";

function Field({
  label,
  full,
  required,
  children,
}: {
  label: string;
  full?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", full && "col-span-2")}>
      <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label} {required ? <span className="text-[var(--palette-pink)]">*</span> : null}
      </label>
      {children}
    </div>
  );
}
