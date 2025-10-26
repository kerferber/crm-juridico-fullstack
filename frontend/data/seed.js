import {
  TaskStatus,
  KanbanColumn,
  KanbanPhase,
  TransactionType
} from "../types/types";
import { Award, Star, Target, Scale, Shield, Landmark, Check, TrendingUp, Flag, Users } from "lucide-react";
import dayjs from "dayjs";
const USERS = [
  {
    id: 1,
    name: "Carlos Ferreira",
    email: "carlos.ferreira@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    jobTitle: "Diretor Comercial",
    phone: "(11) 97777-1234",
    personalEmail: "c.ferreira@gmail.com",
    address: "Rua das Ac\xE1cias, 250",
    city: "S\xE3o Paulo",
    state: "SP",
    birthdate: "1986-03-22",
    linkedinUrl: "https://linkedin.com/in/carlosferreira",
    bio: "Especialista em expans\xE3o comercial e relacionamento com grandes clientes."
  },
  {
    id: 2,
    name: "Sofia Ribeiro",
    email: "sofia.ribeiro@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d",
    jobTitle: "Coordenadora de Opera\xE7\xF5es",
    phone: "(21) 98888-6543",
    personalEmail: "sofia.ribeiro@gmail.com",
    city: "Rio de Janeiro",
    state: "RJ",
    birthdate: "1992-07-15",
    bio: "Respons\xE1vel pelo acompanhamento de performance e qualidade do atendimento."
  },
  {
    id: 3,
    name: "Miguel Almeida",
    email: "miguel.almeida@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026706d",
    jobTitle: "Advogado S\xEAnior",
    phone: "(31) 96666-4321",
    personalEmail: "miguel.almeida@gmail.com",
    address: "Av. Amazonas, 900",
    city: "Belo Horizonte",
    state: "MG",
    birthdate: "1984-11-02",
    bio: "Atua\xE7\xE3o focada em direito trabalhista e previdenci\xE1rio."
  }
];
const CONTACTS = [
  {
    id: 1,
    name: "Empresa Alpha Ltda",
    document: "12345678000190",
    origin: "Indica\xE7\xE3o",
    status: "Cliente",
    ownerId: 1,
    lastInteraction: "2025-10-10",
    email: "contato@alpha.com",
    phone: "(11) 98765-4321",
    profession: "Ind\xFAstria",
    categoryId: "contacts-cliente",
    leadCategoryId: "leads-clientes-ativos",
    notes: "Clientes estrat\xE9gicos \u2013 alinhar propostas com @Sofia Ribeiro.",
    mentions: [
      { id: 2, kind: "user", label: "Sofia Ribeiro" }
    ]
  },
  {
    id: 2,
    name: "Beatriz Costa",
    document: "12345678901",
    origin: "Website",
    status: "Lead",
    ownerId: 2,
    lastInteraction: "2025-10-12",
    email: "beatriz.costa@example.com",
    phone: "(21) 91234-5678",
    profession: "Designer",
    categoryId: "contacts-prospect",
    leadCategoryId: "leads-quentes",
    notes: "Enviar briefing inicial e marcar reuni\xE3o com @Carlos Ferreira.",
    mentions: [
      { id: 1, kind: "user", label: "Carlos Ferreira" }
    ]
  },
  {
    id: 3,
    name: "Ricardo Neves",
    document: "98765432109",
    origin: "Feira de Neg\xF3cios",
    status: "Cliente",
    ownerId: 1,
    lastInteraction: "2025-09-28",
    email: "ricardo.neves@example.com",
    phone: "(31) 95555-4444",
    profession: "Engenheiro",
    categoryId: "contacts-cliente",
    leadCategoryId: "leads-clientes-ativos"
  }
];
const LAWSUITS = [
  {
    id: 1,
    internalNumber: "2025/001-CIV",
    clientId: 1,
    responsibleId: 1,
    area: "C\xEDvel",
    phase: "Inicial",
    deadline: "2025-11-20",
    status: "Ativo",
    notes: "Validar estrat\xE9gia com @Sofia Ribeiro antes de protocolar.",
    mentions: [{ id: 2, kind: "user", label: "Sofia Ribeiro" }]
  },
  {
    id: 2,
    internalNumber: "2025/002-TRAB",
    clientId: 2,
    responsibleId: 2,
    area: "Trabalhista",
    phase: "Recursal",
    deadline: "2025-10-30",
    status: "Ativo"
  },
  {
    id: 3,
    internalNumber: "2024/058-PREV",
    clientId: 3,
    responsibleId: 1,
    area: "Previdenci\xE1rio",
    phase: "Execu\xE7\xE3o",
    deadline: "2025-01-15",
    status: "Fechado"
  }
];
const TASKS = [
  {
    id: 1,
    title: "Elaborar peti\xE7\xE3o inicial para 2025/001-CIV",
    status: TaskStatus.Pendente,
    dueDate: "2025-10-18",
    deadline: "2025-10-25",
    responsibleId: 1,
    lawsuitId: 1,
    score: 50,
    categoryId: "tasks-processuais",
    notes: "Preparar rascunho em conjunto com @Miguel Almeida e alinhar com #Empresa Alpha Ltda.",
    mentions: [
      { id: 3, kind: "user", label: "Miguel Almeida" },
      { id: 1, kind: "contact", label: "Empresa Alpha Ltda" }
    ]
  },
  {
    id: 2,
    title: "Analisar documentos do caso Beatriz Costa",
    status: TaskStatus.Concluida,
    dueDate: "2025-10-10",
    deadline: "2025-10-12",
    responsibleId: 2,
    lawsuitId: 2,
    clientId: 2,
    score: 30,
    categoryId: "tasks-processuais",
    notes: "Documentos revisados com apoio da equipe fiscal."
  },
  {
    id: 3,
    title: "Agendar reuni\xE3o com Empresa Alpha",
    status: TaskStatus.Pendente,
    dueDate: "2025-10-15",
    deadline: "2025-10-16",
    responsibleId: 1,
    clientId: 1,
    score: 10,
    categoryId: "tasks-reunioes"
  },
  {
    id: 4,
    title: "Preparar recurso de apela\xE7\xE3o para 2025/002-TRAB",
    status: TaskStatus.Atrasada,
    dueDate: "2025-10-13",
    deadline: "2025-10-12",
    responsibleId: 2,
    lawsuitId: 2,
    score: 60,
    categoryId: "tasks-alta-prioridade"
  },
  {
    id: 5,
    title: "Calcular liquida\xE7\xE3o de senten\xE7a 2024/058-PREV",
    status: TaskStatus.Concluida,
    dueDate: "2025-09-20",
    deadline: "2025-09-25",
    responsibleId: 1,
    lawsuitId: 3,
    score: 40,
    categoryId: "tasks-financeiro"
  }
];
const KANBAN_CARDS = [
  { id: "card-1", title: "Processo #1 - Empresa Alpha", column: KanbanColumn.ElaboracaoPeticao, phase: KanbanPhase.Judicial, area: "C\xEDvel", responsibleId: 1, hasAttachments: true, commentsCount: 2, hasReminder: true, isDelayed: false },
  { id: "card-2", title: "Caso Beatriz Costa", column: KanbanColumn.AnaliseDocumentos, phase: KanbanPhase.Judicial, area: "Trabalhista", responsibleId: 2, hasAttachments: true, commentsCount: 0, hasReminder: false, isDelayed: true },
  { id: "card-3", title: "Acordo Extrajudicial - XYZ Corp", column: KanbanColumn.Prospeccao, phase: KanbanPhase.Extrajudicial, area: "N\xE3o definido", responsibleId: 3, hasAttachments: false, commentsCount: 0, hasReminder: false, isDelayed: false },
  { id: "card-4", title: "Processo #3 - Ricardo Neves", column: KanbanColumn.Finalizados, phase: KanbanPhase.Judicial, area: "Previdenci\xE1rio", responsibleId: 1, hasAttachments: true, commentsCount: 5, hasReminder: false, isDelayed: false }
];
const CALENDAR_EVENTS = [
  { id: 1, title: "Audi\xEAncia - Proc. 2025/002-TRAB", start: "2025-10-14T10:00:00", end: "2025-10-14T11:00:00", color: "#10B981" },
  { id: 2, title: "Reuni\xE3o com Empresa Alpha", start: "2025-10-16T15:00:00", end: "2025-10-16T16:00:00", color: "#3B82F6" },
  { id: 3, title: "Prazo: Peti\xE7\xE3o Inicial 2025/001-CIV", start: "2025-10-25", end: "2025-10-25", color: "#EF4444" }
];
const TRANSACTIONS = [
  { id: 1, date: "2025-10-01", description: "Honor\xE1rios - Empresa Alpha", category: "Honor\xE1rios", account: "Conta Principal", value: 5e3, type: TransactionType.Receita, categoryId: "financial-honorarios" },
  { id: 2, date: "2025-10-05", description: "Aluguel do escrit\xF3rio", category: "Despesas Fixas", account: "Conta Principal", value: 2500, type: TransactionType.Despesa, categoryId: "financial-despesas-fixas" },
  { id: 3, date: "2025-10-10", description: "Pagamento de custas - Proc. 2025/002-TRAB", category: "Custas Processuais", account: "Conta Principal", value: 350, type: TransactionType.Despesa, categoryId: "financial-custas-processuais" },
  { id: 4, date: "2025-09-05", description: "Adiantamento - Ricardo Neves", category: "Honor\xE1rios", account: "Conta Principal", value: 2e3, type: TransactionType.Receita, categoryId: "financial-honorarios" },
  { id: 5, date: "2025-11-02", description: "Honor\xE1rios - Acordo trabalhista", category: "Honor\xE1rios", account: "Conta Principal", value: 4800, type: TransactionType.Receita, categoryId: "financial-honorarios" },
  { id: 6, date: "2025-12-10", description: "Consultoria preventiva - Cliente Premium", category: "Honor\xE1rios", account: "Conta Principal", value: 6200, type: TransactionType.Receita, categoryId: "financial-honorarios" },
  { id: 7, date: "2025-09-20", description: "Pacote de due diligence - Nova conta", category: "Honor\xE1rios", account: "Conta Principal", value: 3e3, type: TransactionType.Receita, categoryId: "financial-honorarios" }
];
const LEVELS = [
  { level: 1, name: "Estagi\xE1rio", pointsRequired: 0 },
  { level: 2, name: "Advogado J\xFAnior", pointsRequired: 100 },
  { level: 3, name: "Advogado Pleno", pointsRequired: 500 },
  { level: 4, name: "Advogado S\xEAnior", pointsRequired: 1500 },
  { level: 5, name: "S\xF3cio", pointsRequired: 5e3 }
];
const BADGES = [
  { id: "score-1", name: "Pontuador Iniciante", description: "Acumule 100 pontos", icon: Star, type: "score", threshold: 100 },
  { id: "score-2", name: "Mestre dos Pontos", description: "Acumule 1000 pontos", icon: Award, type: "score", threshold: 1e3 },
  { id: "tasks-1", name: "Finalizador", description: "Conclua 10 tarefas", icon: Check, type: "tasks", threshold: 10 },
  { id: "tasks-2", name: "Super Produtivo", description: "Conclua 50 tarefas", icon: Target, type: "tasks", threshold: 50 },
  { id: "area-1", name: "Especialista C\xEDvel", description: "Conclua 5 tarefas da \xE1rea C\xEDvel", icon: Scale, type: "area", threshold: 5, area: "C\xEDvel" },
  { id: "area-2", name: "Defensor Trabalhista", description: "Conclua 5 tarefas da \xE1rea Trabalhista", icon: Shield, type: "area", threshold: 5, area: "Trabalhista" },
  { id: "area-3", name: "Mestre Previdenci\xE1rio", description: "Conclua 5 tarefas da \xE1rea Previdenci\xE1rio", icon: Landmark, type: "area", threshold: 5, area: "Previdenci\xE1rio" }
];
const GOAL_PROGRAMS = [
  {
    id: "program-finance-2025",
    name: "Metas Financeiras 2025",
    description: "Planejamento anual de receita, margem e adimpl\xEAncia para o escrit\xF3rio.",
    type: "Financeiro",
    icon: TrendingUp,
    color: "#0EA5E9",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    visibility: "global",
    tags: ["financeiro", "estrat\xE9gico"]
  },
  {
    id: "program-litigation-q1",
    name: "Metas Contencioso Q1",
    description: "Resultados operacionais do contencioso para o primeiro trimestre.",
    type: "Produ\xE7\xE3o",
    icon: Flag,
    color: "#F97316",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    visibility: "team",
    ownerTeamId: "contencioso",
    tags: ["operacional", "q1"]
  },
  {
    id: "program-relacionamento",
    name: "Relacionamento & CRM",
    description: "Expans\xE3o de carteira e satisfa\xE7\xE3o de clientes estrat\xE9gicos.",
    type: "Relacionamento",
    icon: Users,
    color: "#8B5CF6",
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    visibility: "team",
    ownerTeamId: "comercial",
    tags: ["crm", "clientes"]
  }
];
const GOALS = [
  {
    id: "goal-revenue-q4",
    programId: "program-finance-2025",
    title: "Faturar R$ 25 mil em honor\xE1rios no Q4",
    description: "Meta de honor\xE1rios recorrentes para o fechamento do ano.",
    ownerType: "team",
    ownerId: "financeiro",
    periodicity: "quarterly",
    startDate: "2025-09-01",
    endDate: "2025-12-31",
    unit: "currency",
    baseline: 18e3,
    targetValue: 25e3,
    currentValue: 21e3,
    autoUpdate: true,
    metric: {
      source: "transactions",
      aggregation: "sum",
      field: "value",
      unit: "currency",
      filters: {
        transactionTypes: [TransactionType.Receita]
      }
    },
    thresholds: {
      critical: 0.5,
      warning: 0.75,
      success: 1,
      criticalLabel: "Receitas muito abaixo da linha m\xEDnima prevista.",
      warningLabel: "Aten\xE7\xE3o: estamos a menos de 75% do planejado.",
      successLabel: "Meta alcan\xE7ada! Continue nutrindo o funil financeiro."
    },
    status: "onTrack",
    lastUpdated: dayjs().subtract(2, "day").toISOString(),
    checkpointFrequency: "monthly",
    notificationSettings: {
      reminderFrequency: "monthly",
      channels: ["inApp", "slack"],
      beforeDeadlineDays: 5,
      mentionAssignees: true
    },
    motivationMessage: "Concentre follow-ups em propostas de honor\xE1rios ainda sem retorno."
  },
  {
    id: "goal-critical-cases",
    programId: "program-litigation-q1",
    title: "Concluir 30 tarefas cr\xEDticas do contencioso",
    description: "Prazos, recursos e audi\xEAncias essenciais para o trimestre.",
    ownerType: "team",
    ownerId: "contencioso",
    periodicity: "quarterly",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    unit: "count",
    baseline: 12,
    targetValue: 30,
    currentValue: 2,
    autoUpdate: true,
    metric: {
      source: "tasks",
      aggregation: "count",
      filters: {
        taskStatus: [TaskStatus.Concluida],
        tags: ["tasks-processuais", "tasks-alta-prioridade"],
        responsibleIds: [1, 2, 3]
      }
    },
    thresholds: {
      critical: 0.4,
      warning: 0.7,
      success: 1,
      criticalLabel: "Tarefas cr\xEDticas est\xE3o acumulando em contencioso.",
      warningLabel: "Ritmo abaixo do planejado. Ajuste prioriza\xE7\xE3o.",
      successLabel: "Time dentro do ritmo planejado."
    },
    status: "critical",
    lastUpdated: dayjs().subtract(1, "day").toISOString(),
    checkpointFrequency: "monthly",
    notificationSettings: {
      reminderFrequency: "weekly",
      channels: ["inApp"],
      beforeDeadlineDays: 2,
      mentionAssignees: true
    },
    motivationMessage: "Rodadas de alinhamento \xE0s segundas e check-ins r\xE1pidos \xE0s quintas."
  },
  {
    id: "goal-litigations-closed",
    programId: "program-litigation-q1",
    title: "Encerrar 5 processos com acordo",
    description: "Foco em acordos vantajosos e encerramentos estrat\xE9gicos.",
    ownerType: "team",
    ownerId: "contencioso",
    periodicity: "quarterly",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    unit: "count",
    baseline: 1,
    targetValue: 5,
    currentValue: 1,
    autoUpdate: true,
    metric: {
      source: "lawsuits",
      aggregation: "count",
      filters: {
        lawsuitStatus: ["Fechado"],
        areas: ["C\xEDvel", "Trabalhista", "Previdenci\xE1rio"]
      }
    },
    thresholds: {
      critical: 0.2,
      warning: 0.6,
      success: 1,
      criticalLabel: "Poucos processos encerrados neste per\xEDodo.",
      warningLabel: "Aten\xE7\xE3o: precisamos acelerar negocia\xE7\xF5es.",
      successLabel: "Encerramentos dentro do ritmo esperado."
    },
    status: "attention",
    lastUpdated: dayjs().subtract(5, "day").toISOString(),
    checkpointFrequency: "monthly",
    notificationSettings: {
      reminderFrequency: "monthly",
      channels: ["inApp"],
      beforeDeadlineDays: 7
    },
    motivationMessage: "Antecipe pontos de acordo antes das audi\xEAncias de instru\xE7\xE3o."
  },
  {
    id: "goal-new-clients",
    programId: "program-relacionamento",
    title: "Converter 6 novos clientes recorrentes",
    description: "Trabalhar leads estrat\xE9gicos no funil comercial.",
    ownerType: "team",
    ownerId: "comercial",
    periodicity: "monthly",
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    unit: "count",
    baseline: 2,
    targetValue: 6,
    currentValue: 2,
    autoUpdate: true,
    metric: {
      source: "contacts",
      aggregation: "count",
      filters: {
        contactStatus: ["Cliente"],
        owners: [1, 2]
      }
    },
    thresholds: {
      critical: 0.3,
      warning: 0.75,
      success: 1,
      criticalLabel: "Pipeline comercial precisa de refor\xE7o imediato.",
      warningLabel: "Acompanhe follow-ups com leads quentes.",
      successLabel: "Meta atingida, sinalizar pr\xF3ximos desafios."
    },
    status: "attention",
    lastUpdated: dayjs().subtract(3, "day").toISOString(),
    checkpointFrequency: "monthly",
    notificationSettings: {
      reminderFrequency: "weekly",
      channels: ["inApp", "slack"],
      mentionAssignees: true
    },
    motivationMessage: "Priorize indica\xE7\xF5es com maior potencial de honor\xE1rios recorrentes."
  },
  {
    id: "goal-training-hours",
    programId: "program-relacionamento",
    title: "Registrar 12 horas de treinamento em customer success",
    description: "Capacita\xE7\xE3o comercial para aumento de reten\xE7\xE3o.",
    ownerType: "team",
    ownerId: "comercial",
    periodicity: "monthly",
    startDate: "2025-10-01",
    endDate: "2025-10-31",
    unit: "hours",
    baseline: 0,
    targetValue: 12,
    currentValue: 6,
    autoUpdate: false,
    metric: {
      source: "manual",
      aggregation: "sum",
      unit: "hours"
    },
    thresholds: {
      critical: 0.4,
      warning: 0.75,
      success: 1,
      criticalLabel: "Treinamentos atrasados comprometem onboarding.",
      warningLabel: "Faltam poucas horas para atingir o objetivo.",
      successLabel: "Time 100% capacitado para o ciclo."
    },
    status: "attention",
    lastUpdated: dayjs().subtract(1, "day").toISOString(),
    checkpointFrequency: "weekly",
    notificationSettings: {
      reminderFrequency: "weekly",
      channels: ["inApp"],
      beforeDeadlineDays: 1
    },
    motivationMessage: "Reserve blocos na agenda para microtreinamentos com feedback."
  }
];
const GOAL_ASSIGNMENTS = [
  {
    id: "ga-revenue-carlos",
    goalId: "goal-revenue-q4",
    assigneeType: "user",
    assigneeId: 1,
    scope: "responsible",
    weight: 0.6
  },
  {
    id: "ga-revenue-sofia",
    goalId: "goal-revenue-q4",
    assigneeType: "user",
    assigneeId: 2,
    scope: "collaborator",
    weight: 0.4
  },
  {
    id: "ga-tasks-sofia",
    goalId: "goal-critical-cases",
    assigneeType: "user",
    assigneeId: 2,
    scope: "responsible",
    weight: 0.5
  },
  {
    id: "ga-tasks-miguel",
    goalId: "goal-critical-cases",
    assigneeType: "user",
    assigneeId: 3,
    scope: "collaborator",
    weight: 0.5
  },
  {
    id: "ga-litigations-miguel",
    goalId: "goal-litigations-closed",
    assigneeType: "user",
    assigneeId: 3,
    scope: "responsible"
  },
  {
    id: "ga-new-clients-carlos",
    goalId: "goal-new-clients",
    assigneeType: "user",
    assigneeId: 1,
    scope: "responsible"
  },
  {
    id: "ga-training-sofia",
    goalId: "goal-training-hours",
    assigneeType: "user",
    assigneeId: 2,
    scope: "responsible"
  }
];
const GOAL_CHECKPOINTS = [
  {
    id: "chk-revenue-sep",
    goalId: "goal-revenue-q4",
    periodStart: "2025-09-01",
    periodEnd: "2025-09-30",
    recordedAt: "2025-09-30T22:00:00Z",
    value: 8e3,
    delta: 8e3,
    notes: "Entrada de honor\xE1rios fixos de clientes recorrentes.",
    authorId: 1
  },
  {
    id: "chk-revenue-oct",
    goalId: "goal-revenue-q4",
    periodStart: "2025-10-01",
    periodEnd: "2025-10-31",
    recordedAt: "2025-10-31T22:00:00Z",
    value: 15e3,
    delta: 7e3,
    notes: "Novos contratos fechados em outubro.",
    authorId: 1
  },
  {
    id: "chk-tasks-jan",
    goalId: "goal-critical-cases",
    periodStart: "2025-01-01",
    periodEnd: "2025-01-31",
    recordedAt: "2025-01-31T15:00:00Z",
    value: 8,
    delta: 8,
    notes: "Mutir\xE3o de prazos na terceira semana.",
    authorId: 2
  },
  {
    id: "chk-tasks-feb",
    goalId: "goal-critical-cases",
    periodStart: "2025-02-01",
    periodEnd: "2025-02-28",
    recordedAt: "2025-02-28T15:00:00Z",
    value: 18,
    delta: 10,
    notes: "Refinamos prioriza\xE7\xE3o e conclu\xEDmos mais pe\xE7as.",
    authorId: 2
  },
  {
    id: "chk-lawsuits-jan",
    goalId: "goal-litigations-closed",
    periodStart: "2025-01-01",
    periodEnd: "2025-03-31",
    recordedAt: "2025-03-15T18:00:00Z",
    value: 1,
    delta: 1,
    notes: "Encerramos acordo previdenci\xE1rio (Proc. 2024/058-PREV).",
    authorId: 3
  },
  {
    id: "chk-clients-oct",
    goalId: "goal-new-clients",
    periodStart: "2025-10-01",
    periodEnd: "2025-10-31",
    recordedAt: "2025-10-25T12:00:00Z",
    value: 2,
    delta: 2,
    notes: "Convers\xF5es via indica\xE7\xE3o de clientes.",
    authorId: 1
  },
  {
    id: "chk-training-week1",
    goalId: "goal-training-hours",
    periodStart: "2025-10-01",
    periodEnd: "2025-10-07",
    recordedAt: "2025-10-07T19:00:00Z",
    value: 3,
    delta: 3,
    notes: "Workshop sobre upsell e cross-sell.",
    authorId: 2
  },
  {
    id: "chk-training-week2",
    goalId: "goal-training-hours",
    periodStart: "2025-10-08",
    periodEnd: "2025-10-14",
    recordedAt: "2025-10-14T19:00:00Z",
    value: 6,
    delta: 3,
    notes: "Simula\xE7\xF5es de atendimento com feedback.",
    authorId: 2
  }
];
const GOAL_NOTIFICATIONS = [
  {
    id: "gn-revenue-warning",
    goalId: "goal-revenue-q4",
    trigger: "warning",
    channel: "slack",
    message: "Receitas abaixo de 75% do planejado no programa financeiro.",
    recipients: [
      { type: "user", id: 1 },
      { type: "user", id: 2 }
    ],
    repeat: true
  },
  {
    id: "gn-tasks-critical",
    goalId: "goal-critical-cases",
    trigger: "critical",
    channel: "inApp",
    message: "Mutir\xE3o urgente: tarefas cr\xEDticas do contencioso est\xE3o atrasadas.",
    recipients: [{ type: "user", id: 2 }]
  },
  {
    id: "gn-training-achieved",
    goalId: "goal-training-hours",
    trigger: "achieved",
    channel: "inApp",
    message: "Parab\xE9ns! Treinamento de customer success conclu\xEDdo.",
    recipients: [
      { type: "user", id: 2 },
      { type: "user", id: 1 }
    ]
  }
];
const CATEGORY_GROUPS = [
  {
    id: "financial",
    label: "Financeiro",
    description: "Categorias utilizadas para receitas, despesas e relat\xF3rios financeiros.",
    items: [
      { id: "financial-honorarios", name: "Honor\xE1rios", color: "#0EA5E9", isDefault: true },
      { id: "financial-despesas-fixas", name: "Despesas Fixas", color: "#F97316", isDefault: true },
      { id: "financial-custas-processuais", name: "Custas Processuais", color: "#F43F5E", isDefault: true },
      { id: "financial-investimentos", name: "Investimentos", color: "#22C55E" },
      { id: "financial-marketing", name: "Marketing", color: "#A855F7" }
    ]
  },
  {
    id: "lawsuits",
    label: "Processos",
    description: "\xC1reas do direito e tipifica\xE7\xF5es para classifica\xE7\xE3o dos processos.",
    items: [
      { id: "lawsuits-civel", name: "C\xEDvel", color: "#2563EB", isDefault: true },
      { id: "lawsuits-trabalhista", name: "Trabalhista", color: "#EA580C", isDefault: true },
      { id: "lawsuits-previdenciario", name: "Previdenci\xE1rio", color: "#16A34A", isDefault: true },
      { id: "lawsuits-tributario", name: "Tribut\xE1rio", color: "#6366F1" },
      { id: "lawsuits-penal", name: "Penal", color: "#DC2626" },
      { id: "lawsuits-consumidor", name: "Direito do Consumidor", color: "#0EA5E9" }
    ]
  },
  {
    id: "tasks",
    label: "Tarefas",
    description: "Segmenta\xE7\xF5es para planejamento e prioriza\xE7\xE3o de tarefas.",
    items: [
      { id: "tasks-alta-prioridade", name: "Alta prioridade", color: "#DC2626", isDefault: true },
      { id: "tasks-processuais", name: "Processual", color: "#2563EB", isDefault: true },
      { id: "tasks-administrativas", name: "Administrativa", color: "#F59E0B", isDefault: true },
      { id: "tasks-reunioes", name: "Reuni\xF5es", color: "#7C3AED" },
      { id: "tasks-financeiro", name: "Financeiro", color: "#0EA5E9" }
    ]
  },
  {
    id: "leads",
    label: "Leads e oportunidades",
    description: "Categorias para acompanhar origens e est\xE1gio dos leads.",
    items: [
      { id: "leads-clientes-ativos", name: "Clientes ativos", color: "#16A34A", isDefault: true },
      { id: "leads-quentes", name: "Leads quentes", color: "#EA580C", isDefault: true },
      { id: "leads-frios", name: "Leads frios", color: "#64748B", isDefault: true },
      { id: "leads-parceiros", name: "Parceiros", color: "#6366F1" },
      { id: "leads-eventos", name: "Eventos e feiras", color: "#0EA5E9" }
    ]
  },
  {
    id: "contacts",
    label: "Contatos",
    description: "Categorias para segmenta\xE7\xE3o de clientes, fornecedores e parceiros.",
    items: [
      { id: "contacts-cliente", name: "Cliente", color: "#1D4ED8", isDefault: true },
      { id: "contacts-prospect", name: "Prospect", color: "#0EA5E9", isDefault: true },
      { id: "contacts-parceiro", name: "Parceiro", color: "#7C3AED", isDefault: true },
      { id: "contacts-fornecedor", name: "Fornecedor", color: "#F97316" },
      { id: "contacts-consultor", name: "Consultor externo", color: "#10B981" }
    ]
  },
  {
    id: "documents",
    label: "Documentos",
    description: "Tipos de documentos para organiza\xE7\xE3o do acervo.",
    items: [
      { id: "documents-contrato", name: "Contrato", color: "#2563EB", isDefault: true },
      { id: "documents-procuracao", name: "Procura\xE7\xE3o", color: "#6366F1", isDefault: true },
      { id: "documents-peticao", name: "Peti\xE7\xE3o", color: "#F97316", isDefault: true },
      { id: "documents-comprovante", name: "Comprovante", color: "#0EA5E9" },
      { id: "documents-laudo", name: "Laudo / per\xEDcia", color: "#10B981" }
    ]
  },
  {
    id: "events",
    label: "Agenda e compromissos",
    description: "Classifica\xE7\xF5es para eventos e compromissos recorrentes.",
    items: [
      { id: "events-audiencia", name: "Audi\xEAncia", color: "#2563EB", isDefault: true },
      { id: "events-reuniao-cliente", name: "Reuni\xE3o com cliente", color: "#7C3AED", isDefault: true },
      { id: "events-reuniao-interna", name: "Reuni\xE3o interna", color: "#0EA5E9", isDefault: true },
      { id: "events-prazo-processual", name: "Prazo processual", color: "#DC2626" },
      { id: "events-treinamento", name: "Treinamento", color: "#22C55E" }
    ]
  }
];
const NOTIFICATIONS = [
  {
    id: "notif-1",
    recipientId: 2,
    actorId: 1,
    title: "Voc\xEA foi mencionado",
    message: 'Carlos Ferreira mencionou voc\xEA na tarefa "Elaborar peti\xE7\xE3o inicial para 2025/001-CIV".',
    createdAt: dayjs().subtract(1, "day").toISOString(),
    isRead: false,
    entityType: "task",
    entityId: 1
  },
  {
    id: "notif-2",
    recipientId: 3,
    actorId: 1,
    title: "Marca\xE7\xF5es recentes",
    message: 'Carlos Ferreira lembrou voc\xEA na tarefa "Elaborar peti\xE7\xE3o inicial para 2025/001-CIV".',
    createdAt: dayjs().subtract(2, "day").toISOString(),
    isRead: true,
    entityType: "task",
    entityId: 1
  }
];
const PERMISSION_KEYS = [
  "viewDashboard",
  "viewCalendar",
  "viewFinancial",
  "createFinancial",
  "approveFinancial",
  "viewLeads",
  "manageLeads",
  "viewProcesses",
  "manageProcesses",
  "viewTasks",
  "manageTasks",
  "viewContacts",
  "manageContacts",
  "viewReports",
  "viewSettings",
  "manageUsers",
  "manageCategories"
];
const PERMISSIONS = [
  {
    id: "viewDashboard",
    label: "Visualizar dashboard",
    description: "Pode acessar a vis\xE3o geral com indicadores e m\xE9tricas.",
    category: "Produtividade"
  },
  {
    id: "viewCalendar",
    label: "Acessar agenda",
    description: "Pode visualizar eventos, audi\xEAncias e compromissos.",
    category: "Produtividade"
  },
  {
    id: "viewFinancial",
    label: "Visualizar financeiro",
    description: "Pode consultar lan\xE7amentos financeiros e relat\xF3rios.",
    category: "Financeiro"
  },
  {
    id: "createFinancial",
    label: "Registrar receitas e despesas",
    description: "Pode adicionar e editar lan\xE7amentos financeiros.",
    category: "Financeiro"
  },
  {
    id: "approveFinancial",
    label: "Aprovar lan\xE7amentos financeiros",
    description: "Pode revisar e aprovar despesas sens\xEDveis.",
    category: "Financeiro"
  },
  {
    id: "viewLeads",
    label: "Visualizar leads",
    description: "Pode acessar a lista de leads e oportunidades.",
    category: "CRM"
  },
  {
    id: "manageLeads",
    label: "Gerenciar leads",
    description: "Pode editar, reclassificar e atribuir leads.",
    category: "CRM"
  },
  {
    id: "viewProcesses",
    label: "Visualizar processos",
    description: "Pode consultar processos e seus detalhes.",
    category: "Processos"
  },
  {
    id: "manageProcesses",
    label: "Gerenciar processos",
    description: "Pode editar prazos, respons\xE1veis e \xE1reas do processo.",
    category: "Processos"
  },
  {
    id: "viewTasks",
    label: "Visualizar tarefas",
    description: "Pode acessar o quadro e lista de tarefas.",
    category: "Produtividade"
  },
  {
    id: "manageTasks",
    label: "Gerenciar tarefas",
    description: "Pode criar, editar e concluir tarefas.",
    category: "Produtividade"
  },
  {
    id: "viewContacts",
    label: "Visualizar contatos",
    description: "Pode consultar clientes, fornecedores e parceiros.",
    category: "CRM"
  },
  {
    id: "manageContacts",
    label: "Gerenciar contatos",
    description: "Pode criar e atualizar cadastros de contatos.",
    category: "CRM"
  },
  {
    id: "viewReports",
    label: "Visualizar relat\xF3rios",
    description: "Pode acessar relat\xF3rios de performance e produtividade.",
    category: "Produtividade"
  },
  {
    id: "viewSettings",
    label: "Acessar configura\xE7\xF5es",
    description: "Pode acessar a \xE1rea de configura\xE7\xF5es do sistema.",
    category: "Administra\xE7\xE3o"
  },
  {
    id: "manageUsers",
    label: "Gerenciar usu\xE1rios e equipe",
    description: "Pode convidar, editar ou desativar usu\xE1rios.",
    category: "Administra\xE7\xE3o"
  },
  {
    id: "manageCategories",
    label: "Administrar categorias",
    description: "Pode criar, editar e remover categorias do sistema.",
    category: "Administra\xE7\xE3o"
  }
];
const buildPermissionSet = (allowed) => {
  return PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = allowed.includes(key);
    return acc;
  }, {});
};
const USER_ROLES = [
  {
    id: "admin",
    name: "Administrador",
    description: "Acesso total ao sistema e aos controles de seguran\xE7a.",
    color: "#1D4ED8",
    isSystem: true,
    permissions: buildPermissionSet(PERMISSION_KEYS)
  },
  {
    id: "advogado",
    name: "Advogado",
    description: "Respons\xE1vel por processos e relacionamento com clientes.",
    color: "#0EA5E9",
    isSystem: true,
    permissions: buildPermissionSet([
      "viewDashboard",
      "viewCalendar",
      "viewFinancial",
      "viewLeads",
      "viewProcesses",
      "manageProcesses",
      "viewTasks",
      "manageTasks",
      "viewContacts",
      "manageContacts",
      "viewReports"
    ])
  },
  {
    id: "estagiario",
    name: "Estagi\xE1rio",
    description: "Atua com apoio operacional com acesso supervisionado.",
    color: "#6366F1",
    isSystem: true,
    permissions: buildPermissionSet([
      "viewDashboard",
      "viewCalendar",
      "viewProcesses",
      "viewTasks",
      "manageTasks",
      "viewContacts"
    ])
  },
  {
    id: "financeiro",
    name: "Financeiro",
    description: "Cuida do fluxo de caixa, lan\xE7amentos e aprova\xE7\xF5es.",
    color: "#22C55E",
    isSystem: true,
    permissions: buildPermissionSet([
      "viewDashboard",
      "viewFinancial",
      "createFinancial",
      "approveFinancial",
      "viewReports",
      "viewSettings"
    ])
  },
  {
    id: "gestor",
    name: "Gestor",
    description: "Vis\xE3o estrat\xE9gica da opera\xE7\xE3o com aprova\xE7\xE3o de acessos.",
    color: "#F97316",
    isSystem: true,
    permissions: buildPermissionSet([
      "viewDashboard",
      "viewCalendar",
      "viewFinancial",
      "approveFinancial",
      "viewLeads",
      "manageLeads",
      "viewProcesses",
      "manageProcesses",
      "viewTasks",
      "manageTasks",
      "viewContacts",
      "manageContacts",
      "viewReports",
      "viewSettings",
      "manageCategories"
    ])
  }
];
export {
  BADGES,
  CALENDAR_EVENTS,
  CATEGORY_GROUPS,
  CONTACTS,
  GOALS,
  GOAL_ASSIGNMENTS,
  GOAL_CHECKPOINTS,
  GOAL_NOTIFICATIONS,
  GOAL_PROGRAMS,
  KANBAN_CARDS,
  LAWSUITS,
  LEVELS,
  NOTIFICATIONS,
  PERMISSIONS,
  PERMISSION_KEYS,
  TASKS,
  TRANSACTIONS,
  USERS,
  USER_ROLES
};
