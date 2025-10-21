import { LucideIcon } from 'lucide-react';

export enum TaskStatus {
  Pendente = 'Pendente',
  Concluida = 'Concluída',
  Atrasada = 'Atrasada',
}

export enum KanbanColumn {
  Prospeccao = 'Prospecção',
  AnaliseDocumentos = 'Análise de Documentos',
  ElaboracaoPeticao = 'Elaboração da Petição',
  AguardandoJulgamento = 'Aguardando Julgamento',
  Finalizados = 'Finalizados',
}

export enum KanbanPhase {
  Judicial = 'Judicial',
  Extrajudicial = 'Extrajudicial',
}

export enum TransactionType {
    Receita = 'Receita',
    Despesa = 'Despesa',
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  usersCount?: number;
}

export interface User {
  id: number;
  name: string;
  avatar: string;
  email: string;
  tenantId?: number;
  tenant?: Tenant | null;
  isTenantAdmin?: boolean;
  jobTitle?: string;
  personalEmail?: string;
  phone?: string;
  secondaryPhone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  birthdate?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  bio?: string;
  roleId?: string;
  roleName?: string;
}

export interface Contact {
  id: number;
  name: string;
  document: string;
  origin: string;
  status: string;
  ownerId: number;
  lastInteraction: string;
  email: string;
  phone: string;
  profession: string;
  categoryId?: string;
  leadCategoryId?: string;
  notes?: string;
  mentions?: MentionReference[];
}

export interface Lawsuit {
  id: number;
  internalNumber: string;
  clientId: number;
  responsibleId: number;
  area: string;
  phase: string;
  deadline: string;
  status: 'Ativo' | 'Fechado' | 'Arquivado';
  kanbanColumn?: KanbanColumn;
  kanbanPhase?: KanbanPhase;
  notes?: string;
  mentions?: MentionReference[];
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  dueDate: string;
  deadline: string;
  responsibleId: number;
  lawsuitId?: number;
  clientId?: number;
  score: number;
  categoryId?: string;
  notes?: string;
  mentions?: MentionReference[];
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  column: KanbanColumn;
  phase: KanbanPhase;
  area: 'Cível' | 'Trabalhista' | 'Previdenciário' | 'Não definido';
  responsibleId: number;
  deadline?: string;
  hasAttachments: boolean;
  commentsCount: number;
  hasReminder: boolean;
  isDelayed: boolean;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
}

export interface Transaction {
    id: number;
    date: string;
    description: string;
    category: string;
    account: string;
    value: number;
    type: TransactionType;
    categoryId?: string;
}

export type MentionTargetType = 'user' | 'contact';

export interface MentionReference {
  id: number;
  kind: MentionTargetType;
  label: string;
}

export type NotificationEntityType = 'task' | 'lawsuit' | 'contact' | 'goal';

export interface NotificationItem {
  id: string;
  recipientId: number;
  actorId?: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  entityType: NotificationEntityType;
  entityId: number | string;
}

export interface TimelineEvent {
  date: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export interface Level {
    level: number;
    name: string;
    pointsRequired: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    type: 'score' | 'tasks' | 'area';
    threshold: number;
    area?: 'Cível' | 'Trabalhista' | 'Previdenciário';
}

export type CategoryGroupType =
  | 'financial'
  | 'lawsuits'
  | 'tasks'
  | 'leads'
  | 'contacts'
  | 'documents'
  | 'events';

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}

export interface CategoryGroup {
  id: CategoryGroupType;
  label: string;
  description: string;
  items: CategoryItem[];
}

export type PermissionKey =
  | 'viewDashboard'
  | 'viewCalendar'
  | 'viewFinancial'
  | 'createFinancial'
  | 'approveFinancial'
  | 'viewLeads'
  | 'manageLeads'
  | 'viewProcesses'
  | 'manageProcesses'
  | 'viewTasks'
  | 'manageTasks'
  | 'viewContacts'
  | 'manageContacts'
  | 'viewReports'
  | 'viewSettings'
  | 'manageUsers'
  | 'manageCategories';

export interface PermissionDefinition {
  id: PermissionKey;
  label: string;
  description: string;
  category: 'Financeiro' | 'Processos' | 'CRM' | 'Produtividade' | 'Administração';
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color?: string;
  isSystem?: boolean;
  permissions: Record<PermissionKey, boolean>;
}

export type GoalProgramType =
  | 'Financeiro'
  | 'Produção'
  | 'Relacionamento'
  | 'Marketing'
  | 'Qualidade';

export type GoalVisibility = 'global' | 'team' | 'individual';

export type GoalStatus = 'onTrack' | 'attention' | 'critical' | 'achieved';

export type GoalUnit = 'currency' | 'percentage' | 'count' | 'hours';

export type GoalPeriodicity = 'one-time' | 'monthly' | 'weekly' | 'quarterly' | 'annual';

export type GoalOwnerType = 'user' | 'team';

export type GoalMetricSourceType =
  | 'manual'
  | 'tasks'
  | 'lawsuits'
  | 'transactions'
  | 'contacts';

export type GoalAggregation = 'sum' | 'count' | 'average' | 'percent';

export interface GoalThresholds {
  success: number;
  warning: number;
  critical?: number;
  successLabel?: string;
  warningLabel?: string;
  criticalLabel?: string;
}

export interface GoalMetricDateFilter {
  from?: string;
  to?: string;
}

export interface GoalMetricDefinition {
  source: GoalMetricSourceType;
  aggregation: GoalAggregation;
  unit?: GoalUnit;
  field?: 'score' | 'value';
  filters?: {
    responsibleIds?: number[];
    areas?: string[];
    taskStatus?: TaskStatus[];
    transactionTypes?: TransactionType[];
    contactStatus?: string[];
    owners?: number[];
    tags?: string[];
    lawsuitStatus?: Lawsuit['status'][];
    dateRange?: GoalMetricDateFilter;
  };
}

export interface GoalProgram {
  id: string;
  name: string;
  description?: string;
  type: GoalProgramType;
  icon?: LucideIcon;
  color?: string;
  startDate: string;
  endDate: string;
  visibility: GoalVisibility;
  ownerTeamId?: string;
  tags?: string[];
}

export interface GoalNotificationSettings {
  reminderFrequency?: 'weekly' | 'monthly' | 'quarterly';
  channels?: Array<'inApp' | 'email' | 'slack'>;
  beforeDeadlineDays?: number;
  mentionAssignees?: boolean;
}

export interface Goal {
  id: string;
  programId: string;
  title: string;
  description?: string;
  ownerType: GoalOwnerType;
  ownerId?: number | string;
  periodicity: GoalPeriodicity;
  startDate: string;
  endDate: string;
  unit: GoalUnit;
  baseline?: number;
  targetValue: number;
  currentValue: number;
  autoUpdate: boolean;
  metric: GoalMetricDefinition;
  thresholds: GoalThresholds;
  status: GoalStatus;
  lastUpdated: string;
  tags?: string[];
  checkpointFrequency?: 'weekly' | 'monthly' | 'quarterly';
  displayOrder?: number;
  notificationSettings?: GoalNotificationSettings;
  motivationMessage?: string;
}

export type GoalAssignmentScope = 'responsible' | 'collaborator' | 'observer';

export interface GoalAssignment {
  id: string;
  goalId: string;
  assigneeType: GoalOwnerType;
  assigneeId: number | string;
  scope: GoalAssignmentScope;
  weight?: number;
}

export interface GoalCheckpoint {
  id: string;
  goalId: string;
  periodStart: string;
  periodEnd?: string;
  recordedAt: string;
  value: number;
  notes?: string;
  authorId?: number;
  delta?: number;
}

export type GoalNotificationTrigger = 'warning' | 'critical' | 'achieved' | 'checkpoint';

export interface GoalNotificationRecipient {
  type: GoalOwnerType;
  id: number | string;
}

export interface GoalNotificationRule {
  id: string;
  goalId: string;
  trigger: GoalNotificationTrigger;
  channel: 'inApp' | 'email' | 'slack';
  message?: string;
  recipients: GoalNotificationRecipient[];
  repeat?: boolean;
}
