"use client";

import * as React from "react";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";

// ─── Layout primitives ───────────────────────────────────────────────────────

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      {children}
    </div>
  );
}

export function FilterDivider() {
  return null;
}

// ─── Checkbox dropdown ───────────────────────────────────────────────────────

type CheckboxDropdownProps<T extends string> = {
  label: string;
  options: readonly T[];
  values: T[];
  onChange: (values: T[]) => void;
};

export function FilterCheckboxDropdown<T extends string>({
  label,
  options,
  values,
  onChange,
}: CheckboxDropdownProps<T>) {
  const allSelected = values.length === options.length;
  const noneSelected = values.length === 0;
  const buttonLabel = allSelected
    ? `Todos (${options.length})`
    : noneSelected
      ? "Nenhum"
      : values.length === 1
        ? values[0]
        : `${values.length} selecionados`;

  function toggleOption(option: T, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...values, option])));
    } else {
      onChange(values.filter((value) => value !== option));
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...options]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 min-w-[180px] items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-foreground transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </span>
            <span className="truncate font-medium">{buttonLabel}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[240px] border-white/10 bg-[var(--surface-panel)] text-foreground shadow-lg"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={allSelected}
          className="focus:bg-white/10 data-[state=checked]:text-white"
          onCheckedChange={toggleAll}
          onSelect={(event) => event.preventDefault()}
        >
          <span className="font-semibold">Selecionar todos</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator className="bg-white/10" />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={values.includes(option)}
            className="focus:bg-white/10 data-[state=checked]:text-white"
            onCheckedChange={(checked) => toggleOption(option, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Date range filter ───────────────────────────────────────────────────────

export type DateRange = { start: Date; end: Date };

const STANDARD_PRESETS = [
  { id: "30d", label: "Últimos 30 dias", days: 30 },
  { id: "14d", label: "Últimos 14 dias", days: 14 },
  { id: "7d", label: "Últimos 7 dias", days: 7 },
] as const;

type StandardPresetId = (typeof STANDARD_PRESETS)[number]["id"];
export type DatePresetId = StandardPresetId | "custom";
export type DateFilterValue = { preset: DatePresetId; range: DateRange };

// Fixed reference so SSR + client render match. Update when the mock period rolls.
export const REFERENCE_DATE = new Date(2026, 4, 14); // 2026-05-14

export function rangeFromPreset(
  presetId: StandardPresetId,
  reference: Date = REFERENCE_DATE,
): DateRange {
  const preset = STANDARD_PRESETS.find((p) => p.id === presetId) ?? STANDARD_PRESETS[0];
  const end = stripTime(reference);
  const start = stripTime(new Date(end));
  start.setDate(start.getDate() - (preset.days - 1));
  return { start, end };
}

export function defaultDateValue(presetId: StandardPresetId = "30d"): DateFilterValue {
  return { preset: presetId, range: rangeFromPreset(presetId) };
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTH_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function formatShort(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTH_SHORT[date.getMonth()]}`;
}

function formatFull(date: Date): string {
  return `${formatShort(date)} ${date.getFullYear()}`;
}

export function formatDateRange(range: DateRange): string {
  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  const startStr = sameYear ? formatShort(range.start) : formatFull(range.start);
  return `${startStr} — ${formatFull(range.end)}`;
}

type DateFilterProps = {
  label?: string;
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
};

export function DateRangePresetFilter({ label = "Período", value, onChange }: DateFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"presets" | "custom">("presets");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMode("presets");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pickPreset(presetId: StandardPresetId) {
    onChange({ preset: presetId, range: rangeFromPreset(presetId) });
    setOpen(false);
    setMode("presets");
  }

  function applyCustom(range: DateRange) {
    onChange({ preset: "custom", range });
    setOpen(false);
    setMode("presets");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-foreground transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <Calendar className="size-4 text-muted-foreground" />
        <span className="font-medium tabular-nums">{formatDateRange(value.range)}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 z-30 mt-2 w-[320px] origin-top-left rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-3 shadow-xl"
          >
            {mode === "presets" ? (
              <PresetList
                value={value}
                onPickPreset={pickPreset}
                onCustom={() => setMode("custom")}
              />
            ) : (
              <RangeCalendar
                initial={value.range}
                onApply={applyCustom}
                onBack={() => setMode("presets")}
              />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PresetList({
  value,
  onPickPreset,
  onCustom,
}: {
  value: DateFilterValue;
  onPickPreset: (presetId: StandardPresetId) => void;
  onCustom: () => void;
}) {
  return (
    <div>
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Período predefinido
      </p>
      <div className="flex flex-col">
        {STANDARD_PRESETS.map((preset) => {
          const active = preset.id === value.preset;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPickPreset(preset.id)}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-2 text-sm transition hover:bg-white/10",
                active && "text-white",
              )}
            >
              <span>{preset.label}</span>
              {active ? <Check className="size-4 text-[var(--palette-orange)]" /> : null}
            </button>
          );
        })}
      </div>
      <div className="my-2 h-px bg-white/10" />
      <button
        type="button"
        onClick={onCustom}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2 py-2 text-sm transition hover:bg-white/10",
          value.preset === "custom" && "text-white",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          Personalizado…
        </span>
        {value.preset === "custom" ? (
          <Check className="size-4 text-[var(--palette-orange)]" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// ─── Range calendar ──────────────────────────────────────────────────────────

function RangeCalendar({
  initial,
  onApply,
  onBack,
}: {
  initial: DateRange;
  onApply: (range: DateRange) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = React.useState<DateRange>(initial);
  const [pickingEnd, setPickingEnd] = React.useState(false);
  const [view, setView] = React.useState<{ month: number; year: number }>(() => ({
    month: initial.start.getMonth(),
    year: initial.start.getFullYear(),
  }));

  function shiftMonth(direction: -1 | 1) {
    setView((curr) => {
      const next = curr.month + direction;
      if (next < 0) return { month: 11, year: curr.year - 1 };
      if (next > 11) return { month: 0, year: curr.year + 1 };
      return { ...curr, month: next };
    });
  }

  function pickDay(day: number) {
    const picked = new Date(view.year, view.month, day);
    if (!pickingEnd) {
      setDraft({ start: picked, end: picked });
      setPickingEnd(true);
      return;
    }
    if (picked.getTime() < draft.start.getTime()) {
      setDraft({ start: picked, end: draft.start });
    } else {
      setDraft({ start: draft.start, end: picked });
    }
    setPickingEnd(false);
  }

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold">Selecionar período</p>
        <span className="size-7" />
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg bg-white/5 p-1">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium">
          {MONTH_LONG[view.month]} {view.year}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={`${label}-${i}`}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) {
            return <span key={`empty-${i}`} className="size-9" />;
          }
          const cellDate = new Date(view.year, view.month, day);
          const t = cellDate.getTime();
          const isStart = t === draft.start.getTime();
          const isEnd = t === draft.end.getTime();
          const inRange = t >= draft.start.getTime() && t <= draft.end.getTime();
          return (
            <button
              key={day}
              type="button"
              onClick={() => pickDay(day)}
              className={cn(
                "grid size-9 place-items-center rounded-md text-sm font-medium text-muted-foreground transition",
                "hover:bg-white/10 hover:text-foreground",
                inRange && "bg-[var(--palette-orange)]/15 text-foreground",
                (isStart || isEnd) &&
                  "bg-[var(--palette-orange)] text-white hover:bg-[var(--palette-orange)] hover:text-white",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatDateRange(draft)}
        </p>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="rounded-full bg-[var(--palette-orange)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Aplicar
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {pickingEnd ? "Selecione a data final" : "Selecione a data inicial"}
      </p>
    </div>
  );
}
