"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ListChecks,
  Plus,
  Search,
  Target as TargetIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DashboardsShell, RichPanel } from "@/components/dashboards-shell";
import {
  DateRangePresetFilter,
  defaultDateValue,
  FilterBar,
  FilterCheckboxDropdown,
  type DateFilterValue,
} from "@/components/filter-controls";
import {
  ALL_KINDS,
  ALL_PRIORITIES,
  ALL_STATUSES,
  formatDateLong,
  formatDateShort,
  formatDayKey,
  formatTime,
  generateTasks,
  getAllUsers,
  KIND_LABEL,
  PRIORITY_LABEL,
  PROJECTS,
  STATUS_LABEL,
  tasksToCsv,
  type Task,
  type TaskKind,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks-data";
import { TaskDetailModal, TaskStatusIcon } from "@/components/task-detail-modal";
import { TaskEditorModal } from "@/components/task-editor-modal";
import { TasksKanban } from "@/components/tasks-kanban";

const PAGE_SIZE = 50;
const OPEN_PROJECT_LABEL = "Aberta";
const PROJECT_OPTIONS = [OPEN_PROJECT_LABEL, ...PROJECTS] as const;
type ProjectFilterValue = (typeof PROJECT_OPTIONS)[number];

type SortKey = "timestamp" | "status" | "action" | "target" | "user" | "priority";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "kanban";

export function TasksDashboard() {
  const [allTasks, setAllTasks] = React.useState<Task[]>(() => generateTasks(7));
  const users = React.useMemo(() => getAllUsers(allTasks), [allTasks]);
  const [editorMode, setEditorMode] = React.useState<"create" | "edit" | null>(null);
  const [editorTask, setEditorTask] = React.useState<Task | null>(null);

  const [dateValue, setDateValue] = React.useState<DateFilterValue>(() => defaultDateValue());
  const [selectedStatuses, setSelectedStatuses] = React.useState<TaskStatus[]>([...ALL_STATUSES]);
  const [selectedKinds, setSelectedKinds] = React.useState<TaskKind[]>([...ALL_KINDS]);
  const [selectedPriorities, setSelectedPriorities] = React.useState<TaskPriority[]>([...ALL_PRIORITIES]);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>(users);
  const [selectedProjects, setSelectedProjects] = React.useState<ProjectFilterValue[]>([
    ...PROJECT_OPTIONS,
  ]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(0);
  const [detailTask, setDetailTask] = React.useState<Task | null>(null);

  // ── Filter pipeline ────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    const startMs = dateValue.range.start.getTime();
    const endMs = dateValue.range.end.getTime() + 24 * 60 * 60 * 1000 - 1;
    const lowerSearch = search.trim().toLowerCase();
    return allTasks.filter((t) => {
      const refMs = t.timestamp.getTime();
      if (refMs < startMs || refMs > endMs) return false;
      if (!selectedStatuses.includes(t.status)) return false;
      if (!selectedKinds.includes(t.kind)) return false;
      if (!selectedPriorities.includes(t.priority)) return false;
      if (!selectedUsers.includes(t.user)) return false;
      const projectLabel = (t.project ?? OPEN_PROJECT_LABEL) as ProjectFilterValue;
      if (!selectedProjects.includes(projectLabel)) return false;
      if (lowerSearch) {
        const haystack = `${t.action} ${t.description} ${t.target} ${t.user} ${t.project ?? ""}`.toLowerCase();
        if (!haystack.includes(lowerSearch)) return false;
      }
      return true;
    });
  }, [allTasks, dateValue, selectedStatuses, selectedKinds, selectedPriorities, selectedUsers, selectedProjects, search]);

  const sorted = React.useMemo(() => {
    const sortedList = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    sortedList.sort((a, b) => {
      const aV = sortValue(a, sortKey);
      const bV = sortValue(b, sortKey);
      if (aV < bV) return -1 * dir;
      if (aV > bV) return 1 * dir;
      return 0;
    });
    return sortedList;
  }, [filtered, sortKey, sortDir]);

  // Reset page when filters/sort change
  React.useEffect(() => {
    setPage(0);
  }, [filtered.length, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = React.useMemo(() => {
    const total = filtered.length;
    const actions = filtered.filter((t) => t.kind === "action").length;
    const pending = filtered.filter((t) => t.status === "pending").length;
    const inProgress = filtered.filter((t) => t.status === "in_progress").length;
    const errors = filtered.filter((t) => t.status === "error").length;
    const successes = filtered.filter((t) => t.status === "success").length;
    const successRate = actions === 0 ? 0 : Math.round((successes / actions) * 100);
    return { total, actions, pending, inProgress, errors, successRate };
  }, [filtered]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function openCreate() {
    setEditorTask(null);
    setEditorMode("create");
  }

  function openEdit(task: Task) {
    setDetailTask(null);
    setEditorTask(task);
    setEditorMode("edit");
  }

  function closeEditor() {
    setEditorMode(null);
    setEditorTask(null);
  }

  function saveTask(saved: Task) {
    setAllTasks((current) => {
      const existing = current.findIndex((t) => t.id === saved.id);
      if (existing >= 0) {
        const next = [...current];
        next[existing] = saved;
        return next;
      }
      return [saved, ...current];
    });
    closeEditor();
  }

  function markComplete(task: Task) {
    const now = new Date();
    setAllTasks((current) =>
      current.map((t) =>
        t.id === task.id
          ? { ...t, status: "success", completedAt: now }
          : t,
      ),
    );
    setDetailTask(null);
  }

  function moveTask(taskId: string, newStatus: "pending" | "in_progress" | "success") {
    setAllTasks((current) =>
      current.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === "success" ? new Date() : undefined,
        };
      }),
    );
  }

  function exportCsv() {
    const csv = tasksToCsv(sorted);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Group page items by day for visual separators
  const groupedRows: Array<{ type: "day"; key: string; label: string } | { type: "row"; task: Task }> = [];
  let currentDayKey = "";
  for (const task of pageItems) {
    const key = formatDayKey(task.timestamp);
    if (key !== currentDayKey) {
      groupedRows.push({ type: "day", key, label: formatDateLong(task.timestamp) });
      currentDayKey = key;
    }
    groupedRows.push({ type: "row", task });
  }

  return (
    <DashboardsShell active="tasks">
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--palette-orange)]">
              Atividade · histórico e pendências
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              Tasks · ações e tarefas ao longo do tempo
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Lista única com ações já realizadas e tarefas pendentes/em andamento · clique numa
              linha pra ver detalhes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-medium transition hover:bg-white/10"
            >
              <Download className="size-4" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--palette-blue)] px-3.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="size-4" />
              Nova tarefa
            </button>
          </div>
        </header>

        <KpiStrip kpis={kpis} />

        <FilterBar>
          <div className="relative flex h-9 flex-1 items-center md:max-w-[280px]">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar título, alvo, usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full rounded-full border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--palette-blue)]/50 focus:bg-white/[0.07]"
            />
          </div>
          <DateRangePresetFilter value={dateValue} onChange={setDateValue} />
          <FilterCheckboxDropdown<TaskKind>
            label="Tipo"
            options={ALL_KINDS}
            values={selectedKinds}
            onChange={setSelectedKinds}
          />
          <FilterCheckboxDropdown<TaskStatus>
            label="Status"
            options={ALL_STATUSES}
            values={selectedStatuses}
            onChange={setSelectedStatuses}
          />
          <FilterCheckboxDropdown<TaskPriority>
            label="Prioridade"
            options={ALL_PRIORITIES}
            values={selectedPriorities}
            onChange={setSelectedPriorities}
          />
          <FilterCheckboxDropdown<string>
            label="Usuário"
            options={users}
            values={selectedUsers}
            onChange={setSelectedUsers}
          />
          <FilterCheckboxDropdown<ProjectFilterValue>
            label="Projeto"
            options={PROJECT_OPTIONS}
            values={selectedProjects}
            onChange={setSelectedProjects}
          />
        </FilterBar>

        <ViewTabs
          view={view}
          onChange={setView}
          counts={{
            list: filtered.length,
            kanban:
              filtered.filter(
                (t) => t.status === "pending" || t.status === "in_progress" || t.status === "success",
              ).length,
          }}
        />

        {view === "kanban" ? (
          <TasksKanban tasks={filtered} onSelect={setDetailTask} onMoveTask={moveTask} />
        ) : (
        <RichPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-[var(--surface-panel)]/95 backdrop-blur-sm">
                <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">Status</th>
                  <SortableHeader
                    label="Ação"
                    sortKey="action"
                    current={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortableHeader
                    label="Alvo"
                    sortKey="target"
                    current={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortableHeader
                    label="Usuário"
                    sortKey="user"
                    current={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">Projeto</th>
                  <SortableHeader
                    label="Data / hora"
                    sortKey="timestamp"
                    current={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortableHeader
                    label="Prioridade"
                    sortKey="priority"
                    current={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {groupedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      Nenhum resultado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  groupedRows.map((entry) =>
                    entry.type === "day" ? (
                      <tr key={`day-${entry.key}`} className="bg-white/[0.02]">
                        <td
                          colSpan={7}
                          className="border-b border-t border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                        >
                          {entry.label}
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={entry.task.id}
                        onClick={() => setDetailTask(entry.task)}
                        className="cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TaskStatusIcon status={entry.task.status} />
                            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                              {KIND_LABEL[entry.task.kind]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{entry.task.action}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {entry.task.description}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TargetIcon className="size-3" />
                            {entry.task.target}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {entry.task.user}
                        </td>
                        <td className="px-4 py-3">
                          <ProjectBadge project={entry.task.project} />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                          {formatDateShort(entry.task.timestamp)} · {formatTime(entry.task.timestamp)}
                          {entry.task.dueDate ? (
                            <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--palette-orange)]/80">
                              vence {formatDateShort(entry.task.dueDate)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={entry.task.priority} />
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={sorted.length}
            onChange={setPage}
          />
        </RichPanel>
        )}
      </section>

      <TaskDetailModal
        open={detailTask !== null}
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={openEdit}
        onMarkComplete={markComplete}
      />

      <TaskEditorModal
        open={editorMode !== null}
        mode={editorMode ?? "create"}
        task={editorTask}
        users={users}
        onSave={saveTask}
        onClose={closeEditor}
      />
    </DashboardsShell>
  );
}

// ─── KPI Strip ───────────────────────────────────────────────────────────────

function KpiStrip({
  kpis,
}: {
  kpis: { total: number; actions: number; pending: number; inProgress: number; errors: number; successRate: number };
}) {
  const items = [
    { label: "Total no período", value: kpis.total.toLocaleString("pt-BR"), icon: ListChecks, tone: "blue" as const },
    { label: "Ações executadas", value: kpis.actions.toLocaleString("pt-BR"), tone: "blue" as const },
    { label: "Em andamento", value: kpis.inProgress.toLocaleString("pt-BR"), tone: "yellow" as const },
    { label: "Pendentes", value: kpis.pending.toLocaleString("pt-BR"), tone: "orange" as const },
    { label: "Falhas", value: kpis.errors.toLocaleString("pt-BR"), tone: "pink" as const },
    { label: "Taxa de sucesso", value: `${kpis.successRate}%`, tone: "yellow" as const, featured: true },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
          }}
          className={cn(
            "rounded-[18px] border border-white/10 bg-[var(--surface-panel)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]",
            item.featured && "ring-1 ring-[var(--palette-orange)]/40",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
              item.tone === "yellow" && "text-[var(--palette-yellow)]",
              item.tone === "orange" && "text-[var(--palette-orange)]",
              item.tone === "pink" && "text-[var(--palette-pink)]",
            )}
          >
            {item.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Sortable header ─────────────────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="border-b border-white/10 px-4 py-3 font-semibold">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 transition hover:text-foreground",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function sortValue(task: Task, key: SortKey): string | number {
  switch (key) {
    case "timestamp":
      return task.timestamp.getTime();
    case "status":
      return task.status;
    case "action":
      return task.action.toLowerCase();
    case "target":
      return task.target.toLowerCase();
    case "user":
      return task.user.toLowerCase();
    case "priority": {
      const order: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      return order[task.priority];
    }
  }
}

// ─── Priority badge ──────────────────────────────────────────────────────────

function ProjectBadge({ project }: { project?: string }) {
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

function ViewTabs({
  view,
  onChange,
  counts,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  counts: { list: number; kanban: number };
}) {
  const tabs: { id: ViewMode; label: string; count: number }[] = [
    { id: "list", label: "Lista", count: counts.list },
    { id: "kanban", label: "Kanban", count: counts.kanban },
  ];
  return (
    <div className="inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-[var(--surface-panel)]/70 p-1">
      {tabs.map((tab) => {
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                active ? "bg-background/10 text-background" : "bg-white/10 text-muted-foreground",
              )}
            >
              {tab.count.toLocaleString("pt-BR")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
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

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  totalItems,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, totalItems);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {start.toLocaleString("pt-BR")}–{end.toLocaleString("pt-BR")} de{" "}
        {totalItems.toLocaleString("pt-BR")}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" />
          Anterior
        </button>
        <span className="px-2 tabular-nums">
          {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
        >
          Próxima
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Label resolvers for filter dropdowns (display labels) ───────────────────

// The FilterCheckboxDropdown currently shows raw option strings. Status/kind/priority
// are stored as keys ("success", "action", "high"), which is OK for filter UI since
// the user can identify them. For better UX in the future, we can extend the dropdown
// to accept a label map. For now, we'll just rely on the keys being intelligible.

void STATUS_LABEL; // keep available for future label rendering
