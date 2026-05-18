"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { CalendarClock, Target as TargetIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskStatusIcon } from "@/components/task-detail-modal";
import {
  formatDateShort,
  formatTime,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks-data";

type ColumnKey = "pending" | "in_progress" | "success";

const COLUMNS: { key: ColumnKey; label: string; accent: string }[] = [
  { key: "pending", label: "Pendente", accent: "var(--palette-orange)" },
  { key: "in_progress", label: "Em andamento", accent: "var(--palette-blue)" },
  { key: "success", label: "Concluído", accent: "var(--palette-yellow)" },
];

const MAX_COMPLETED_VISIBLE = 30;
const DRAG_THRESHOLD = 5; // pixels before drag activates

type DragState = {
  task: Task;
  pointer: { x: number; y: number };
  cardSize: { width: number; height: number };
  pointerOffset: { x: number; y: number }; // distance from card top-left to cursor at start
};

export function TasksKanban({
  tasks,
  onSelect,
  onMoveTask,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onMoveTask?: (taskId: string, newStatus: ColumnKey) => void;
}) {
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const [overColumn, setOverColumn] = React.useState<ColumnKey | null>(null);
  const [lastMovedId, setLastMovedId] = React.useState<string | null>(null);

  const columnRefs = React.useRef<Map<ColumnKey, HTMLDivElement>>(new Map());
  const setColumnRef = React.useCallback(
    (key: ColumnKey) => (el: HTMLDivElement | null) => {
      if (el) columnRefs.current.set(key, el);
      else columnRefs.current.delete(key);
    },
    [],
  );

  function findColumnAt(x: number, y: number): ColumnKey | null {
    for (const [key, el] of columnRefs.current.entries()) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return key;
    }
    return null;
  }

  function handleDragStart(state: DragState) {
    setDrag(state);
  }

  function handleDragMove(x: number, y: number) {
    setDrag((d) => (d ? { ...d, pointer: { x, y } } : null));
    if (onMoveTask) setOverColumn(findColumnAt(x, y));
  }

  function handleDragEnd(task: Task, x: number, y: number) {
    const col = findColumnAt(x, y);
    if (col && col !== task.status && onMoveTask) {
      onMoveTask(task.id, col);
      setLastMovedId(task.id);
    }
    setDrag(null);
    setOverColumn(null);
  }

  const grouped = React.useMemo(() => {
    const map: Record<ColumnKey, Task[]> = {
      pending: [],
      in_progress: [],
      success: [],
    };
    for (const t of tasks) {
      if (t.status === "pending") map.pending.push(t);
      else if (t.status === "in_progress") map.in_progress.push(t);
      else if (t.status === "success") map.success.push(t);
    }
    function pinMovedFirst<T extends Task>(a: T, b: T, fallback: (a: T, b: T) => number) {
      if (lastMovedId) {
        if (a.id === lastMovedId) return -1;
        if (b.id === lastMovedId) return 1;
      }
      return fallback(a, b);
    }
    map.pending.sort((a, b) =>
      pinMovedFirst(a, b, (x, y) => {
        const xT = x.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const yT = y.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return xT - yT;
      }),
    );
    map.in_progress.sort((a, b) =>
      pinMovedFirst(a, b, (x, y) => {
        const xT = x.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const yT = y.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return xT - yT;
      }),
    );
    map.success.sort((a, b) =>
      pinMovedFirst(a, b, (x, y) => {
        const xT = x.completedAt?.getTime() ?? x.timestamp.getTime();
        const yT = y.completedAt?.getTime() ?? y.timestamp.getTime();
        return yT - xT;
      }),
    );
    map.success = map.success.slice(0, MAX_COMPLETED_VISIBLE);
    return map;
  }, [tasks, lastMovedId]);

  return (
    <LayoutGroup>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = grouped[col.key];
          const truncated = col.key === "success" && items.length === MAX_COMPLETED_VISIBLE;
          return (
            <KanbanColumn
              key={col.key}
              label={col.label}
              accent={col.accent}
              status={col.key}
              count={items.length}
              truncated={truncated}
              items={items}
              onSelect={onSelect}
              dragTaskId={drag?.task.id ?? null}
              isOver={overColumn === col.key}
              draggable={Boolean(onMoveTask)}
              containerRef={setColumnRef(col.key)}
              onCardDragStart={handleDragStart}
              onCardDrag={handleDragMove}
              onCardDragEnd={handleDragEnd}
            />
          );
        })}
      </div>

      {drag && typeof window !== "undefined"
        ? createPortal(<DragGhost drag={drag} />, document.body)
        : null}
    </LayoutGroup>
  );
}

// ─── Column ──────────────────────────────────────────────────────────────────

function KanbanColumn({
  label,
  accent,
  status,
  count,
  items,
  truncated,
  onSelect,
  dragTaskId,
  isOver,
  draggable,
  containerRef,
  onCardDragStart,
  onCardDrag,
  onCardDragEnd,
}: {
  label: string;
  accent: string;
  status: TaskStatus;
  count: number;
  items: Task[];
  truncated?: boolean;
  onSelect: (task: Task) => void;
  dragTaskId: string | null;
  isOver: boolean;
  draggable: boolean;
  containerRef: (el: HTMLDivElement | null) => void;
  onCardDragStart: (state: DragState) => void;
  onCardDrag: (x: number, y: number) => void;
  onCardDragEnd: (task: Task, x: number, y: number) => void;
}) {
  const dragActive = dragTaskId !== null;
  return (
    <div
      ref={containerRef}
      className={cn(
        "flex max-h-[720px] min-h-[420px] flex-col overflow-hidden rounded-[20px] border bg-[var(--surface-panel)]/70 transition-[border-color,background-color,box-shadow] duration-200 ease-out",
        isOver
          ? "border-[var(--palette-blue)]/60 bg-[var(--palette-blue)]/[0.06] shadow-[0_0_0_3px_rgba(55,119,255,0.18)]"
          : dragActive
            ? "border-white/15"
            : "border-white/10",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <Badge
          variant="outline"
          className="border-transparent bg-white/5 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground"
        >
          {count}
        </Badge>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {items.length === 0 ? (
          <motion.p
            layout
            className={cn(
              "rounded-xl border border-dashed border-white/10 px-3 py-10 text-center text-xs text-muted-foreground transition",
              isOver && "border-[var(--palette-blue)]/50 bg-[var(--palette-blue)]/[0.04] text-[var(--palette-blue)]",
            )}
          >
            {isOver ? "Solte aqui" : `Nada por aqui — ${STATUS_LABEL[status].toLowerCase()} vazio.`}
          </motion.p>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onSelect={onSelect}
                draggable={draggable}
                onDragStart={onCardDragStart}
                onDrag={onCardDrag}
                onDragEnd={onCardDragEnd}
                isBeingDragged={dragTaskId === task.id}
              />
            ))}
          </AnimatePresence>
        )}
        {truncated ? (
          <p className="pt-2 text-center text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Mostrando os {MAX_COMPLETED_VISIBLE} mais recentes
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Card (uses pointer events, renders inline) ──────────────────────────────

function KanbanCard({
  task,
  onSelect,
  draggable,
  onDragStart,
  onDrag,
  onDragEnd,
  isBeingDragged,
}: {
  task: Task;
  onSelect: (t: Task) => void;
  draggable: boolean;
  onDragStart: (state: DragState) => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (task: Task, x: number, y: number) => void;
  isBeingDragged: boolean;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const draggingRef = React.useRef(false);
  const movedRef = React.useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggable || e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const target = ref.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const pointerOffset = { x: startX - rect.left, y: startY - rect.top };
    movedRef.current = false;
    draggingRef.current = false;

    function handleMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!draggingRef.current) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        draggingRef.current = true;
        movedRef.current = true;
        onDragStart({
          task,
          pointer: { x: ev.clientX, y: ev.clientY },
          cardSize: { width: rect.width, height: rect.height },
          pointerOffset,
        });
      } else {
        onDrag(ev.clientX, ev.clientY);
      }
    }

    function handleUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      if (draggingRef.current) {
        onDragEnd(task, ev.clientX, ev.clientY);
        // suppress the click that would follow a drag
        const suppress = (clickEv: MouseEvent) => {
          clickEv.stopPropagation();
          clickEv.preventDefault();
          window.removeEventListener("click", suppress, true);
        };
        window.addEventListener("click", suppress, true);
        // safety: remove the suppressor after one tick if no click came
        setTimeout(() => window.removeEventListener("click", suppress, true), 0);
      }
      draggingRef.current = false;
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  function onClick() {
    if (movedRef.current) return; // suppress click after drag
    onSelect(task);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      layout
      layoutId={`kanban-${task.id}`}
      initial={{ opacity: 0, scale: 0.94, y: 6 }}
      animate={{
        opacity: isBeingDragged ? 0 : 1,
        scale: 1,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.92 }}
      whileHover={!isBeingDragged ? { y: -2 } : undefined}
      whileTap={!isBeingDragged ? { scale: 0.985 } : undefined}
      transition={{
        layout: { type: "spring", stiffness: 360, damping: 32, mass: 0.7 },
        default: { type: "spring", stiffness: 320, damping: 28 },
        opacity: { duration: 0.12 },
      }}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn(
        "group relative flex w-full select-none flex-col gap-2 rounded-[14px] border border-white/10 bg-[var(--surface-panel)] p-3 text-left touch-none",
        draggable && "cursor-grab active:cursor-grabbing",
        !isBeingDragged && "hover:border-white/20",
      )}
      style={isBeingDragged ? { pointerEvents: "none" } : undefined}
    >
      <KanbanCardBody task={task} />
    </motion.button>
  );
}

// ─── Card body (shared between inline card and portal ghost) ─────────────────

function KanbanCardBody({ task }: { task: Task }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <TaskStatusIcon status={task.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{task.action}</p>
          {task.description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
              {task.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ProjectTag project={task.project} />
        <PriorityTag priority={task.priority} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[10px] text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <TargetIcon className="size-3 shrink-0" />
          <span className="truncate">{task.target}</span>
        </span>
        {task.dueDate ? (
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
            <CalendarClock className="size-3" />
            {formatDateShort(task.dueDate)} · {formatTime(task.dueDate)}
          </span>
        ) : task.completedAt ? (
          <span className="shrink-0 tabular-nums">
            {formatDateShort(task.completedAt)}
          </span>
        ) : null}
      </div>

      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
        {task.user}
      </span>
    </>
  );
}

// ─── Drag ghost (portaled, follows mouse, clip-free) ─────────────────────────

function DragGhost({ drag }: { drag: DragState }) {
  const left = drag.pointer.x - drag.pointerOffset.x;
  const top = drag.pointer.y - drag.pointerOffset.y;
  return (
    <motion.div
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.04, rotate: 1.5 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{
        position: "fixed",
        left,
        top,
        width: drag.cardSize.width,
        zIndex: 9999,
        pointerEvents: "none",
      }}
      className="flex flex-col gap-2 rounded-[14px] border border-[var(--palette-blue)]/45 bg-[var(--surface-panel)] p-3 text-left shadow-[0_32px_80px_rgba(0,0,0,0.55),0_0_0_2px_rgba(55,119,255,0.4)]"
    >
      <KanbanCardBody task={drag.task} />
    </motion.div>
  );
}

// ─── Tags ────────────────────────────────────────────────────────────────────

function ProjectTag({ project }: { project?: string }) {
  if (!project) {
    return (
      <Badge
        variant="outline"
        className="border-white/10 bg-transparent px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70"
      >
        Aberta
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-transparent bg-[var(--palette-blue)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--palette-blue)]"
    >
      {project}
    </Badge>
  );
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    high: "bg-[var(--palette-pink)]/15 text-[var(--palette-pink)]",
    medium: "bg-[var(--palette-yellow)]/15 text-[var(--palette-yellow)]",
    low: "bg-white/5 text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        styles[priority],
      )}
    >
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}
