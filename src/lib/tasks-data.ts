export type TaskStatus = "success" | "warning" | "error" | "pending" | "in_progress";
export type TaskKind = "action" | "task";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSource = "manual" | "automation" | "import" | "api";

export type Task = {
  id: string;
  kind: TaskKind;
  timestamp: Date;         // when it happened / was created
  dueDate?: Date;          // for pending/in_progress
  completedAt?: Date;      // for completed actions
  user: string;
  action: string;          // short title
  description: string;     // longer context
  target: string;
  targetId: string;
  status: TaskStatus;
  priority: TaskPriority;
  durationMin?: number;
  source: TaskSource;
  project?: string;        // optional project label; undefined = open task
};

export const PROJECTS = [
  "Q2 Performance Push",
  "Bidu Onboarding",
  "Mogi Expansion",
  "Brand Awareness 2026",
  "Lead Quality Sprint",
  "Funil de SDR",
] as const;
export type ProjectName = (typeof PROJECTS)[number];

// Reference date so SSR/CSR match. Same as filter-controls.
const REFERENCE_DATE = new Date(2026, 4, 14); // 2026-05-14

const USERS = [
  "Vinicius Tavares",
  "Kyro Ferreira",
  "Ana Souza",
  "Marina Lopes",
  "Daniel Costa",
  "Bidu Bot",
  "Pedro Rocha",
  "Camila Andrade",
];

const ACTION_TEMPLATES: { action: string; description: string; status: TaskStatus }[] = [
  { action: "Orçamento ajustado", description: "Realocação manual do daily budget", status: "success" },
  { action: "Campanha pausada", description: "Pausa por CPA acima do teto definido", status: "warning" },
  { action: "Novo anúncio publicado", description: "Variante criativa subida na rede", status: "success" },
  { action: "Conjunto duplicado", description: "Duplicação para teste A/B", status: "success" },
  { action: "Bid cap atualizado", description: "Reajuste de teto de lance", status: "success" },
  { action: "Criativo aprovado", description: "Material aprovado pela revisão", status: "success" },
  { action: "Criativo rejeitado", description: "Material rejeitado pela política da plataforma", status: "error" },
  { action: "Audiência sincronizada", description: "Sync da lista de leads com Meta CAPI", status: "success" },
  { action: "Exportação concluída", description: "CSV gerado e enviado por email", status: "success" },
  { action: "Falha na importação", description: "Erro de schema no arquivo de origem", status: "error" },
  { action: "Conversão revisada", description: "Conversão API auditada e reativada", status: "warning" },
  { action: "Pixel reinstalado", description: "Pixel base reimplantado no site", status: "success" },
  { action: "Webhook reprocessado", description: "Replay de eventos em fila", status: "success" },
  { action: "Quota da API atingida", description: "Limite de requests ultrapassado no período", status: "error" },
];

const TASK_TEMPLATES: { action: string; description: string; priority: TaskPriority }[] = [
  { action: "Revisar criativos da campanha Mogi", description: "Auditar performance das variantes ativas", priority: "high" },
  { action: "Atualizar orçamento mensal", description: "Aplicar realocação aprovada na reunião", priority: "high" },
  { action: "Publicar anúncios de bateria", description: "Lançar conjunto novo de bateria lead_ad", priority: "medium" },
  { action: "Criar audiência lookalike", description: "Base: compradores últimos 30 dias", priority: "medium" },
  { action: "Conferir relatório semanal", description: "Validar números antes do envio para liderança", priority: "low" },
  { action: "Renovar integração CAPI", description: "Token expira em 5 dias", priority: "high" },
  { action: "Aprovar criativos pendentes", description: "Lista compartilhada via Drive", priority: "medium" },
  { action: "Mapear leads sem follow-up", description: "Cross com CRM para identificar gargalo", priority: "medium" },
];

const TARGETS = [
  { praca: "Mogi 2", platform: "Google", format: "pesquisa" },
  { praca: "Mogi 1", platform: "Meta", format: "lead_ad" },
  { praca: "Mogi 3", platform: "Google", format: "pmax" },
  { praca: "Indaiatuba", platform: "Google", format: "demand gen" },
  { praca: "Indaiatuba", platform: "Meta", format: "forms" },
  { praca: "São Carlos", platform: "Meta", format: "bateria lead_ad" },
  { praca: "Campinas", platform: "Meta", format: "lead_ad" },
  { praca: "Campinas", platform: "Google", format: "pesquisa" },
  { praca: "Curitiba — PR", platform: "Google", format: "pmax" },
  { praca: "São José dos Campos", platform: "Meta", format: "forms" },
  { praca: "Belo Horizonte — MG", platform: "Google", format: "demand gen" },
  { praca: "Goiânia", platform: "Meta", format: "lead_ad" },
  { praca: "Franca", platform: "Google", format: "pesquisa" },
];

const SOURCES: TaskSource[] = ["manual", "automation", "import", "api"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateTasks(seed = 7): Task[] {
  const rand = seeded(seed);
  const tasks: Task[] = [];

  // ── Past actions (last 60 days) ────────────────────────────────────────────
  for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
    const day = new Date(REFERENCE_DATE);
    day.setDate(day.getDate() - dayOffset);
    const entriesForDay = 18 + Math.floor(rand() * 28); // 18-45 per day
    for (let i = 0; i < entriesForDay; i++) {
      const tpl = ACTION_TEMPLATES[Math.floor(rand() * ACTION_TEMPLATES.length)]!;
      const user = USERS[Math.floor(rand() * USERS.length)]!;
      const target = TARGETS[Math.floor(rand() * TARGETS.length)]!;
      const hour = Math.floor(rand() * 12) + 8;
      const minute = Math.floor(rand() * 60);
      const ts = new Date(day);
      ts.setHours(hour, minute, Math.floor(rand() * 60));
      // status variation: ~75% follow template, 25% drift
      let status: TaskStatus = tpl.status;
      if (rand() < 0.2) {
        const drift = ["success", "warning", "error"] as const;
        status = drift[Math.floor(rand() * drift.length)]!;
      }
      const duration = Math.floor(rand() * 25) + 1;
      const priority = PRIORITIES[Math.floor(rand() * PRIORITIES.length)]!;
      const sourceIdx = Math.floor(rand() * SOURCES.length);
      const completedAt = new Date(ts);
      completedAt.setMinutes(completedAt.getMinutes() + duration);
      // 55% have a project assigned, 45% are open
      const project = rand() < 0.55 ? PROJECTS[Math.floor(rand() * PROJECTS.length)]! : undefined;
      tasks.push({
        id: `action-${dayOffset}-${i}`,
        kind: "action",
        timestamp: ts,
        completedAt,
        user,
        action: tpl.action,
        description: tpl.description,
        target: `${target.praca} · ${target.platform} · ${target.format}`,
        targetId: `${target.praca}/${target.platform}/${target.format}`,
        status,
        priority,
        durationMin: duration,
        source: SOURCES[sourceIdx]!,
        project,
      });
    }
  }

  // ── Pending / in-progress tasks (next 14 days + today) ─────────────────────
  const futureCount = 80;
  for (let i = 0; i < futureCount; i++) {
    const tpl = TASK_TEMPLATES[Math.floor(rand() * TASK_TEMPLATES.length)]!;
    const user = USERS[Math.floor(rand() * USERS.length)]!;
    const target = TARGETS[Math.floor(rand() * TARGETS.length)]!;
    // due in 0-14 days from reference
    const daysAhead = Math.floor(rand() * 15);
    const dueDate = new Date(REFERENCE_DATE);
    dueDate.setDate(dueDate.getDate() + daysAhead);
    const dueHour = Math.floor(rand() * 10) + 9;
    dueDate.setHours(dueHour, 0, 0);
    // created sometime in the last 7 days
    const created = new Date(REFERENCE_DATE);
    created.setDate(created.getDate() - Math.floor(rand() * 7));
    created.setHours(Math.floor(rand() * 12) + 8, Math.floor(rand() * 60));
    const status: TaskStatus = rand() < 0.45 ? "in_progress" : "pending";
    // Tasks são mais propensas a ter projeto (70%)
    const project = rand() < 0.7 ? PROJECTS[Math.floor(rand() * PROJECTS.length)]! : undefined;
    tasks.push({
      id: `task-${i}`,
      kind: "task",
      timestamp: created,
      dueDate,
      user,
      action: tpl.action,
      description: tpl.description,
      target: `${target.praca} · ${target.platform} · ${target.format}`,
      targetId: `${target.praca}/${target.platform}/${target.format}`,
      status,
      priority: tpl.priority,
      source: "manual",
      project,
    });
  }

  return tasks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<TaskStatus, string> = {
  success: "Concluído",
  warning: "Atenção",
  error: "Falha",
  pending: "Pendente",
  in_progress: "Em andamento",
};

export const KIND_LABEL: Record<TaskKind, string> = {
  action: "Ação",
  task: "Tarefa",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const SOURCE_LABEL: Record<TaskSource, string> = {
  manual: "Manual",
  automation: "Automação",
  import: "Importação",
  api: "API",
};

export const ALL_STATUSES: TaskStatus[] = ["success", "warning", "error", "pending", "in_progress"];
export const ALL_KINDS: TaskKind[] = ["action", "task"];
export const ALL_PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
export const ALL_SOURCES: TaskSource[] = ["manual", "automation", "import", "api"];

export function getAllUsers(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.user))).sort();
}

// ─── Formatting ──────────────────────────────────────────────────────────────

const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatDateShort(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTH_SHORT[date.getMonth()]}`;
}

export function formatDateLong(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ─── CSV export ──────────────────────────────────────────────────────────────

export function tasksToCsv(tasks: Task[]): string {
  const header = [
    "id",
    "tipo",
    "status",
    "prioridade",
    "projeto",
    "titulo",
    "descricao",
    "alvo",
    "usuario",
    "fonte",
    "criado_em",
    "vencimento",
    "concluido_em",
    "duracao_min",
  ];
  const rows = tasks.map((t) => [
    t.id,
    KIND_LABEL[t.kind],
    STATUS_LABEL[t.status],
    PRIORITY_LABEL[t.priority],
    csvEscape(t.project ?? ""),
    csvEscape(t.action),
    csvEscape(t.description),
    csvEscape(t.target),
    csvEscape(t.user),
    SOURCE_LABEL[t.source],
    t.timestamp.toISOString(),
    t.dueDate ? t.dueDate.toISOString() : "",
    t.completedAt ? t.completedAt.toISOString() : "",
    t.durationMin?.toString() ?? "",
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
