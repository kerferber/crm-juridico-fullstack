import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  User,
  Contact,
  Lawsuit,
  Task,
  KanbanCard,
  CalendarEvent,
  Transaction,
  KanbanColumn,
  KanbanPhase,
  TaskStatus,
  TransactionType,
  CategoryGroup,
  CategoryGroupType,
  CategoryItem,
  PermissionDefinition,
  PermissionKey,
  RoleDefinition,
  MentionReference,
  NotificationItem,
  NotificationEntityType,
  GoalProgram,
  Goal,
  GoalCheckpoint,
  GoalAssignment,
  GoalNotificationRule,
  GoalProgramType,
  GoalStatus,
  GoalMetricSourceType,
  GoalAggregation,
  GoalVisibility,
  GoalUnit,
  GoalPeriodicity,
  GoalOwnerType,
  GoalNotificationTrigger,
} from '../types/types';
import dayjs from 'dayjs';
import { ApiError, apiClient, isUsingMockApi } from '../services/api';
import { useAuth } from './AuthContext';
import { getGoalProgressPercentage } from '../lib/goal-utils';
import {
  CATEGORY_GROUPS,
  PERMISSIONS,
  USER_ROLES,
  PERMISSION_KEYS,
  NOTIFICATIONS,
  GOAL_PROGRAMS,
  GOALS,
  GOAL_ASSIGNMENTS,
  GOAL_CHECKPOINTS,
  GOAL_NOTIFICATIONS,
} from '../data/seed';

type ApiCollection<T> = T[] | { data: T[] };

const isApiCollection = <T,>(payload: unknown): payload is ApiCollection<T> => {
  if (!payload) return false;
  if (Array.isArray(payload)) return true;
  return typeof payload === 'object' && Array.isArray((payload as { data?: T[] }).data);
};

const toArray = <T,>(payload: unknown): T[] => {
  if (!isApiCollection<T>(payload)) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};

const ensureString = (value: any, fallback = ''): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const ensureNumber = (value: any, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const ensureEntityId = (value: any): number | string => {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const str = ensureString(value);
  return str || 0;
};

const fetchOptionalCollection = async (endpoint: string) => {
  try {
    return await apiClient.get(endpoint);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

const ensureOptionalNumber = (value: any): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const optionalString = (value: any): string | undefined => {
  const normalized = ensureString(value);
  return normalized ? normalized : undefined;
};

const extractMessageFromPayload = (payload: unknown): string => {
  if (!payload) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload.toLowerCase();
  }

  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>;

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.toLowerCase();
    }

    if (data.errors && typeof data.errors === 'object' && data.errors !== null) {
      const errors = data.errors as Record<string, unknown>;
      for (const key of Object.keys(errors)) {
        const value = errors[key];
        if (typeof value === 'string' && value.trim()) {
          return value.toLowerCase();
        }
        if (Array.isArray(value)) {
          const message = value.find(item => typeof item === 'string' && item.trim());
          if (typeof message === 'string') {
            return message.toLowerCase();
          }
        }
      }
    }
  }

  return '';
};

const avatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Usuário')}&background=random`;

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isBrowserEnvironment = typeof window !== 'undefined';
const CATEGORY_STORAGE_KEY = 'workflow-studio:category-groups:v1';
const ROLE_STORAGE_KEY = 'workflow-studio:user-roles:v1';
const NOTIFICATION_STORAGE_KEY = 'workflow-studio:notifications:v1';
const TASK_NOTES_STORAGE_KEY = 'workflow-studio:task-annotations:v1';
const CONTACT_NOTES_STORAGE_KEY = 'workflow-studio:contact-annotations:v1';
const LAWSUIT_NOTES_STORAGE_KEY = 'workflow-studio:lawsuit-annotations:v1';
const GOAL_PROGRAMS_STORAGE_KEY = 'workflow-studio:goal-programs:v1';
const GOALS_STORAGE_KEY = 'workflow-studio:goals:v1';
const GOAL_ASSIGNMENTS_STORAGE_KEY = 'workflow-studio:goal-assignments:v1';
const GOAL_CHECKPOINTS_STORAGE_KEY = 'workflow-studio:goal-checkpoints:v1';
const GOAL_NOTIFICATIONS_STORAGE_KEY = 'workflow-studio:goal-notifications:v1';

const safeParseJSON = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse stored data', error);
    return null;
  }
};

const cloneCategoryGroups = (groups: CategoryGroup[]): CategoryGroup[] =>
  groups.map(group => ({
    ...group,
    items: group.items.map(item => ({ ...item })),
  }));

const cloneRoles = (roles: RoleDefinition[]): RoleDefinition[] =>
  roles.map(role => ({
    ...role,
    permissions: { ...role.permissions },
  }));

const cloneGoalMetricFilters = (
  filters: Goal['metric']['filters'] | undefined
): Goal['metric']['filters'] | undefined => {
  if (!filters) return undefined;
  return {
    ...filters,
    responsibleIds: filters.responsibleIds ? [...filters.responsibleIds] : undefined,
    areas: filters.areas ? [...filters.areas] : undefined,
    taskStatus: filters.taskStatus ? [...filters.taskStatus] : undefined,
    transactionTypes: filters.transactionTypes ? [...filters.transactionTypes] : undefined,
    contactStatus: filters.contactStatus ? [...filters.contactStatus] : undefined,
    owners: filters.owners ? [...filters.owners] : undefined,
    tags: filters.tags ? [...filters.tags] : undefined,
    lawsuitStatus: filters.lawsuitStatus ? [...filters.lawsuitStatus] : undefined,
    dateRange: filters.dateRange
      ? { from: filters.dateRange.from, to: filters.dateRange.to }
      : undefined,
  };
};

const cloneGoalMetric = (metric: Goal['metric']): Goal['metric'] => ({
  ...metric,
  filters: cloneGoalMetricFilters(metric.filters),
});

const cloneGoalThresholds = (thresholds: Goal['thresholds']): Goal['thresholds'] => ({
  ...thresholds,
});

const cloneGoalNotificationSettings = (
  settings: Goal['notificationSettings'] | undefined
): Goal['notificationSettings'] | undefined => {
  if (!settings) return undefined;
  return {
    ...settings,
    channels: settings.channels ? [...settings.channels] : undefined,
  };
};

const cloneGoalPrograms = (programs: GoalProgram[]): GoalProgram[] =>
  programs.map(program => ({
    ...program,
    tags: program.tags ? [...program.tags] : undefined,
  }));

const cloneGoals = (goals: Goal[]): Goal[] =>
  goals.map(goal => ({
    ...goal,
    tags: goal.tags ? [...goal.tags] : undefined,
    metric: cloneGoalMetric(goal.metric),
    thresholds: cloneGoalThresholds(goal.thresholds),
    notificationSettings: cloneGoalNotificationSettings(goal.notificationSettings),
  }));

const cloneGoalAssignments = (assignments: GoalAssignment[]): GoalAssignment[] =>
  assignments.map(assignment => ({
    ...assignment,
  }));

const cloneGoalCheckpoints = (checkpoints: GoalCheckpoint[]): GoalCheckpoint[] =>
  checkpoints.map(checkpoint => ({
    ...checkpoint,
  }));

const cloneGoalNotifications = (rules: GoalNotificationRule[]): GoalNotificationRule[] =>
  rules.map(rule => ({
    ...rule,
    recipients: rule.recipients ? rule.recipients.map(recipient => ({ ...recipient })) : [],
  }));

const generateNotificationId = () => `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const generateRandomId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;

const buildMentionsSignature = (mentions?: MentionReference[]) =>
  (mentions ?? [])
    .map(mention => `${mention.kind}:${mention.id}:${mention.label}`)
    .sort()
    .join('|');

const tasksAreEqual = (prev: Task[], next: Task[]) => {
  if (prev.length !== next.length) return false;
  const reference = new Map(prev.map(task => [task.id, task]));
  for (const task of next) {
    const existing = reference.get(task.id);
    if (!existing) return false;
    if (
      existing.title !== task.title ||
      existing.status !== task.status ||
      existing.dueDate !== task.dueDate ||
      existing.deadline !== task.deadline ||
      existing.responsibleId !== task.responsibleId ||
      existing.lawsuitId !== task.lawsuitId ||
      existing.clientId !== task.clientId ||
      existing.score !== task.score ||
      existing.categoryId !== task.categoryId ||
      (existing.notes || '') !== (task.notes || '') ||
      buildMentionsSignature(existing.mentions) !== buildMentionsSignature(task.mentions)
    ) {
      return false;
    }
  }
  return true;
};

const notificationsAreEqual = (prev: NotificationItem[], next: NotificationItem[]) => {
  if (prev.length !== next.length) return false;
  for (let index = 0; index < prev.length; index += 1) {
    const current = prev[index];
    const candidate = next[index];
    if (
      current.id !== candidate.id ||
      current.recipientId !== candidate.recipientId ||
      current.actorId !== candidate.actorId ||
      current.title !== candidate.title ||
      current.message !== candidate.message ||
      current.createdAt !== candidate.createdAt ||
      current.isRead !== candidate.isRead ||
      current.entityType !== candidate.entityType ||
      current.entityId !== candidate.entityId
    ) {
      return false;
    }
  }
  return true;
};

const mapMentionsFromApi = (raw: any): MentionReference[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      const id = ensureNumber(item?.id);
      const kind = item?.kind === 'contact' ? 'contact' : item?.kind === 'user' ? 'user' : null;
      const label = ensureString(item?.label);
      if (!kind || !label || id <= 0) return null;
      return { id, kind, label } as MentionReference;
    })
    .filter(Boolean) as MentionReference[];
};

const sortNotifications = (items: NotificationItem[]) =>
  [...items].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

const mapNotificationFromApi = (raw: any): NotificationItem => {
  const id = ensureString(raw?.id, generateNotificationId());
  const recipientId = ensureNumber(raw?.recipientId ?? raw?.recipient_id);
  const actorId = ensureOptionalNumber(raw?.actorId ?? raw?.actor_id);
  const entityTypeRaw = ensureString(raw?.entityType ?? raw?.entity_type, 'task').toLowerCase();
  const allowedTypes: NotificationEntityType[] = ['task', 'lawsuit', 'contact', 'goal'];
  const entityType = allowedTypes.includes(entityTypeRaw as NotificationEntityType)
    ? (entityTypeRaw as NotificationEntityType)
    : 'task';
  return {
    id,
    recipientId,
    actorId: actorId ?? undefined,
    title: ensureString(raw?.title, 'Notificação'),
    message: ensureString(raw?.message),
    createdAt: ensureString(raw?.createdAt ?? raw?.created_at, new Date().toISOString()),
    isRead: Boolean(raw?.isRead ?? raw?.is_read),
    entityType,
    entityId: ensureEntityId(raw?.entityId ?? raw?.entity_id),
  };
};

const mergeCategoryGroupsSeed = (
  seed: CategoryGroup[],
  stored: CategoryGroup[] | null | undefined
): CategoryGroup[] => {
  if (!stored || !Array.isArray(stored)) {
    return cloneCategoryGroups(seed);
  }

  const storedMap = new Map<CategoryGroupType, CategoryGroup>();
  stored.forEach(group => {
    if (group?.id) {
      storedMap.set(group.id, {
        ...group,
        items: Array.isArray(group.items) ? group.items.map(item => ({ ...item })) : [],
      });
    }
  });

  const merged: CategoryGroup[] = seed.map(seedGroup => {
    const storedGroup = storedMap.get(seedGroup.id);
    if (!storedGroup) {
      return {
        ...seedGroup,
        items: seedGroup.items.map(item => ({ ...item })),
      };
    }

    const storedItemsMap = new Map<string, CategoryItem>();
    storedGroup.items.forEach(item => {
      if (item?.id) {
        storedItemsMap.set(item.id, { ...item });
      }
    });

    const mergedItems: CategoryItem[] = [];

    // Preserve stored items in the same order
    storedGroup.items.forEach(item => {
      if (item?.id) {
        const seedItem = seedGroup.items.find(seedIt => seedIt.id === item.id);
        mergedItems.push({
          ...item,
          isDefault: seedItem?.isDefault ?? item.isDefault,
        });
      }
    });

    // Ensure seed defaults exist
    seedGroup.items.forEach(seedItem => {
      if (!storedItemsMap.has(seedItem.id)) {
        mergedItems.push({ ...seedItem });
      }
    });

    return {
      ...seedGroup,
      items: mergedItems,
    };
  });

  return merged;
};

const ensureRolePermissions = (role: RoleDefinition): RoleDefinition => {
  const normalizedPermissions = PERMISSION_KEYS.reduce<Record<PermissionKey, boolean>>((acc, key) => {
    acc[key] = Boolean(role.permissions?.[key]);
    return acc;
  }, {} as Record<PermissionKey, boolean>);
  return {
    ...role,
    permissions: normalizedPermissions,
  };
};

const mergeRoleSeeds = (
  seedRoles: RoleDefinition[],
  storedRoles: RoleDefinition[] | null | undefined
): RoleDefinition[] => {
  const storedMap = new Map<string, RoleDefinition>();
  storedRoles?.forEach(role => {
    if (role?.id) {
      storedMap.set(role.id, ensureRolePermissions(role));
    }
  });

  const mergedSystemRoles = seedRoles.map(seedRole => {
    const stored = storedMap.get(seedRole.id);
    if (!stored) {
      return ensureRolePermissions({ ...seedRole });
    }
    const mergedPermissions = PERMISSION_KEYS.reduce<Record<PermissionKey, boolean>>((acc, key) => {
      const storedValue = stored.permissions?.[key];
      const seedValue = seedRole.permissions?.[key];
      acc[key] = storedValue !== undefined ? storedValue : Boolean(seedValue);
      return acc;
    }, {} as Record<PermissionKey, boolean>);

    return {
      ...seedRole,
      color: stored.color ?? seedRole.color,
      permissions: mergedPermissions,
    };
  });

  const customRoles = storedRoles
    ?.filter(role => role && !role.isSystem)
    .map(role => ensureRolePermissions({ ...role })) ?? [];

  return [...mergedSystemRoles, ...customRoles];
};

const loadStoredCategoryGroups = (): CategoryGroup[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<CategoryGroup[]>(window.localStorage.getItem(CATEGORY_STORAGE_KEY));
  if (!parsed) return null;
  return mergeCategoryGroupsSeed(CATEGORY_GROUPS, parsed);
};

const loadStoredRoles = (): RoleDefinition[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<RoleDefinition[]>(window.localStorage.getItem(ROLE_STORAGE_KEY));
  if (!parsed) return null;
  return mergeRoleSeeds(USER_ROLES, parsed);
};

const loadStoredNotifications = (): NotificationItem[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<NotificationItem[]>(window.localStorage.getItem(NOTIFICATION_STORAGE_KEY));
  if (!parsed) return null;
  return parsed.map(item => ({
    ...item,
    createdAt: ensureString(item.createdAt, new Date().toISOString()),
    message: ensureString(item.message),
    title: ensureString(item.title, 'Notificação'),
    isRead: Boolean((item as any)?.isRead),
  }));
};

const loadStoredGoalPrograms = (): GoalProgram[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<GoalProgram[]>(window.localStorage.getItem(GOAL_PROGRAMS_STORAGE_KEY));
  if (!parsed) return null;
  return cloneGoalPrograms(parsed);
};

const loadStoredGoals = (): Goal[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<Goal[]>(window.localStorage.getItem(GOALS_STORAGE_KEY));
  if (!parsed) return null;
  return cloneGoals(parsed);
};

const loadStoredGoalAssignments = (): GoalAssignment[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<GoalAssignment[]>(
    window.localStorage.getItem(GOAL_ASSIGNMENTS_STORAGE_KEY)
  );
  if (!parsed) return null;
  return cloneGoalAssignments(parsed);
};

const loadStoredGoalCheckpoints = (): GoalCheckpoint[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<GoalCheckpoint[]>(
    window.localStorage.getItem(GOAL_CHECKPOINTS_STORAGE_KEY)
  );
  if (!parsed) return null;
  return cloneGoalCheckpoints(parsed);
};

const loadStoredGoalNotifications = (): GoalNotificationRule[] | null => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON<GoalNotificationRule[]>(
    window.localStorage.getItem(GOAL_NOTIFICATIONS_STORAGE_KEY)
  );
  if (!parsed) return null;
  return cloneGoalNotifications(parsed);
};

const persistCategoryGroups = (groups: CategoryGroup[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error('Failed to persist category groups', error);
  }
};

const persistUserRoles = (roles: RoleDefinition[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
  } catch (error) {
    console.error('Failed to persist user roles', error);
  }
};

const persistNotifications = (items: NotificationItem[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to persist notifications', error);
  }
};

const persistGoalPrograms = (programs: GoalProgram[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
  } catch (error) {
    console.error('Failed to persist goal programs', error);
  }
};

const persistGoals = (goals: Goal[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Failed to persist goals', error);
  }
};

const persistGoalAssignments = (assignments: GoalAssignment[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to persist goal assignments', error);
  }
};

const persistGoalCheckpoints = (checkpoints: GoalCheckpoint[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_CHECKPOINTS_STORAGE_KEY, JSON.stringify(checkpoints));
  } catch (error) {
    console.error('Failed to persist goal checkpoints', error);
  }
};

const persistGoalNotifications = (rules: GoalNotificationRule[]) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(rules));
  } catch (error) {
    console.error('Failed to persist goal notifications', error);
  }
};

type AnnotationCache = Record<number, { notes?: string; mentions?: MentionReference[] }>;

const loadAnnotationCache = (storageKey: string): AnnotationCache => {
  if (!isBrowserEnvironment) return {};
  const parsed = safeParseJSON<AnnotationCache>(window.localStorage.getItem(storageKey));
  if (!parsed) return {};
  return parsed;
};

const persistAnnotationCache = (storageKey: string, cache: AnnotationCache) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to persist annotations cache', error);
  }
};

const slugify = (value: string) =>
  removeDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const generateRoleId = (name: string, existing: RoleDefinition[]) => {
  const base = slugify(name) || `perfil-${Date.now()}`;
  let candidate = base;
  let suffix = 1;
  const existingIds = new Set(existing.map(role => role.id));
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};

const generateGoalProgramId = (name: string, existing: GoalProgram[]) => {
  const base = slugify(name) || `programa-${Date.now().toString(36)}`;
  let candidate = base;
  let suffix = 1;
  const existingIds = new Set(existing.map(program => program.id));
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};

const generateGoalId = (title: string, existing: Goal[]) => {
  const base = slugify(title) || `meta-${Date.now().toString(36)}`;
  let candidate = base;
  let suffix = 1;
  const existingIds = new Set(existing.map(goal => goal.id));
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};

const generateGoalAssignmentId = (existing: GoalAssignment[]) => {
  let candidate = generateRandomId('goal-assignment');
  const existingIds = new Set(existing.map(assignment => assignment.id));
  while (existingIds.has(candidate)) {
    candidate = generateRandomId('goal-assignment');
  }
  return candidate;
};

const generateGoalCheckpointId = (existing: GoalCheckpoint[]) => {
  let candidate = generateRandomId('goal-checkpoint');
  const existingIds = new Set(existing.map(checkpoint => checkpoint.id));
  while (existingIds.has(candidate)) {
    candidate = generateRandomId('goal-checkpoint');
  }
  return candidate;
};

const generateGoalNotificationRuleId = (existing: GoalNotificationRule[]) => {
  let candidate = generateRandomId('goal-notification');
  const existingIds = new Set(existing.map(rule => rule.id));
  while (existingIds.has(candidate)) {
    candidate = generateRandomId('goal-notification');
  }
  return candidate;
};

const formatDateForApi = (value: string) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

const normalizeKanbanColumn = (value: any): KanbanColumn => {
  const normalized = removeDiacritics(ensureString(value)).toLowerCase();
  const map: Record<string, KanbanColumn> = {
    'prospeccao': KanbanColumn.Prospeccao,
    'prospecao': KanbanColumn.Prospeccao,
    'prospecção': KanbanColumn.Prospeccao,
    'backlog': KanbanColumn.Prospeccao,
    'analise de documentos': KanbanColumn.AnaliseDocumentos,
    'análise de documentos': KanbanColumn.AnaliseDocumentos,
    'em progresso': KanbanColumn.AnaliseDocumentos,
    'elaboracao da peticao': KanbanColumn.ElaboracaoPeticao,
    'elaboração da petição': KanbanColumn.ElaboracaoPeticao,
    'revisao': KanbanColumn.ElaboracaoPeticao,
    'revisão': KanbanColumn.ElaboracaoPeticao,
    'aguardando julgamento': KanbanColumn.AguardandoJulgamento,
    'finalizados': KanbanColumn.Finalizados,
  };
  return map[normalized] ?? KanbanColumn.Prospeccao;
};

const normalizeKanbanPhase = (value: any): KanbanPhase => {
  const normalized = ensureString(value, KanbanPhase.Judicial).toLowerCase();
  return normalized === KanbanPhase.Extrajudicial.toLowerCase()
    ? KanbanPhase.Extrajudicial
    : KanbanPhase.Judicial;
};

const normalizeGoalVisibility = (value: any): GoalVisibility => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === 'team') return 'team';
  if (normalized === 'individual') return 'individual';
  return 'global';
};

const normalizeGoalProgramType = (value: any): GoalProgramType => {
  const normalized = ensureString(value).toLowerCase();
  switch (normalized) {
    case 'financeiro':
      return 'Financeiro';
    case 'producao':
    case 'produção':
    case 'operacional':
      return 'Produção';
    case 'relacionamento':
    case 'crm':
      return 'Relacionamento';
    case 'marketing':
      return 'Marketing';
    case 'qualidade':
      return 'Qualidade';
    default:
      return 'Financeiro';
  }
};

const normalizeGoalUnit = (value: any): GoalUnit => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === 'currency') return 'currency';
  if (normalized === 'percentage') return 'percentage';
  if (normalized === 'hours') return 'hours';
  return 'count';
};

const normalizeGoalPeriodicity = (value: any): GoalPeriodicity => {
  const normalized = ensureString(value).toLowerCase();
  const allowed: GoalPeriodicity[] = ['one-time', 'monthly', 'weekly', 'quarterly', 'annual'];
  return allowed.includes(normalized as GoalPeriodicity) ? (normalized as GoalPeriodicity) : 'one-time';
};

const normalizeGoalOwnerType = (value: any): GoalOwnerType => {
  const normalized = ensureString(value).toLowerCase();
  return normalized === 'user' ? 'user' : 'team';
};

const normalizeGoalOwnerId = (value: any): number | string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const str = ensureString(value);
  if (!str) return undefined;
  const numeric = Number(str);
  if (Number.isFinite(numeric) && str === String(numeric)) {
    return numeric;
  }
  return str;
};

const normalizeGoalMetricSource = (value: any): GoalMetricSourceType => {
  const normalized = ensureString(value).toLowerCase();
  const allowed: GoalMetricSourceType[] = ['manual', 'tasks', 'lawsuits', 'transactions', 'contacts'];
  return allowed.includes(normalized as GoalMetricSourceType)
    ? (normalized as GoalMetricSourceType)
    : 'manual';
};

const normalizeGoalAggregation = (value: any): GoalAggregation => {
  const normalized = ensureString(value).toLowerCase();
  const allowed: GoalAggregation[] = ['sum', 'count', 'average', 'percent'];
  return allowed.includes(normalized as GoalAggregation)
    ? (normalized as GoalAggregation)
    : 'count';
};

const normalizeGoalStatus = (value: any): GoalStatus => {
  const normalized = ensureString(value).toLowerCase();
  switch (normalized) {
    case 'achieved':
      return 'achieved';
    case 'ontrack':
    case 'on_track':
    case 'on-track':
      return 'onTrack';
    case 'critical':
      return 'critical';
    default:
      return 'attention';
  }
};

const normalizeCheckpointFrequency = (
  value: any
): Goal['checkpointFrequency'] => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === 'weekly' || normalized === 'monthly' || normalized === 'quarterly') {
    return normalized as Goal['checkpointFrequency'];
  }
  return undefined;
};

const normalizeNotificationChannels = (
  raw: any
): Array<'inApp' | 'email' | 'slack'> | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const channels = raw
    .map((channel: any) => ensureString(channel).toLowerCase())
    .map(channel => {
      if (channel === 'inapp' || channel === 'in-app' || channel === 'app') return 'inApp';
      if (channel === 'email') return 'email';
      if (channel === 'slack') return 'slack';
      return null;
    })
    .filter(Boolean) as Array<'inApp' | 'email' | 'slack'>;
  return channels.length > 0 ? channels : undefined;
};

const normalizeGoalNotificationTriggerValue = (
  value: any
): GoalNotificationTrigger => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === 'warning') return 'warning';
  if (normalized === 'critical') return 'critical';
  if (normalized === 'achieved') return 'achieved';
  return 'checkpoint';
};

const normalizeGoalAssignmentScope = (
  value: any
): GoalAssignment['scope'] => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === 'collaborator') return 'collaborator';
  if (normalized === 'observer') return 'observer';
  return 'responsible';
};

const matchesOwnerFilter = (
  value: number | undefined,
  allowed?: Array<number | string>
) => {
  if (!allowed || allowed.length === 0) return true;
  if (value === undefined || value === null) return false;
  return allowed.some(item => {
    if (typeof item === 'number' && Number.isFinite(item)) {
      return item === value;
    }
    const normalized = ensureString(item);
    if (!normalized) return false;
    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return numeric === value;
    }
    return normalized === String(value);
  });
};

const matchesStringFilter = (value: string | undefined, allowed?: string[]) => {
  if (!allowed || allowed.length === 0) return true;
  if (!value) return false;
  return allowed.some(item => ensureString(item).toLowerCase() === value.toLowerCase());
};

const isWithinDateRange = (
  dateISO: string | undefined,
  range?: { from?: string; to?: string }
) => {
  if (!range || (!range.from && !range.to)) return true;
  if (!dateISO) return false;
  const parsedDate = dayjs(dateISO);
  if (!parsedDate.isValid()) return false;
  if (range.from) {
    const fromDate = dayjs(range.from);
    if (fromDate.isValid() && parsedDate.isBefore(fromDate, 'day')) {
      return false;
    }
  }
  if (range.to) {
    const toDate = dayjs(range.to);
    if (toDate.isValid() && parsedDate.isAfter(toDate, 'day')) {
      return false;
    }
  }
  return true;
};
const mapUserFromApi = (raw: any): User => {
  const name = ensureString(raw?.name, 'Usuário');
  const role = raw?.role;
  const roleId = optionalString(raw?.roleId ?? raw?.role_id ?? role?.id);
  const roleName = optionalString(raw?.roleName ?? raw?.role_name ?? role?.name);
  return {
    id: ensureNumber(raw?.id),
    name,
    avatar: ensureString(raw?.avatar, avatarFallback(name)),
    email: ensureString(raw?.email),
    jobTitle: optionalString(raw?.jobTitle ?? raw?.job_title),
    personalEmail: optionalString(raw?.personalEmail ?? raw?.personal_email),
    phone: optionalString(raw?.phone),
    secondaryPhone: optionalString(raw?.secondaryPhone ?? raw?.secondary_phone),
    whatsapp: optionalString(raw?.whatsapp),
    address: optionalString(raw?.address),
    city: optionalString(raw?.city),
    state: optionalString(raw?.state),
    postalCode: optionalString(raw?.postalCode ?? raw?.postal_code),
    birthdate: optionalString(raw?.birthdate),
    linkedinUrl: optionalString(raw?.linkedinUrl ?? raw?.linkedin_url),
    instagramUrl: optionalString(raw?.instagramUrl ?? raw?.instagram_url),
    bio: optionalString(raw?.bio),
    roleId: roleId ?? undefined,
    roleName: roleName ?? undefined,
  };
};

const mapContactFromApi = (raw: any): Contact => ({
  id: ensureNumber(raw?.id),
  name: ensureString(raw?.name),
  document: ensureString(raw?.document),
  origin: ensureString(raw?.origin),
  status: ensureString(raw?.status),
  ownerId: ensureNumber(raw?.ownerId ?? raw?.owner_id),
  lastInteraction: ensureString(raw?.lastInteraction ?? raw?.last_interaction),
  email: ensureString(raw?.email),
  phone: ensureString(raw?.phone),
  profession: ensureString(raw?.profession),
  categoryId: optionalString(raw?.categoryId ?? raw?.category_id),
  leadCategoryId: optionalString(raw?.leadCategoryId ?? raw?.lead_category_id),
  notes: optionalString(raw?.notes),
  mentions: mapMentionsFromApi(raw?.mentions),
});

const mapLawsuitFromApi = (raw: any): Lawsuit => ({
  id: ensureNumber(raw?.id),
  internalNumber: ensureString(raw?.internalNumber ?? raw?.internal_number),
  clientId: ensureNumber(raw?.clientId ?? raw?.client_id),
  responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
  area: ensureString(raw?.area, 'Cível') as Lawsuit['area'],
  phase: ensureString(raw?.phase),
  deadline: ensureString(raw?.deadline ?? raw?.deadline_at),
  status: ensureString(raw?.status, 'Ativo') as Lawsuit['status'],
  kanbanColumn: normalizeKanbanColumn(raw?.kanbanColumn ?? raw?.kanban_column),
  kanbanPhase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
  notes: optionalString(raw?.notes),
  mentions: mapMentionsFromApi(raw?.mentions),
});

const mapTaskFromApi = (raw: any): Task => ({
  id: ensureNumber(raw?.id),
  title: ensureString(raw?.title),
  status: ensureString(raw?.status, TaskStatus.Pendente) as TaskStatus,
  dueDate: ensureString(raw?.dueDate ?? raw?.due_date ?? raw?.deadline),
  deadline: ensureString(raw?.deadline ?? raw?.due_date ?? raw?.dueDate),
  responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
  lawsuitId: ensureOptionalNumber(raw?.lawsuitId ?? raw?.lawsuit_id),
  clientId: ensureOptionalNumber(raw?.clientId ?? raw?.client_id),
  score: ensureNumber(raw?.score),
  categoryId: optionalString(raw?.categoryId ?? raw?.category_id),
  notes: optionalString(raw?.notes),
  mentions: mapMentionsFromApi(raw?.mentions),
});

const mapCalendarEventFromApi = (raw: any): CalendarEvent => ({
  id: ensureNumber(raw?.id),
  title: ensureString(raw?.title),
  start: ensureString(raw?.start),
  end: ensureString(raw?.end ?? raw?.start),
  color: ensureString(raw?.color, '#3B82F6'),
});

const mapTransactionFromApi = (raw: any): Transaction => ({
  id: ensureNumber(raw?.id),
  date: ensureString(raw?.date),
  description: ensureString(raw?.description),
  category: ensureString(raw?.category),
  account: ensureString(raw?.account),
  value: Number.parseFloat(String(raw?.value ?? 0)) || 0,
  type: ensureString(raw?.type, TransactionType.Despesa) as TransactionType,
  categoryId: optionalString(raw?.categoryId ?? raw?.category_id),
});

const mapKanbanCardFromLawsuit = (raw: any): KanbanCard => {
  const column = normalizeKanbanColumn(raw?.kanbanColumn ?? raw?.kanban_column);
  const deadline = ensureString(raw?.deadline ?? raw?.deadline_at);
  const description = ensureString(raw?.description ?? raw?.notes);
  return {
    id: `lawsuit-${ensureNumber(raw?.id)}`,
    title: ensureString(
      raw?.title ??
        raw?.internalNumber ??
        raw?.internal_number ??
        `Processo #${ensureNumber(raw?.id)}`
    ),
    description: description || undefined,
    column,
    phase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
    area: ensureString(raw?.area, 'Não definido') as KanbanCard['area'],
    responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
    deadline: deadline || undefined,
    hasAttachments: Boolean(raw?.hasAttachments ?? raw?.has_attachments ?? false),
    commentsCount: ensureNumber(raw?.commentsCount ?? raw?.comments_count, 0),
    hasReminder: Boolean(raw?.hasReminder ?? raw?.has_reminder ?? false),
    isDelayed: deadline ? dayjs(deadline).isBefore(dayjs(), 'day') : false,
  };
};

const mapKanbanCardFromMock = (raw: any): KanbanCard => ({
  id: ensureString(raw?.id),
  title: ensureString(raw?.title),
  description: ensureString(raw?.description) || undefined,
  column: raw?.column ?? KanbanColumn.Prospeccao,
  phase: raw?.phase ?? KanbanPhase.Judicial,
  area: raw?.area ?? 'Não definido',
  responsibleId: ensureNumber(raw?.responsibleId),
  deadline: ensureString(raw?.deadline) || undefined,
  hasAttachments: Boolean(raw?.hasAttachments),
  commentsCount: ensureNumber(raw?.commentsCount, 0),
  hasReminder: Boolean(raw?.hasReminder),
  isDelayed: Boolean(raw?.isDelayed),
});

const extractLawsuitIdFromCard = (cardId: string): number | null => {
  if (!cardId) return null;
  if (cardId.startsWith('lawsuit-')) {
    const parsed = Number(cardId.replace('lawsuit-', ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numeric = Number(cardId);
  return Number.isFinite(numeric) ? numeric : null;
};

const mapStringArray = (raw: any): string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const values = raw
    .map((item: any) => ensureString(item))
    .filter(value => value.length > 0);
  return values.length > 0 ? values : undefined;
};

const mapGoalMetricFiltersFromApi = (
  raw: any
): Goal['metric']['filters'] | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const filters: Goal['metric']['filters'] = {};
  const responsibleIds =
    raw.responsibleIds ?? raw.responsible_ids ?? raw.responsible_id;
  if (Array.isArray(responsibleIds)) {
    filters.responsibleIds = responsibleIds
      .map((item: any) => ensureNumber(item))
      .filter((value: number) => Number.isFinite(value));
  }
  const ownersRaw = raw.owners ?? raw.ownerIds ?? raw.owner_ids;
  if (Array.isArray(ownersRaw)) {
    const ownerIds = ownersRaw
      .map((item: any) => ensureNumber(item, Number.NaN))
      .filter(value => Number.isFinite(value));
    if (ownerIds.length > 0) {
      filters.owners = ownerIds;
    }
  }
  const areasRaw = raw.areas ?? raw.area;
  const areas = mapStringArray(areasRaw);
  if (areas) {
    filters.areas = areas;
  }
  const taskStatusRaw = raw.taskStatus ?? raw.task_status;
  if (Array.isArray(taskStatusRaw)) {
    filters.taskStatus = taskStatusRaw
      .map((item: any) => ensureString(item))
      .filter(value => value.length > 0) as TaskStatus[];
  }
  const transactionTypesRaw = raw.transactionTypes ?? raw.transaction_types;
  if (Array.isArray(transactionTypesRaw)) {
    filters.transactionTypes = transactionTypesRaw
      .map((item: any) => ensureString(item))
      .filter(value => value.length > 0) as TransactionType[];
  }
  const contactStatusRaw = raw.contactStatus ?? raw.contact_status;
  const contactStatus = mapStringArray(contactStatusRaw);
  if (contactStatus) {
    filters.contactStatus = contactStatus;
  }
  const tagsRaw = raw.tags ?? raw.tagIds ?? raw.tag_ids;
  const tags = mapStringArray(tagsRaw);
  if (tags) {
    filters.tags = tags;
  }
  const lawsuitStatusRaw = raw.lawsuitStatus ?? raw.lawsuit_status;
  if (Array.isArray(lawsuitStatusRaw)) {
    filters.lawsuitStatus = lawsuitStatusRaw
      .map((item: any) => ensureString(item))
      .filter(value => value.length > 0) as Lawsuit['status'][];
  }
  const dateRangeRaw = raw.dateRange ?? raw.date_range;
  if (dateRangeRaw && (dateRangeRaw.from || dateRangeRaw.to)) {
    const from = optionalString(dateRangeRaw.from);
    const to = optionalString(dateRangeRaw.to);
    if (from || to) {
      filters.dateRange = { from: from ?? undefined, to: to ?? undefined };
    }
  }
  return Object.keys(filters).length > 0 ? filters : undefined;
};

const mapGoalMetricFromApi = (raw: any): Goal['metric'] => ({
  source: normalizeGoalMetricSource(raw?.source),
  aggregation: normalizeGoalAggregation(raw?.aggregation),
  unit: raw?.unit ? normalizeGoalUnit(raw.unit) : undefined,
  field: raw?.field === 'value' ? 'value' : raw?.field === 'score' ? 'score' : undefined,
  filters: mapGoalMetricFiltersFromApi(raw?.filters),
});

const mapGoalThresholdsFromApi = (raw: any): Goal['thresholds'] => {
  const success = ensureNumber(
    raw?.success ?? raw?.successRatio ?? raw?.success_ratio,
    1
  );
  const warning = ensureNumber(
    raw?.warning ?? raw?.warningRatio ?? raw?.warning_ratio,
    0.75
  );
  const criticalValue = ensureOptionalNumber(
    raw?.critical ?? raw?.criticalRatio ?? raw?.critical_ratio
  );
  const thresholds: Goal['thresholds'] = {
    success,
    warning,
    critical: criticalValue ?? undefined,
    successLabel: optionalString(raw?.successLabel ?? raw?.success_label),
    warningLabel: optionalString(raw?.warningLabel ?? raw?.warning_label),
    criticalLabel: optionalString(raw?.criticalLabel ?? raw?.critical_label),
  };
  if (!thresholds.critical) {
    delete thresholds.critical;
  }
  if (!thresholds.successLabel) {
    delete thresholds.successLabel;
  }
  if (!thresholds.warningLabel) {
    delete thresholds.warningLabel;
  }
  if (!thresholds.criticalLabel) {
    delete thresholds.criticalLabel;
  }
  return thresholds;
};

const mapGoalNotificationSettingsFromApi = (raw: any): Goal['notificationSettings'] | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const reminderFrequency = normalizeCheckpointFrequency(
    raw.reminderFrequency ?? raw.reminder_frequency
  );
  const channels = normalizeNotificationChannels(raw.channels);
  const beforeDeadlineDays = ensureOptionalNumber(
    raw.beforeDeadlineDays ?? raw.before_deadline_days
  );
  const mentionAssignees =
    raw.mentionAssignees ?? raw.mention_assignees ?? raw.notify_assignees;
  const settings: Goal['notificationSettings'] = {};
  if (reminderFrequency) {
    settings.reminderFrequency = reminderFrequency;
  }
  if (channels) {
    settings.channels = channels;
  }
  if (Number.isFinite(beforeDeadlineDays ?? NaN)) {
    settings.beforeDeadlineDays = beforeDeadlineDays ?? undefined;
  }
  if (mentionAssignees !== undefined) {
    settings.mentionAssignees = Boolean(mentionAssignees);
  }
  return Object.keys(settings).length > 0 ? settings : undefined;
};

const mapGoalProgramFromApi = (raw: any): GoalProgram => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  name: ensureString(raw?.name, 'Programa de metas'),
  description: optionalString(raw?.description),
  type: normalizeGoalProgramType(raw?.type),
  icon: undefined,
  color: optionalString(raw?.color),
  startDate: ensureString(
    raw?.startDate ?? raw?.start_date ?? dayjs().startOf('year').format('YYYY-MM-DD')
  ),
  endDate: ensureString(
    raw?.endDate ?? raw?.end_date ?? dayjs().endOf('year').format('YYYY-MM-DD')
  ),
  visibility: normalizeGoalVisibility(raw?.visibility),
  ownerTeamId: optionalString(raw?.ownerTeamId ?? raw?.owner_team_id),
  tags: mapStringArray(raw?.tags),
});

const mapGoalFromApi = (raw: any): Goal => {
  const metric = mapGoalMetricFromApi(raw?.metric ?? raw);
  const thresholds = mapGoalThresholdsFromApi(raw?.thresholds ?? raw);
  return {
    id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
    programId: ensureString(raw?.programId ?? raw?.program_id),
    title: ensureString(raw?.title, 'Meta'),
    description: optionalString(raw?.description),
    ownerType: normalizeGoalOwnerType(raw?.ownerType ?? raw?.owner_type),
    ownerId: normalizeGoalOwnerId(raw?.ownerId ?? raw?.owner_id),
    periodicity: normalizeGoalPeriodicity(raw?.periodicity ?? raw?.period),
    startDate: ensureString(
      raw?.startDate ?? raw?.start_date ?? dayjs().format('YYYY-MM-DD')
    ),
    endDate: ensureString(
      raw?.endDate ?? raw?.end_date ?? dayjs().add(1, 'month').format('YYYY-MM-DD')
    ),
    unit: raw?.unit ? normalizeGoalUnit(raw.unit) : metric.unit ?? 'count',
    baseline: ensureOptionalNumber(raw?.baseline),
    targetValue: ensureNumber(raw?.targetValue ?? raw?.target_value, 0),
    currentValue: ensureNumber(raw?.currentValue ?? raw?.current_value, 0),
    autoUpdate: Boolean(raw?.autoUpdate ?? raw?.auto_update ?? true),
    metric,
    thresholds,
    status: normalizeGoalStatus(raw?.status),
    lastUpdated: ensureString(
      raw?.lastUpdated ?? raw?.last_updated ?? new Date().toISOString()
    ),
    tags: mapStringArray(raw?.tags),
    checkpointFrequency: normalizeCheckpointFrequency(
      raw?.checkpointFrequency ?? raw?.checkpoint_frequency
    ),
    displayOrder: ensureOptionalNumber(raw?.displayOrder ?? raw?.display_order),
    notificationSettings: mapGoalNotificationSettingsFromApi(
      raw?.notificationSettings ?? raw?.notification_settings
    ),
    motivationMessage: optionalString(raw?.motivationMessage ?? raw?.motivation_message),
  };
};

const mapGoalAssignmentFromApi = (raw: any): GoalAssignment => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  goalId: ensureString(raw?.goalId ?? raw?.goal_id),
  assigneeType: normalizeGoalOwnerType(raw?.assigneeType ?? raw?.assignee_type),
  assigneeId: normalizeGoalOwnerId(raw?.assigneeId ?? raw?.assignee_id) ?? '',
  scope: normalizeGoalAssignmentScope(raw?.scope),
  weight: ensureOptionalNumber(raw?.weight),
});

const mapGoalCheckpointFromApi = (raw: any): GoalCheckpoint => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  goalId: ensureString(raw?.goalId ?? raw?.goal_id),
  periodStart: ensureString(raw?.periodStart ?? raw?.period_start ?? raw?.period),
  periodEnd: optionalString(raw?.periodEnd ?? raw?.period_end),
  recordedAt: ensureString(raw?.recordedAt ?? raw?.recorded_at ?? new Date().toISOString()),
  value: ensureNumber(raw?.value, 0),
  notes: optionalString(raw?.notes),
  authorId: ensureOptionalNumber(raw?.authorId ?? raw?.author_id),
  delta: ensureOptionalNumber(raw?.delta),
});

const mapGoalNotificationRuleFromApi = (raw: any): GoalNotificationRule => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  goalId: ensureString(raw?.goalId ?? raw?.goal_id),
  trigger: normalizeGoalNotificationTriggerValue(raw?.trigger),
  channel: (normalizeNotificationChannels([raw?.channel])[0] ??
    'inApp') as GoalNotificationRule['channel'],
  message: optionalString(raw?.message),
  recipients: Array.isArray(raw?.recipients)
    ? raw.recipients
        .map((recipient: any) => {
          const type = normalizeGoalOwnerType(recipient?.type ?? recipient?.kind);
          const id = normalizeGoalOwnerId(recipient?.id ?? recipient?.targetId ?? recipient?.target_id);
          if (!id) return null;
          return { type, id };
        })
        .filter(
          (recipient): recipient is { type: GoalOwnerType; id: number | string } => recipient !== null
        )
    : [],
  repeat: Boolean(raw?.repeat ?? raw?.recurrent ?? false),
});

type GoalComputationContext = {
  tasks: Task[];
  transactions: Transaction[];
  contacts: Contact[];
  lawsuits: Lawsuit[];
  lawsuitsById: Map<number, Lawsuit>;
  checkpointsIndex: Map<string, GoalCheckpoint[]>;
};

const groupCheckpointsByGoal = (checkpoints: GoalCheckpoint[]): Map<string, GoalCheckpoint[]> => {
  const map = new Map<string, GoalCheckpoint[]>();
  checkpoints.forEach(checkpoint => {
    if (!checkpoint.goalId) return;
    const existing = map.get(checkpoint.goalId);
    if (existing) {
      existing.push(checkpoint);
    } else {
      map.set(checkpoint.goalId, [checkpoint]);
    }
  });
  return map;
};

const getLatestCheckpoint = (checkpoints: GoalCheckpoint[]): GoalCheckpoint | undefined => {
  if (checkpoints.length === 0) return undefined;
  return checkpoints.reduce<GoalCheckpoint | undefined>((latest, checkpoint) => {
    if (!latest) return checkpoint;
    const latestDate = dayjs(latest.recordedAt);
    const currentDate = dayjs(checkpoint.recordedAt);
    return currentDate.isAfter(latestDate) ? checkpoint : latest;
  }, undefined);
};

const computeTasksValue = (goal: Goal, context: GoalComputationContext): number => {
  const filters = goal.metric.filters;
  const tasksFiltered = context.tasks.filter(task => {
    if (filters?.responsibleIds?.length && !filters.responsibleIds.includes(task.responsibleId)) {
      return false;
    }
    if (filters?.taskStatus?.length && !filters.taskStatus.includes(task.status)) {
      return false;
    }
    if (filters?.tags?.length && task.categoryId) {
      if (!filters.tags.includes(task.categoryId)) return false;
    } else if (filters?.tags?.length && !task.categoryId) {
      return false;
    }
    if (filters?.areas?.length) {
      const lawsuit = task.lawsuitId ? context.lawsuitsById.get(task.lawsuitId) : undefined;
      const area = lawsuit?.area;
      if (!matchesStringFilter(area, filters.areas)) {
        return false;
      }
    }
    if (!isWithinDateRange(task.dueDate, filters?.dateRange)) {
      return false;
    }
    return true;
  });

  if (tasksFiltered.length === 0) {
    return 0;
  }

  if (goal.metric.aggregation === 'sum') {
    const field = goal.metric.field === 'value' ? 'score' : 'score';
    return tasksFiltered.reduce((total, task) => {
      const value = field === 'score' ? task.score ?? 0 : task.score ?? 0;
      return total + ensureNumber(value);
    }, 0);
  }

  if (goal.metric.aggregation === 'average') {
    const sum = tasksFiltered.reduce((total, task) => total + ensureNumber(task.score, 0), 0);
    return tasksFiltered.length > 0 ? sum / tasksFiltered.length : 0;
  }

  if (goal.metric.aggregation === 'percent') {
    const target = goal.targetValue > 0 ? goal.targetValue : tasksFiltered.length;
    return target > 0 ? (tasksFiltered.length / target) * 100 : 0;
  }

  return tasksFiltered.length;
};

const computeTransactionsValue = (goal: Goal, context: GoalComputationContext): number => {
  const filters = goal.metric.filters;
  const transactionsFiltered = context.transactions.filter(transaction => {
    if (
      filters?.transactionTypes?.length &&
      !filters.transactionTypes.includes(transaction.type)
    ) {
      return false;
    }
    if (filters?.tags?.length && transaction.categoryId) {
      if (!filters.tags.includes(transaction.categoryId)) return false;
    } else if (filters?.tags?.length && !transaction.categoryId) {
      return false;
    }
    if (!isWithinDateRange(transaction.date, filters?.dateRange)) {
      return false;
    }
    return true;
  });

  if (transactionsFiltered.length === 0) {
    return 0;
  }

  const sumValues = transactionsFiltered.reduce(
    (total, transaction) => total + ensureNumber(transaction.value, 0),
    0
  );

  if (goal.metric.aggregation === 'count') {
    return transactionsFiltered.length;
  }

  if (goal.metric.aggregation === 'average') {
    return transactionsFiltered.length > 0 ? sumValues / transactionsFiltered.length : 0;
  }

  if (goal.metric.aggregation === 'percent') {
    const target = goal.targetValue > 0 ? goal.targetValue : sumValues;
    return target > 0 ? (sumValues / target) * 100 : 0;
  }

  return sumValues;
};

const computeContactsValue = (goal: Goal, context: GoalComputationContext): number => {
  const filters = goal.metric.filters;
  const contactsFiltered = context.contacts.filter(contact => {
    if (filters?.contactStatus?.length && !filters.contactStatus.includes(contact.status)) {
      return false;
    }
    if (!matchesOwnerFilter(contact.ownerId, filters?.owners)) {
      return false;
    }
    if (filters?.tags?.length) {
      const contactTags = [contact.categoryId, contact.leadCategoryId].filter(Boolean) as string[];
      if (!contactTags.some(tag => filters.tags?.includes(tag))) {
        return false;
      }
    }
    if (!isWithinDateRange(contact.lastInteraction, filters?.dateRange)) {
      return false;
    }
    return true;
  });

  if (contactsFiltered.length === 0) {
    return 0;
  }

  if (goal.metric.aggregation === 'percent') {
    const target = goal.targetValue > 0 ? goal.targetValue : contactsFiltered.length;
    return target > 0 ? (contactsFiltered.length / target) * 100 : 0;
  }

  return contactsFiltered.length;
};

const computeLawsuitsValue = (goal: Goal, context: GoalComputationContext): number => {
  const filters = goal.metric.filters;
  const lawsuitsFiltered = context.lawsuits.filter(lawsuit => {
    if (filters?.lawsuitStatus?.length && !filters.lawsuitStatus.includes(lawsuit.status)) {
      return false;
    }
    if (filters?.areas?.length && !matchesStringFilter(lawsuit.area, filters.areas)) {
      return false;
    }
    if (!matchesOwnerFilter(lawsuit.responsibleId, filters?.owners ?? filters?.responsibleIds)) {
      return false;
    }
    if (!isWithinDateRange(lawsuit.deadline, filters?.dateRange)) {
      return false;
    }
    return true;
  });

  if (lawsuitsFiltered.length === 0) {
    return 0;
  }

  if (goal.metric.aggregation === 'percent') {
    const target = goal.targetValue > 0 ? goal.targetValue : lawsuitsFiltered.length;
    return target > 0 ? (lawsuitsFiltered.length / target) * 100 : 0;
  }

  return goal.metric.aggregation === 'sum'
    ? lawsuitsFiltered.length
    : lawsuitsFiltered.length;
};

const evaluateGoalStatus = (goal: Goal, value: number): GoalStatus => {
  const target = goal.targetValue;
  if (target <= 0) {
    return value > 0 ? 'achieved' : 'attention';
  }
  const ratio = value / target;
  const successThreshold = goal.thresholds.success ?? 1;
  const warningThreshold = goal.thresholds.warning ?? 0.8;
  const criticalThreshold =
    goal.thresholds.critical !== undefined
      ? goal.thresholds.critical
      : Math.min(warningThreshold * 0.7, warningThreshold - 0.1);

  if (ratio >= successThreshold) {
    return 'achieved';
  }
  if (ratio >= warningThreshold) {
    return 'onTrack';
  }
  if (ratio >= criticalThreshold) {
    return 'attention';
  }
  return 'critical';
};

const computeGoalSnapshot = (
  goal: Goal,
  context: GoalComputationContext
): { value: number; status: GoalStatus } => {
  const checkpoints = context.checkpointsIndex.get(goal.id) ?? [];
  let computedValue = goal.currentValue;

  if (goal.metric.source === 'manual') {
    const latestCheckpoint = getLatestCheckpoint(checkpoints);
    if (latestCheckpoint) {
      computedValue = ensureNumber(latestCheckpoint.value, computedValue);
    }
  }

  if (goal.autoUpdate) {
    switch (goal.metric.source) {
      case 'tasks':
        computedValue = computeTasksValue(goal, context);
        break;
      case 'transactions':
        computedValue = computeTransactionsValue(goal, context);
        break;
      case 'contacts':
        computedValue = computeContactsValue(goal, context);
        break;
      case 'lawsuits':
        computedValue = computeLawsuitsValue(goal, context);
        break;
      case 'manual':
      default:
        // manual goals already handled by checkpoints
        break;
    }
  }

  const status = evaluateGoalStatus(goal, computedValue);
  return { value: computedValue, status };
};

interface AppContextType {
  users: User[];
  contacts: Contact[];
  lawsuits: Lawsuit[];
  tasks: Task[];
  kanbanCards: KanbanCard[];
  calendarEvents: CalendarEvent[];
  transactions: Transaction[];
  goalPrograms: GoalProgram[];
  goals: Goal[];
  goalAssignments: GoalAssignment[];
  goalCheckpoints: GoalCheckpoint[];
  goalNotificationRules: GoalNotificationRule[];
  categoryGroups: CategoryGroup[];
  permissionsCatalog: PermissionDefinition[];
  userRoles: RoleDefinition[];
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  updateKanbanCardColumn: (cardId: string, newColumn: KanbanColumn, newPhase: KanbanPhase) => Promise<void>;
  updateKanbanCardDetails: (cardId: string, updates: Partial<Omit<KanbanCard, 'id'>>) => Promise<void>;
  updateTaskStatus: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  updateTask: (taskId: number, data: Partial<Omit<Task, 'id'>>) => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }) => Promise<void>;
  addKanbanCard: (cardData: Omit<KanbanCard, 'id'>) => Promise<void>;
  addContact: (contactData: {
    name: string;
    document: string;
    origin: string;
    status: string;
    ownerId: number;
    email: string;
    phone: string;
    profession: string;
    lastInteraction?: string;
    categoryId?: string;
    leadCategoryId?: string;
    notes?: string;
    mentions?: MentionReference[];
  }) => Promise<Contact>;
  createCollaborator: (data: {
    name: string;
    email: string;
    password: string;
    roleId?: string;
    avatar?: string;
  }) => Promise<User>;
  updateCollaborator: (
    userId: number,
    data: {
      name: string;
      email: string;
      password?: string;
      roleId?: string;
      avatar?: string;
    }
  ) => Promise<User>;
  deleteCollaborator: (userId: number) => Promise<void>;
  updateUserCache: (user: User) => void;
  addLawsuit: (data: {
    internalNumber: string;
    area: Lawsuit['area'];
    phase: string;
    deadline: string;
    status: Lawsuit['status'];
    clientId: number;
    responsibleId: number;
    kanbanColumn: string;
    kanbanPhase: string;
    notes?: string;
    mentions?: MentionReference[];
  }) => Promise<Lawsuit>;
  addTransaction: (data: {
    date: string;
    description: string;
    category: string;
    account: string;
    value: number;
    type: TransactionType;
    categoryId?: string;
  }) => Promise<Transaction>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (recipientId: number) => void;
  addCategory: (
    groupId: CategoryGroupType,
    data: { name: string; color?: string; description?: string }
  ) => CategoryItem | null;
  updateCategory: (
    groupId: CategoryGroupType,
    categoryId: string,
    updates: Partial<Omit<CategoryItem, 'id'>>
  ) => void;
  removeCategory: (groupId: CategoryGroupType, categoryId: string) => void;
  addUserRole: (data: {
    name: string;
    description?: string;
    color?: string;
    baseRoleId?: string;
    permissions?: Partial<Record<PermissionKey, boolean>>;
  }) => RoleDefinition | null;
  updateUserRole: (
    roleId: string,
    updates: Partial<Pick<RoleDefinition, 'name' | 'description' | 'color'>>
  ) => void;
  removeUserRole: (roleId: string) => void;
  setRolePermission: (roleId: string, permission: PermissionKey, enabled: boolean) => void;
  createGoalProgram: (program: Omit<GoalProgram, 'id'> & { id?: string }) => GoalProgram;
  updateGoalProgram: (programId: string, updates: Partial<Omit<GoalProgram, 'id'>>) => void;
  removeGoalProgram: (programId: string) => void;
  createGoal: (
    data: Omit<Goal, 'id' | 'lastUpdated' | 'status' | 'currentValue'> & {
      id?: string;
      currentValue?: number;
      status?: GoalStatus;
    }
  ) => Goal;
  updateGoal: (
    goalId: string,
    updates: Partial<Omit<Goal, 'id' | 'programId'>> & { programId?: string }
  ) => void;
  duplicateGoal: (goalId: string, overrides?: Partial<Omit<Goal, 'id'>>) => Goal | null;
  removeGoal: (goalId: string) => void;
  recordGoalCheckpoint: (
    goalId: string,
    checkpoint: Omit<GoalCheckpoint, 'id' | 'goalId'> & { id?: string }
  ) => GoalCheckpoint | null;
  updateGoalCheckpoint: (
    checkpointId: string,
    updates: Partial<Omit<GoalCheckpoint, 'id' | 'goalId'>>
  ) => void;
  removeGoalCheckpoint: (checkpointId: string) => void;
  addGoalAssignment: (
    assignment: Omit<GoalAssignment, 'id'> & { id?: string }
  ) => GoalAssignment | null;
  updateGoalAssignment: (
    assignmentId: string,
    updates: Partial<Omit<GoalAssignment, 'id' | 'goalId'>>
  ) => void;
  removeGoalAssignment: (assignmentId: string) => void;
  recalculateGoalProgress: (goalId?: string) => void;
  upsertGoalNotificationRule: (
    rule: Omit<GoalNotificationRule, 'id'> & { id?: string }
  ) => GoalNotificationRule;
  removeGoalNotificationRule: (ruleId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading: authLoading, logout, user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goalPrograms, setGoalPrograms] = useState<GoalProgram[]>(() => {
    const stored = loadStoredGoalPrograms();
    return stored ?? cloneGoalPrograms(GOAL_PROGRAMS);
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
    const stored = loadStoredGoals();
    return stored ?? cloneGoals(GOALS);
  });
  const [goalAssignments, setGoalAssignments] = useState<GoalAssignment[]>(() => {
    const stored = loadStoredGoalAssignments();
    return stored ?? cloneGoalAssignments(GOAL_ASSIGNMENTS);
  });
  const [goalCheckpoints, setGoalCheckpoints] = useState<GoalCheckpoint[]>(() => {
    const stored = loadStoredGoalCheckpoints();
    return stored ?? cloneGoalCheckpoints(GOAL_CHECKPOINTS);
  });
  const [goalNotificationRules, setGoalNotificationRules] = useState<GoalNotificationRule[]>(() => {
    const stored = loadStoredGoalNotifications();
    return stored ?? cloneGoalNotifications(GOAL_NOTIFICATIONS);
  });
  const goalUserProgressRef = useRef<Map<number, number>>(new Map());
  const goalUserRankRef = useRef<number[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(() => {
    const stored = loadStoredCategoryGroups();
    return stored ?? cloneCategoryGroups(CATEGORY_GROUPS);
  });
  const [userRoles, setUserRoles] = useState<RoleDefinition[]>(() => {
    const stored = loadStoredRoles();
    return stored ?? cloneRoles(USER_ROLES);
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const stored = loadStoredNotifications();
    if (stored && stored.length > 0) {
      return sortNotifications(stored);
    }
    return sortNotifications([...NOTIFICATIONS]);
  });
  const [taskAnnotations, setTaskAnnotations] = useState<AnnotationCache>(() =>
    loadAnnotationCache(TASK_NOTES_STORAGE_KEY)
  );
  const [contactAnnotations, setContactAnnotations] = useState<AnnotationCache>(() =>
    loadAnnotationCache(CONTACT_NOTES_STORAGE_KEY)
  );
  const [lawsuitAnnotations, setLawsuitAnnotations] = useState<AnnotationCache>(() =>
    loadAnnotationCache(LAWSUIT_NOTES_STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const permissionsCatalog = useMemo(
    () => PERMISSIONS.map(definition => ({ ...definition })),
    []
  );

  const taskAnnotationsRef = useRef(taskAnnotations);
  const tasksRef = useRef<Task[]>(tasks);
  const notificationsRef = useRef<NotificationItem[]>(notifications);
  const pollDelayRef = useRef<number>(10000);

  useEffect(() => {
    taskAnnotationsRef.current = taskAnnotations;
  }, [taskAnnotations]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const applyTasksPayload = useCallback(
    (rawTasks: unknown): boolean => {
      const baseTasks = toArray<any>(rawTasks).map(mapTaskFromApi);
      const annotatedTasks = baseTasks.map(task => {
        const overrides = taskAnnotationsRef.current[task.id];
        return overrides
          ? {
              ...task,
              notes: overrides.notes ?? task.notes,
              mentions: overrides.mentions ?? task.mentions,
            }
          : task;
      });
      const hasChanges = !tasksAreEqual(tasksRef.current, annotatedTasks);
      if (hasChanges) {
        setTasks(annotatedTasks);
        refreshAnnotationCache(
          setTaskAnnotations,
          TASK_NOTES_STORAGE_KEY,
          taskAnnotationsRef.current,
          annotatedTasks
        );
      }
      return hasChanges;
    },
    [setTaskAnnotations]
  );

  const updateNotificationsState = useCallback(
    (updater: (prev: NotificationItem[]) => NotificationItem[]) => {
      setNotifications(prev => {
        const next = sortNotifications(updater(prev));
        const limited = next.slice(0, 200);
        persistNotifications(limited);
        return limited;
      });
    },
    [setNotifications]
  );

  const applyNotificationsPayload = useCallback(
    (rawNotifications: unknown): boolean => {
      const list = toArray<any>(rawNotifications).map(mapNotificationFromApi);
      if (list.length === 0) {
        return false;
      }
      const normalized = sortNotifications(list);
      const hasChanges = !notificationsAreEqual(notificationsRef.current, normalized);
      if (hasChanges) {
        updateNotificationsState(() => normalized);
      }
      return hasChanges;
    },
    [updateNotificationsState]
  );

  const recalculateGoalsInternal = useCallback(
    (goalId?: string) => {
      const focusSet = goalId ? new Set([goalId]) : null;
      const checkpointsIndex = groupCheckpointsByGoal(goalCheckpoints);
      const lawsuitsById = new Map<number, Lawsuit>(lawsuits.map(lawsuit => [lawsuit.id, lawsuit]));
      const context: GoalComputationContext = {
        tasks,
        transactions,
        contacts,
        lawsuits,
        lawsuitsById,
        checkpointsIndex,
      };
      const achievedGoals: Goal[] = [];

      setGoals(prevGoals => {
        let changed = false;
        const nextGoals = prevGoals.map(goal => {
          const shouldRecalculate =
            !focusSet || focusSet.has(goal.id) || goal.autoUpdate || goal.metric.source === 'manual';

          if (!shouldRecalculate) {
            return goal;
          }

          const snapshot = computeGoalSnapshot(goal, context);
          const valueChanged = Math.abs(snapshot.value - goal.currentValue) > 0.0001;
          const statusChanged = snapshot.status !== goal.status;

          if (!valueChanged && !statusChanged) {
            return goal;
          }

          changed = true;
          const updated: Goal = {
            ...goal,
            currentValue: snapshot.value,
            status: snapshot.status,
            lastUpdated: new Date().toISOString(),
          };
          if (goal.status !== 'achieved' && updated.status === 'achieved') {
            achievedGoals.push(updated);
          }
          return updated;
        });

        if (changed) {
          persistGoals(nextGoals);
          return nextGoals;
        }
        return prevGoals;
      });

      if (achievedGoals.length > 0) {
        achievedGoals.forEach(notifyGoalAchievement);
      }
    },
    [goalCheckpoints, tasks, transactions, contacts, lawsuits]
  );

  const recalculateGoalProgress = useCallback(
    (goalId?: string) => {
      recalculateGoalsInternal(goalId);
    },
    [recalculateGoalsInternal]
  );

  const updateAnnotationCache = (
    setter: React.Dispatch<React.SetStateAction<AnnotationCache>>,
    storageKey: string,
    id: number,
    notes?: string,
    mentions?: MentionReference[]
  ) => {
    setter(prev => {
      const next: AnnotationCache = { ...prev };
      const sanitizedMentions = mentions?.filter(Boolean) ?? [];
      if ((!notes || notes.trim().length === 0) && sanitizedMentions.length === 0) {
        delete next[id];
      } else {
        next[id] = {
          notes: notes?.trim() || undefined,
          mentions: sanitizedMentions,
        };
      }
      persistAnnotationCache(storageKey, next);
      return next;
    });
  };

  const refreshAnnotationCache = (
    setter: React.Dispatch<React.SetStateAction<AnnotationCache>>,
    storageKey: string,
    currentCache: AnnotationCache,
    items: Array<{ id: number; notes?: string; mentions?: MentionReference[] }>
  ) => {
    const next: AnnotationCache = { ...currentCache };
    items.forEach(item => {
      const sanitizedNotes = item.notes?.trim() || '';
      const sanitizedMentions = item.mentions ?? [];
      if (!sanitizedNotes && sanitizedMentions.length === 0) {
        delete next[item.id];
      } else {
        next[item.id] = {
          notes: sanitizedNotes || undefined,
          mentions: sanitizedMentions,
        };
      }
    });
    persistAnnotationCache(storageKey, next);
    setter(next);
  };

  useEffect(() => {
    recalculateGoalsInternal();
  }, [recalculateGoalsInternal]);

  const markNotificationAsRead = (notificationId: string) => {
    updateNotificationsState(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllNotificationsAsRead = (recipientId: number) => {
    updateNotificationsState(prev =>
      prev.map(notification =>
        notification.recipientId === recipientId ? { ...notification, isRead: true } : notification
      )
    );
  };

  const createNotificationsForMentions = (
    mentions: MentionReference[] | undefined,
    entityType: NotificationEntityType,
    entityId: number,
    entityLabel: string
  ) => {
    if (!Array.isArray(mentions) || mentions.length === 0) return;
    const actorId = authUser?.id ?? null;
    const actorName = authUser?.name ?? 'Alguém';

    const uniqueUserMentions = new Map<number, MentionReference>();
    mentions.forEach(mention => {
      if (mention.kind !== 'user') return;
      if (mention.id <= 0) return;
      if (!uniqueUserMentions.has(mention.id)) {
        uniqueUserMentions.set(mention.id, mention);
      }
    });

    if (uniqueUserMentions.size === 0) return;

    const createdAt = new Date().toISOString();
    const contextLabel =
      entityType === 'task'
        ? `na tarefa "${entityLabel}"`
        : entityType === 'lawsuit'
          ? `no processo "${entityLabel}"`
          : `no contato "${entityLabel}"`;

    const newNotifications: NotificationItem[] = Array.from(uniqueUserMentions.values()).map(
      mention => ({
        id: generateNotificationId(),
        recipientId: mention.id,
        actorId: actorId ?? undefined,
        title: 'Você foi mencionado',
        message: `${actorName} mencionou você ${contextLabel}.`,
        createdAt,
        isRead: false,
        entityType,
        entityId,
      })
    );

    updateNotificationsState(prev => [...newNotifications, ...prev]);

    if (!isUsingMockApi) {
      newNotifications.forEach(notification => {
        apiClient
          .post('/notifications', {
            recipient_id: notification.recipientId,
            actor_id: notification.actorId,
            title: notification.title,
            message: notification.message,
            entity_type: notification.entityType,
            entity_id: notification.entityId,
            created_at: notification.createdAt,
          })
          .catch(error => {
            console.warn('Falha ao registrar notificação no backend', error);
          });
      });
    }
  };

  const ensureResponsibleMention = useCallback(
    (mentions: MentionReference[] | undefined, responsibleId?: number | null) => {
      if (!responsibleId) {
        return Array.isArray(mentions) ? [...mentions] : [];
      }

      const normalized = Array.isArray(mentions) ? [...mentions] : [];
      const alreadyMentioned = normalized.some(
        mention => mention.kind === 'user' && mention.id === responsibleId
      );
      if (alreadyMentioned) {
        return normalized;
      }

      const responsibleUser = users.find(user => user.id === responsibleId);
      if (!responsibleUser) {
        return normalized;
      }

      return [
        ...normalized,
        {
          id: responsibleUser.id,
          kind: 'user',
          label: responsibleUser.name,
        } as MentionReference,
      ];
    },
    [users]
  );

  const pushNotification = (
    recipientId: number | undefined,
    {
      title,
      message,
      entityId = 0,
      entityType = 'goal',
      actorId,
    }: {
      title: string;
      message: string;
      entityId?: number | string;
      entityType?: NotificationEntityType;
      actorId?: number | null;
    }
  ) => {
    if (!recipientId || recipientId <= 0) return;
    const createdAt = new Date().toISOString();
    const notification: NotificationItem = {
      id: generateNotificationId(),
      recipientId,
      actorId: actorId ?? undefined,
      title,
      message,
      createdAt,
      isRead: false,
      entityType,
      entityId,
    };
    updateNotificationsState(prev => [notification, ...prev]);

    if (!isUsingMockApi) {
      apiClient
        .post('/notifications', {
          recipient_id: recipientId,
          actor_id: actorId ?? null,
          title,
          message,
          entity_type: entityType,
          entity_id: entityId,
          created_at: createdAt,
        })
        .catch(error => {
          console.warn('Falha ao registrar notificação de metas', error);
        });
    }
  };

  const getGoalRecipientIds = (
    goal: Goal,
    assignments: GoalAssignment[],
    includeOwner = true
  ): number[] => {
    const recipients = new Set<number>();
    if (includeOwner && goal.ownerType === 'user' && typeof goal.ownerId === 'number') {
      recipients.add(goal.ownerId);
    }
    assignments.forEach(assignment => {
      if (assignment.goalId !== goal.id) return;
      if (assignment.assigneeType !== 'user') return;
      const numericId = Number(assignment.assigneeId);
      if (Number.isFinite(numericId)) {
        recipients.add(numericId);
      }
    });
    return Array.from(recipients);
  };

  const notifyGoalEvent = (
    goal: Goal,
    title: string,
    message: string,
    options?: { exclude?: Set<number>; actorId?: number | null }
  ) => {
    const exclude = options?.exclude ?? new Set<number>();
    const recipients = getGoalRecipientIds(goal, goalAssignments, true);
    const actorId = options?.actorId ?? authUser?.id ?? null;
    recipients.forEach(recipientId => {
      if (exclude.has(recipientId)) return;
      pushNotification(recipientId, {
        title,
        message,
        entityId: goal.id,
        entityType: 'goal',
        actorId,
      });
    });
    if (recipients.length === 0 && actorId && !exclude.has(actorId)) {
      pushNotification(actorId, {
        title,
        message,
        entityId: goal.id,
        entityType: 'goal',
        actorId,
      });
    }
  };

  const notifyGoalAchievement = (goal: Goal) => {
    const title = 'Meta concluída';
    const message = `A meta "${goal.title}" foi concluída com sucesso!`;
    const exclude = new Set<number>();
    if (authUser?.id) {
      exclude.add(authUser.id);
    }
    notifyGoalEvent(goal, title, message, { exclude });
  };

  const notifyGoalCreated = (goal: Goal) => {
    const title = 'Nova meta registrada';
    const message = `A meta "${goal.title}" foi criada.`;
    notifyGoalEvent(goal, title, message, { actorId: authUser?.id ?? null });
  };

  const notifyGoalUpdated = (goal: Goal) => {
    const title = 'Meta atualizada';
    const message = `A meta "${goal.title}" recebeu atualizações.`;
    notifyGoalEvent(goal, title, message, { actorId: authUser?.id ?? null });
  };

  const notifyGoalAssignmentAdded = (goal: Goal, assigneeId: number) => {
    if (!Number.isFinite(assigneeId)) return;
    if (authUser?.id && authUser.id === assigneeId) return;
    pushNotification(assigneeId, {
      title: 'Nova meta atribuída',
      message: `Você foi incluído na meta "${goal.title}".`,
      entityId: goal.id,
      entityType: 'goal',
      actorId: authUser?.id ?? null,
    });
    const actorId = authUser?.id ?? null;
    if (actorId) {
      pushNotification(actorId, {
        title: 'Colaborador adicionado',
        message: `Você adicionou um colaborador à meta "${goal.title}".`,
        entityId: goal.id,
        entityType: 'goal',
        actorId,
      });
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const resetState = () => {
      setUsers([]);
      setContacts([]);
      setLawsuits([]);
      setTasks([]);
      setKanbanCards([]);
      setCalendarEvents([]);
      setTransactions([]);
      const defaultNotifications = sortNotifications([...NOTIFICATIONS]);
      setNotifications(defaultNotifications);
      persistNotifications(defaultNotifications);
      setTaskAnnotations(loadAnnotationCache(TASK_NOTES_STORAGE_KEY));
      setContactAnnotations(loadAnnotationCache(CONTACT_NOTES_STORAGE_KEY));
      setLawsuitAnnotations(loadAnnotationCache(LAWSUIT_NOTES_STORAGE_KEY));
      setError(null);
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          usersRaw,
          contactsRaw,
          lawsuitsRaw,
          tasksRaw,
          calendarRaw,
          transactionsRaw,
          kanbanRaw,
          goalProgramsRaw,
          goalsRaw,
          goalAssignmentsRaw,
          goalCheckpointsRaw,
          goalNotificationsRaw,
        ] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/contacts'),
          apiClient.get('/lawsuits'),
          apiClient.get('/tasks'),
          apiClient.get('/calendar-events'),
          apiClient.get('/transactions'),
          isUsingMockApi ? apiClient.get('/kanban-cards') : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection('/goal-programs') : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection('/goals') : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection('/goal-assignments') : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection('/goal-checkpoints') : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection('/goal-notifications') : Promise.resolve(null),
        ]);

        if (isCancelled) return;

        const lawsuitsRawList = toArray<any>(lawsuitsRaw);
        const lawsuitsList = lawsuitsRawList.map(mapLawsuitFromApi);

        setUsers(toArray<any>(usersRaw).map(mapUserFromApi));
        applyTasksPayload(tasksRaw);
        setCalendarEvents(toArray<any>(calendarRaw).map(mapCalendarEventFromApi));
        setTransactions(toArray<any>(transactionsRaw).map(mapTransactionFromApi));
        setKanbanCards(
          isUsingMockApi
            ? toArray<any>(kanbanRaw).map(mapKanbanCardFromMock)
            : lawsuitsList.map(mapKanbanCardFromLawsuit)
        );
        const goalProgramsFromApi = toArray<any>(goalProgramsRaw).map(mapGoalProgramFromApi);
        const resolvedGoalPrograms =
          goalProgramsFromApi.length > 0
            ? cloneGoalPrograms(goalProgramsFromApi)
            : loadStoredGoalPrograms() ?? cloneGoalPrograms(GOAL_PROGRAMS);
        setGoalPrograms(resolvedGoalPrograms);
        persistGoalPrograms(resolvedGoalPrograms);

        const goalsFromApi = toArray<any>(goalsRaw).map(mapGoalFromApi);
        const resolvedGoals =
          goalsFromApi.length > 0
            ? cloneGoals(goalsFromApi)
            : loadStoredGoals() ?? cloneGoals(GOALS);
        setGoals(resolvedGoals);
        persistGoals(resolvedGoals);

        const goalAssignmentsFromApi = toArray<any>(goalAssignmentsRaw)
          .map(mapGoalAssignmentFromApi)
          .filter(assignment => {
            const assigneeId = assignment.assigneeId;
            const hasAssignee =
              assigneeId !== undefined &&
              assigneeId !== null &&
              String(assigneeId).trim().length > 0;
            return assignment.goalId && hasAssignee;
          });
        const resolvedGoalAssignments =
          goalAssignmentsFromApi.length > 0
            ? cloneGoalAssignments(goalAssignmentsFromApi)
            : loadStoredGoalAssignments() ?? cloneGoalAssignments(GOAL_ASSIGNMENTS);
        setGoalAssignments(resolvedGoalAssignments);
        persistGoalAssignments(resolvedGoalAssignments);

        const goalCheckpointsFromApi = toArray<any>(goalCheckpointsRaw).map(
          mapGoalCheckpointFromApi
        );
        const resolvedGoalCheckpoints =
          goalCheckpointsFromApi.length > 0
            ? cloneGoalCheckpoints(goalCheckpointsFromApi)
            : loadStoredGoalCheckpoints() ?? cloneGoalCheckpoints(GOAL_CHECKPOINTS);
        setGoalCheckpoints(resolvedGoalCheckpoints);
        persistGoalCheckpoints(resolvedGoalCheckpoints);

        const goalNotificationsFromApi = toArray<any>(goalNotificationsRaw).map(
          mapGoalNotificationRuleFromApi
        );
        const resolvedGoalNotifications =
          goalNotificationsFromApi.length > 0
            ? cloneGoalNotifications(goalNotificationsFromApi)
            : loadStoredGoalNotifications() ?? cloneGoalNotifications(GOAL_NOTIFICATIONS);
        setGoalNotificationRules(resolvedGoalNotifications);
        persistGoalNotifications(resolvedGoalNotifications);

        const lawsuitsWithNotes = lawsuitsList.map(lawsuit => {
          const overrides = lawsuitAnnotations[lawsuit.id];
          return overrides
            ? {
                ...lawsuit,
                notes: overrides.notes ?? lawsuit.notes,
                mentions: overrides.mentions ?? lawsuit.mentions,
              }
            : lawsuit;
        });
        setLawsuits(lawsuitsWithNotes);
        refreshAnnotationCache(
          setLawsuitAnnotations,
          LAWSUIT_NOTES_STORAGE_KEY,
          lawsuitAnnotations,
          lawsuitsWithNotes
        );
        const contactsList = toArray<any>(contactsRaw)
          .map(mapContactFromApi)
          .map(contact => {
            const overrides = contactAnnotations[contact.id];
            return overrides
              ? {
                  ...contact,
                  notes: overrides.notes ?? contact.notes,
                  mentions: overrides.mentions ?? contact.mentions,
                }
              : contact;
          });
        setContacts(contactsList);
        refreshAnnotationCache(
          setContactAnnotations,
          CONTACT_NOTES_STORAGE_KEY,
          contactAnnotations,
          contactsList
        );
        let notificationsPayload: any = null;
        if (isUsingMockApi) {
          notificationsPayload = NOTIFICATIONS;
        } else {
          try {
            notificationsPayload = await apiClient.get('/notifications');
          } catch (notifError) {
            if (!(notifError instanceof ApiError && notifError.status === 404)) {
              throw notifError;
            }
            notificationsPayload = null;
          }
        }

        const notificationsFromApi = toArray<any>(notificationsPayload).map(mapNotificationFromApi);
        const mergedNotifications =
          notificationsFromApi.length > 0
            ? notificationsFromApi
            : loadStoredNotifications() ?? [...NOTIFICATIONS];
        const sortedNotifications = sortNotifications(mergedNotifications);
        setNotifications(sortedNotifications);
        persistNotifications(sortedNotifications);
        setError(null);
      } catch (err) {
        console.error(err);
        if (err instanceof ApiError && (err.status === 401 || err.status === 419)) {
          await logout();
          if (!isCancelled) {
            resetState();
            setError('Sua sessão expirou. Faça login novamente.');
          }
        } else if (!isCancelled) {
          setError('Falha ao carregar os dados do servidor. Verifique sua conexão e autenticação.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (authLoading) {
      return () => {
        isCancelled = true;
      };
    }

    if (!isAuthenticated) {
      resetState();
      setLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, isAuthenticated, logout, applyTasksPayload]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || isUsingMockApi || !isBrowserEnvironment) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;
    const POLL_MIN = 10000;
    const POLL_MAX = 60000;
    const BACKOFF_FACTOR = 1.5;
    pollDelayRef.current = POLL_MIN;

    const scheduleNext = () => {
      if (cancelled) return;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(run, pollDelayRef.current);
    };

    const run = async () => {
      if (cancelled) {
        return;
      }

      let shouldResetDelay = false;

      try {
        const tasksPayload = await apiClient.get('/tasks');
        if (!cancelled) {
          const changed = applyTasksPayload(tasksPayload);
          if (changed) {
            shouldResetDelay = true;
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Falha ao sincronizar tarefas.', error);
          shouldResetDelay = true;
        }
      }

      if (!cancelled) {
        try {
          const notificationsPayload = await apiClient.get('/notifications');
          if (!cancelled) {
            const changed = applyNotificationsPayload(notificationsPayload);
            if (changed) {
              shouldResetDelay = true;
            }
          }
        } catch (error) {
          if (!cancelled) {
            const isNotFound = error instanceof ApiError && error.status === 404;
            if (!isNotFound) {
              console.warn('Falha ao sincronizar notificações.', error);
              shouldResetDelay = true;
            }
          }
        }
      }

      if (cancelled) {
        return;
      }

      pollDelayRef.current = shouldResetDelay
        ? POLL_MIN
        : Math.min(POLL_MAX, Math.round(pollDelayRef.current * BACKOFF_FACTOR));

      scheduleNext();
    };

    run();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    authLoading,
    isAuthenticated,
    isUsingMockApi,
    applyTasksPayload,
    applyNotificationsPayload,
  ]);

  const updateKanbanCardColumn = async (cardId: string, newColumn: KanbanColumn, newPhase: KanbanPhase) => {
    const lawsuitId = extractLawsuitIdFromCard(cardId);
    try {
      if (!isUsingMockApi && lawsuitId) {
        await apiClient.put(`/lawsuits/${lawsuitId}/kanban`, {
          kanban_column: newColumn,
          kanban_phase: newPhase,
        });
      }
      setKanbanCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, column: newColumn, phase: newPhase } : card
        )
      );
      if (lawsuitId) {
        setLawsuits(prev =>
          prev.map(lawsuit =>
            lawsuit.id === lawsuitId
              ? { ...lawsuit, kanbanColumn: newColumn, kanbanPhase: newPhase }
              : lawsuit
          )
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar o card no backend.');
      throw err;
    }
  };

  const updateKanbanCardDetails = async (cardId: string, updates: Partial<Omit<KanbanCard, 'id'>>) => {
    const lawsuitId = extractLawsuitIdFromCard(cardId);
    const hasDeadlineUpdate = Object.prototype.hasOwnProperty.call(updates, 'deadline');
    try {
      if (!isUsingMockApi && lawsuitId) {
        const payload: Record<string, any> = {};

        if (Object.prototype.hasOwnProperty.call(updates, 'responsibleId')) {
          payload.responsible_id = updates.responsibleId ?? null;
        }
        if (updates.area && updates.area !== 'Não definido') {
          payload.area = updates.area;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'title') && updates.title) {
          payload.internal_number = updates.title;
        }
        if (hasDeadlineUpdate) {
          payload.deadline = updates.deadline ? formatDateForApi(updates.deadline) : null;
        }

        if (Object.keys(payload).length > 0) {
          const response = await apiClient.put(`/lawsuits/${lawsuitId}`, payload);
          const mappedLawsuit = mapLawsuitFromApi(response);
          const mappedCard = mapKanbanCardFromLawsuit(mappedLawsuit);

          setLawsuits(prev =>
            prev.map(lawsuit => (lawsuit.id === lawsuitId ? mappedLawsuit : lawsuit))
          );

          setKanbanCards(prev =>
            prev.map(card =>
              card.id === cardId
                ? {
                    ...mappedCard,
                    title: updates.title ?? mappedCard.title,
                    description: updates.description ?? mappedCard.description,
                    area: updates.area ?? mappedCard.area,
                    responsibleId: updates.responsibleId ?? mappedCard.responsibleId,
                    hasAttachments: updates.hasAttachments ?? mappedCard.hasAttachments,
                    hasReminder: updates.hasReminder ?? mappedCard.hasReminder,
                    commentsCount: updates.commentsCount ?? mappedCard.commentsCount,
                    isDelayed: updates.isDelayed ?? mappedCard.isDelayed,
                    deadline: hasDeadlineUpdate ? updates.deadline ?? undefined : mappedCard.deadline,
                  }
                : card
            )
          );
        } else {
          setKanbanCards(prev =>
            prev.map(card =>
              card.id === cardId
                ? {
                    ...card,
                    ...updates,
                  }
                : card
            )
          );
        }
      } else {
        setKanbanCards(prev =>
          prev.map(card =>
            card.id === cardId
              ? {
                  ...card,
                  ...updates,
                }
              : card
          )
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar os detalhes do card.');
      throw err;
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      let updatedTask: Task | null = null;
      if (!isUsingMockApi) {
        const response = await apiClient.put(`/tasks/${taskId}/status`, { status: newStatus });
        if (response) {
          updatedTask = mapTaskFromApi(response);
        }
      }
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? (updatedTask ?? { ...task, status: newStatus }) : task
        )
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar o status da tarefa no backend.');
      throw err;
    }
  };

  const updateTask = async (taskId: number, data: Partial<Omit<Task, 'id'>>) => {
    const previousTask = tasks.find(task => task.id === taskId);
    try {
      if (isUsingMockApi) {
        setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, ...data } : task)));
        updateAnnotationCache(
          setTaskAnnotations,
          TASK_NOTES_STORAGE_KEY,
          taskId,
          data.notes ?? previousTask?.notes,
          data.mentions ?? previousTask?.mentions
        );
        if (data.mentions && previousTask) {
          const previousSet = new Set(
            (previousTask.mentions ?? [])
              .filter(mention => mention.kind === 'user')
              .map(mention => mention.id)
          );
          const newMentions = (data.mentions ?? []).filter(
            mention => mention.kind === 'user' && !previousSet.has(mention.id)
          );
          if (newMentions.length > 0) {
            createNotificationsForMentions(newMentions, 'task', previousTask.id, previousTask.title);
          }
        }
        return;
      }

      const payload: Record<string, any> = {};
      if (Object.prototype.hasOwnProperty.call(data, 'title')) {
        payload.title = data.title;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        payload.status = data.status;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'score')) {
        payload.score = data.score;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
        const dueDate = data.dueDate;
        payload.due_date = dueDate ? formatDateForApi(dueDate) : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'deadline')) {
        const deadline = data.deadline;
        payload.deadline = deadline ? formatDateForApi(deadline) : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'responsibleId')) {
        payload.responsible_id = data.responsibleId;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'lawsuitId')) {
        payload.lawsuit_id = data.lawsuitId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'clientId')) {
        payload.client_id = data.clientId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'categoryId')) {
        payload.category_id = data.categoryId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'notes')) {
        payload.notes = data.notes ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'mentions')) {
        payload.mentions = (data.mentions ?? []).map(mention => ({
          id: mention.id,
          kind: mention.kind,
        }));
      }

      const response = await apiClient.put(`/tasks/${taskId}`, payload);
      const mapped = mapTaskFromApi(response);
      const enriched: Task = {
        ...mapped,
        notes: Object.prototype.hasOwnProperty.call(data, 'notes') ? data.notes : mapped.notes,
        mentions: data.mentions ?? mapped.mentions ?? [],
      };
      setTasks(prev => prev.map(task => (task.id === taskId ? enriched : task)));
      if (previousTask) {
        const previousSet = new Set(
          (previousTask.mentions ?? [])
            .filter(mention => mention.kind === 'user')
            .map(mention => mention.id)
        );
        const newMentions = (enriched.mentions ?? []).filter(
          mention => mention.kind === 'user' && !previousSet.has(mention.id)
        );
        if (newMentions.length > 0) {
          createNotificationsForMentions(newMentions, 'task', enriched.id, enriched.title);
        }
      }
      updateAnnotationCache(
        setTaskAnnotations,
        TASK_NOTES_STORAGE_KEY,
        enriched.id,
        enriched.notes,
        enriched.mentions
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar a tarefa.');
      throw err;
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }) => {
    const computedStatus = taskData.status
      ? taskData.status
      : dayjs(taskData.deadline).isBefore(dayjs(), 'day')
        ? TaskStatus.Atrasada
        : TaskStatus.Pendente;

    try {
      const mentionsWithResponsible = ensureResponsibleMention(
        taskData.mentions,
        taskData.responsibleId
      );
      if (isUsingMockApi) {
        const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
        const newTask: Task = {
          ...taskData,
          id: newId,
          status: computedStatus,
          notes: taskData.notes,
          mentions: mentionsWithResponsible,
        };
        setTasks(prev => [...prev, newTask]);
        createNotificationsForMentions(newTask.mentions, 'task', newId, newTask.title);
        updateAnnotationCache(
          setTaskAnnotations,
          TASK_NOTES_STORAGE_KEY,
          newId,
          newTask.notes,
          newTask.mentions
        );
        return;
      }

      const payload = {
        title: taskData.title,
        score: taskData.score,
        responsible_id: taskData.responsibleId,
        lawsuit_id: taskData.lawsuitId,
        client_id: taskData.clientId,
        due_date: formatDateForApi(taskData.dueDate),
        deadline: formatDateForApi(taskData.deadline),
        status: computedStatus,
        category_id: taskData.categoryId ?? null,
        notes: taskData.notes,
        mentions: mentionsWithResponsible.map(mention => ({
          id: mention.id,
          kind: mention.kind,
        })),
      };

      const created = await apiClient.post('/tasks', payload);
      const mapped = mapTaskFromApi(created);
      const enriched: Task = {
        ...mapped,
        notes: taskData.notes,
        mentions: mentionsWithResponsible,
      };
      setTasks(prev => [...prev, enriched]);
      createNotificationsForMentions(enriched.mentions, 'task', enriched.id, enriched.title);
      updateAnnotationCache(
        setTaskAnnotations,
        TASK_NOTES_STORAGE_KEY,
        enriched.id,
        enriched.notes,
        enriched.mentions
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar a tarefa no backend.');
      throw err;
    }
  };

  const addKanbanCard = async (cardData: Omit<KanbanCard, 'id'>) => {
    try {
      if (isUsingMockApi) {
        const newCard: KanbanCard = {
          ...cardData,
          id: `card-${Date.now()}`
        };
        setKanbanCards(prev => [...prev, newCard]);
        return;
      }

      const defaultClientId = contacts[0]?.id;
      const defaultResponsibleId = users[0]?.id ?? null;

      if (!defaultClientId) {
        throw new Error('Nenhum contato disponível para vincular ao processo.');
      }

      const rawDeadline = cardData.deadline ?? dayjs().add(30, 'day').toISOString();

      const payload = {
        internal_number: `CARD-${Date.now()}`,
        area: cardData.area === 'Não definido' ? 'Cível' : cardData.area,
        phase: 'Inicial',
        deadline: formatDateForApi(rawDeadline),
        status: 'Ativo',
        client_id: defaultClientId,
        responsible_id: cardData.responsibleId || defaultResponsibleId,
        kanban_column: cardData.column,
        kanban_phase: cardData.phase,
      };

      const created = await apiClient.post('/lawsuits', payload);
      const mappedLawsuit = mapLawsuitFromApi(created);
      const mappedCard = mapKanbanCardFromLawsuit(mappedLawsuit);

      setLawsuits(prev => [...prev, mappedLawsuit]);
      setKanbanCards(prev => [
        ...prev,
        {
          ...mappedCard,
          title: cardData.title || mappedCard.title,
          area: cardData.area,
          description: cardData.description ?? mappedCard.description,
          deadline: cardData.deadline ?? mappedCard.deadline,
          hasAttachments: cardData.hasAttachments,
          hasReminder: cardData.hasReminder,
          commentsCount: cardData.commentsCount,
          isDelayed: cardData.isDelayed,
        },
      ]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar o card no backend.');
      throw err;
    }
  };

  const addContact = async (contactData: {
    name: string;
    document: string;
    origin: string;
    status: string;
    ownerId: number;
    email: string;
    phone: string;
    profession: string;
    lastInteraction?: string;
    categoryId?: string;
    leadCategoryId?: string;
    notes?: string;
    mentions?: MentionReference[];
  }): Promise<Contact> => {
    try {
      if (isUsingMockApi) {
        const newContact: Contact = {
          id: Math.max(...contacts.map(c => c.id), 0) + 1,
          ...contactData,
          lastInteraction: contactData.lastInteraction ?? '',
          notes: contactData.notes,
          mentions: contactData.mentions ?? [],
        };
        setContacts(prev => [...prev, newContact]);
        setError(null);
        createNotificationsForMentions(newContact.mentions, 'contact', newContact.id, newContact.name);
        updateAnnotationCache(
          setContactAnnotations,
          CONTACT_NOTES_STORAGE_KEY,
          newContact.id,
          newContact.notes,
          newContact.mentions
        );
        return newContact;
      }

      const payload = {
        name: contactData.name,
        document: contactData.document,
        origin: contactData.origin,
        status: contactData.status,
        owner_id: contactData.ownerId,
        email: contactData.email,
        phone: contactData.phone,
        profession: contactData.profession,
        last_interaction: contactData.lastInteraction ? formatDateForApi(contactData.lastInteraction) : null,
        category_id: contactData.categoryId ?? null,
        lead_category_id: contactData.leadCategoryId ?? null,
        notes: contactData.notes,
        mentions: (contactData.mentions ?? []).map(mention => ({
          id: mention.id,
          kind: mention.kind,
        })),
      };

      const created = await apiClient.post('/contacts', payload);
      const mapped = mapContactFromApi(created);
      const enriched: Contact = {
        ...mapped,
        notes: contactData.notes,
        mentions: contactData.mentions ?? [],
      };
      setContacts(prev => [...prev, enriched]);
      setError(null);
      createNotificationsForMentions(enriched.mentions, 'contact', enriched.id, enriched.name);
      updateAnnotationCache(
        setContactAnnotations,
        CONTACT_NOTES_STORAGE_KEY,
        enriched.id,
        enriched.notes,
        enriched.mentions
      );
      return enriched;
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        const normalizedMessage = (err.message ?? '').toLowerCase();
        const payloadMessage = extractMessageFromPayload(err.data);
        const isDuplicateDocument =
          normalizedMessage.includes('contacts_document_unique') ||
          normalizedMessage.includes('duplicate entry') ||
          payloadMessage.includes('contacts_document_unique') ||
          payloadMessage.includes('duplicate entry');

        if (isDuplicateDocument) {
          (err as ApiError & { code?: string }).code = 'contact_document_duplicate';
          throw err;
        }

        if (err.status === 422) {
          throw err;
        }
      }
      setError('Não foi possível criar o contato no backend.');
      throw err;
    }
  };

  const createCollaborator = async (data: {
    name: string;
    email: string;
    password: string;
    roleId?: string;
    avatar?: string;
  }): Promise<User> => {
    try {
      if (isUsingMockApi) {
        const newUser: User = {
          id: Math.max(...users.map(u => u.id), 0) + 1,
          name: data.name,
          email: data.email,
          avatar: data.avatar ?? avatarFallback(data.name),
          personalEmail: data.email,
          roleId: data.roleId,
          roleName: data.roleId
            ? userRoles.find(role => role.id === data.roleId)?.name
            : undefined,
        };
        setUsers(prev => [...prev, newUser]);
        setError(null);
        return newUser;
      }

      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: data.avatar,
        personal_email: data.email,
        role_id: data.roleId ?? null,
      };

      const created = await apiClient.post('/users', payload);
      const mapped = mapUserFromApi(created);
      const enriched = mapped.roleId && !mapped.roleName
        ? { ...mapped, roleName: userRoles.find(role => role.id === mapped.roleId)?.name }
        : mapped;
      setUsers(prev => [...prev, enriched]);
      setError(null);
      return enriched;
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 422) {
        throw err;
      }
      setError('Não foi possível cadastrar o colaborador.');
      throw err;
    }
  };

  const updateCollaborator = async (
    userId: number,
    data: {
      name: string;
      email: string;
      password?: string;
      roleId?: string;
      avatar?: string;
    }
  ): Promise<User> => {
    try {
      if (isUsingMockApi) {
        const updated: User | undefined = users.find(user => user.id === userId);
        if (!updated) {
          throw new Error('Colaborador não encontrado.');
        }
        const merged: User = {
          ...updated,
          name: data.name,
          email: data.email,
          personalEmail: data.email,
          avatar: data.avatar ?? updated.avatar,
          roleId: data.roleId ?? updated.roleId,
          roleName:
            data.roleId !== undefined
              ? userRoles.find(role => role.id === data.roleId)?.name ?? updated.roleName
              : updated.roleName,
        };
        setUsers(prev => prev.map(user => (user.id === userId ? merged : user)));
        setError(null);
        return merged;
      }

      const payload: Record<string, any> = {
        name: data.name,
        email: data.email,
        personal_email: data.email,
        role_id: data.roleId ?? null,
      };
      if (data.password && data.password.trim().length >= 8) {
        payload.password = data.password.trim();
      }
      if (data.avatar) {
        payload.avatar = data.avatar;
      }

      const response = await apiClient.put(`/users/${userId}`, payload);
      const mapped = mapUserFromApi(response);
      const enriched = mapped.roleId && !mapped.roleName
        ? { ...mapped, roleName: userRoles.find(role => role.id === mapped.roleId)?.name }
        : mapped;
      setUsers(prev => prev.map(user => (user.id === userId ? enriched : user)));
      setError(null);
      return enriched;
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 422) {
        throw err;
      }
      setError('Não foi possível atualizar o colaborador.');
      throw err;
    }
  };

  const deleteCollaborator = async (userId: number): Promise<void> => {
    try {
      if (isUsingMockApi) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        setError(null);
        return;
      }

      await apiClient.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(user => user.id !== userId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível remover o colaborador.');
      throw err;
    }
  };

  const updateUserCache = (userData: User) => {
    setUsers(prev =>
      prev.some(user => user.id === userData.id)
        ? prev.map(user => (user.id === userData.id ? { ...user, ...userData } : user))
        : prev
    );
  };

  const addLawsuit = async (data: {
    internalNumber: string;
    area: Lawsuit['area'];
    phase: string;
    deadline: string;
    status: Lawsuit['status'];
    clientId: number;
    responsibleId: number;
    kanbanColumn: string;
    kanbanPhase: string;
    notes?: string;
    mentions?: MentionReference[];
  }): Promise<Lawsuit> => {
    try {
      if (isUsingMockApi) {
        const newItem: Lawsuit = {
          id: Math.max(...lawsuits.map(l => l.id), 0) + 1,
          internalNumber: data.internalNumber,
          area: data.area,
          phase: data.phase,
          deadline: data.deadline,
          status: data.status,
          clientId: data.clientId,
          responsibleId: data.responsibleId,
          kanbanColumn: normalizeKanbanColumn(data.kanbanColumn),
          kanbanPhase: normalizeKanbanPhase(data.kanbanPhase),
          notes: data.notes,
          mentions: data.mentions ?? [],
        };
        setLawsuits(prev => [...prev, newItem]);
        setKanbanCards(prev => [...prev, mapKanbanCardFromLawsuit(newItem)]);
        setError(null);
        createNotificationsForMentions(newItem.mentions, 'lawsuit', newItem.id, newItem.internalNumber);
        updateAnnotationCache(
          setLawsuitAnnotations,
          LAWSUIT_NOTES_STORAGE_KEY,
          newItem.id,
          newItem.notes,
          newItem.mentions
        );
        return newItem;
      }

      const payload = {
        internal_number: data.internalNumber,
        area: data.area,
        phase: data.phase,
        deadline: formatDateForApi(data.deadline),
        status: data.status,
        client_id: data.clientId,
        responsible_id: data.responsibleId,
        kanban_column: data.kanbanColumn,
        kanban_phase: data.kanbanPhase,
        notes: data.notes,
        mentions: (data.mentions ?? []).map(mention => ({
          id: mention.id,
          kind: mention.kind,
        })),
      };

      const created = await apiClient.post('/lawsuits', payload);
      const mapped = mapLawsuitFromApi(created);
      const enriched: Lawsuit = {
        ...mapped,
        notes: data.notes,
        mentions: data.mentions ?? [],
      };
      setLawsuits(prev => [...prev, enriched]);
      setKanbanCards(prev => [...prev, mapKanbanCardFromLawsuit(enriched)]);
      setError(null);
      createNotificationsForMentions(enriched.mentions, 'lawsuit', enriched.id, enriched.internalNumber);
      updateAnnotationCache(
        setLawsuitAnnotations,
        LAWSUIT_NOTES_STORAGE_KEY,
        enriched.id,
        enriched.notes,
        enriched.mentions
      );
      return enriched;
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar o processo no backend.');
      throw err;
    }
  };

  const addTransaction = async (data: {
    date: string;
    description: string;
    category: string;
    account: string;
    value: number;
    type: TransactionType;
    categoryId?: string;
  }): Promise<Transaction> => {
    try {
      if (isUsingMockApi) {
        const newItem: Transaction = {
          id: Math.max(...transactions.map(t => t.id), 0) + 1,
          date: data.date,
          description: data.description,
          category: data.category,
          account: data.account,
          value: data.value,
          type: data.type,
          categoryId: data.categoryId,
        };
        setTransactions(prev => [...prev, newItem]);
        setError(null);
        return newItem;
      }

      const payload = {
        date: formatDateForApi(data.date),
        description: data.description,
        category: data.category,
        account: data.account,
        value: data.value,
        type: data.type,
        category_id: data.categoryId ?? null,
      };

      const created = await apiClient.post('/transactions', payload);
      const mapped = mapTransactionFromApi(created);
      setTransactions(prev => [...prev, mapped]);
      setError(null);
      return mapped;
    } catch (err) {
      console.error(err);
      setError('Não foi possível registrar a transação.');
      throw err;
    }
  };

  const createGoalProgram = useCallback(
    (programData: Omit<GoalProgram, 'id'> & { id?: string }) => {
      let createdProgram: GoalProgram | null = null;
      setGoalPrograms(prev => {
        const normalizedName = ensureString(programData.name, 'Programa sem nome');
        const id = programData.id && programData.id.trim().length > 0
          ? programData.id
          : generateGoalProgramId(normalizedName, prev);
        const startDate =
          programData.startDate ?? dayjs().startOf('month').format('YYYY-MM-DD');
        const endDate =
          programData.endDate ?? dayjs(startDate).add(3, 'month').format('YYYY-MM-DD');
        const newProgram: GoalProgram = {
          ...programData,
          id,
          name: normalizedName,
          startDate,
          endDate,
          visibility: normalizeGoalVisibility(programData.visibility),
          tags: programData.tags ? [...programData.tags] : undefined,
        };
        createdProgram = newProgram;
        const next = [...prev, newProgram];
        persistGoalPrograms(next);
        return next;
      });
      return createdProgram!;
    },
    []
  );

  const updateGoalProgram = useCallback(
    (programId: string, updates: Partial<Omit<GoalProgram, 'id'>>) => {
      setGoalPrograms(prev => {
        let updated = false;
        const next = prev.map(program => {
          if (program.id !== programId) return program;
          updated = true;
          return {
            ...program,
            ...(updates.name !== undefined
              ? { name: ensureString(updates.name, program.name) }
              : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(updates.color !== undefined ? { color: updates.color } : {}),
            ...(updates.startDate !== undefined ? { startDate: updates.startDate } : {}),
            ...(updates.endDate !== undefined ? { endDate: updates.endDate } : {}),
            ...(updates.visibility !== undefined
              ? { visibility: normalizeGoalVisibility(updates.visibility) }
              : {}),
            ...(updates.ownerTeamId !== undefined ? { ownerTeamId: updates.ownerTeamId } : {}),
            ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
            ...(updates.tags !== undefined ? { tags: updates.tags ? [...updates.tags] : undefined } : {}),
          };
        });
        if (updated) {
          persistGoalPrograms(next);
        }
        return next;
      });
    },
    []
  );

  const removeGoalProgram = useCallback((programId: string) => {
    let removed = false;
    const removedGoalIds: string[] = [];

    setGoalPrograms(prev => {
      const next = prev.filter(program => program.id !== programId);
      if (next.length !== prev.length) {
        removed = true;
        persistGoalPrograms(next);
        return next;
      }
      return prev;
    });

    if (!removed) return;

    setGoals(prev => {
      const next = prev.filter(goal => {
        const keep = goal.programId !== programId;
        if (!keep) {
          removedGoalIds.push(goal.id);
        }
        return keep;
      });
      if (next.length !== prev.length) {
        persistGoals(next);
      }
      return next;
    });

    if (removedGoalIds.length > 0) {
      setGoalAssignments(prev => {
        const next = prev.filter(assignment => !removedGoalIds.includes(assignment.goalId));
        if (next.length !== prev.length) {
          persistGoalAssignments(next);
        }
        return next;
      });
      setGoalCheckpoints(prev => {
        const next = prev.filter(checkpoint => !removedGoalIds.includes(checkpoint.goalId));
        if (next.length !== prev.length) {
          persistGoalCheckpoints(next);
        }
        return next;
      });
      setGoalNotificationRules(prev => {
        const next = prev.filter(rule => !removedGoalIds.includes(rule.goalId));
        if (next.length !== prev.length) {
          persistGoalNotifications(next);
        }
        return next;
      });
    }
  }, []);

  const createGoal = useCallback(
    (
      data: Omit<Goal, 'id' | 'lastUpdated' | 'status' | 'currentValue'> & {
        id?: string;
        currentValue?: number;
        status?: GoalStatus;
      }
    ) => {
      let createdGoal: Goal | null = null;
      setGoals(prev => {
        const id = data.id && data.id.trim().length > 0 ? data.id : generateGoalId(data.title, prev);
        const currentValue = ensureNumber(data.currentValue ?? 0);
        const metric = cloneGoalMetric(data.metric);
        const thresholds = cloneGoalThresholds(data.thresholds);
        const notificationSettings = cloneGoalNotificationSettings(data.notificationSettings);
        const newGoal: Goal = {
          ...data,
          id,
          title: ensureString(data.title, 'Nova meta'),
          programId: data.programId,
          description: data.description,
          ownerType: data.ownerType ?? 'team',
          ownerId: data.ownerId,
          periodicity: data.periodicity ?? 'one-time',
          startDate: data.startDate ?? dayjs().format('YYYY-MM-DD'),
          endDate: data.endDate ?? dayjs().add(1, 'month').format('YYYY-MM-DD'),
          unit: data.unit ?? 'count',
          baseline: data.baseline,
          targetValue: ensureNumber(data.targetValue, 0),
          currentValue,
          autoUpdate: data.autoUpdate ?? false,
          metric,
          thresholds,
          status: 'attention',
          lastUpdated: new Date().toISOString(),
          tags: data.tags ? [...data.tags] : undefined,
          checkpointFrequency: data.checkpointFrequency,
          displayOrder: data.displayOrder,
          notificationSettings,
          motivationMessage: data.motivationMessage,
        };
        newGoal.status = data.status ?? evaluateGoalStatus(newGoal, currentValue);
        createdGoal = newGoal;
        const next = [...prev, newGoal];
        persistGoals(next);
        return next;
      });

      if (createdGoal) {
        notifyGoalCreated(createdGoal);
        if (createdGoal.autoUpdate || createdGoal.metric.source === 'manual') {
          recalculateGoalProgress(createdGoal.id);
        }
        return createdGoal;
      }
      throw new Error('Não foi possível criar a meta.');
    },
    [recalculateGoalProgress]
  );

  const updateGoal = useCallback(
    (
      goalId: string,
      updates: Partial<Omit<Goal, 'id' | 'programId'>> & { programId?: string }
    ) => {
      let targetGoal: Goal | null = null;
      setGoals(prev => {
        let changed = false;
        const next = prev.map(goal => {
          if (goal.id !== goalId) return goal;
          changed = true;
          const nextGoal: Goal = {
            ...goal,
            ...(updates.programId ? { programId: updates.programId } : {}),
            ...(updates.title !== undefined ? { title: ensureString(updates.title, goal.title) } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(updates.ownerType !== undefined ? { ownerType: updates.ownerType } : {}),
            ...(updates.ownerId !== undefined ? { ownerId: updates.ownerId } : {}),
            ...(updates.periodicity !== undefined ? { periodicity: updates.periodicity } : {}),
            ...(updates.startDate !== undefined ? { startDate: updates.startDate } : {}),
            ...(updates.endDate !== undefined ? { endDate: updates.endDate } : {}),
            ...(updates.unit !== undefined ? { unit: updates.unit } : {}),
            ...(updates.baseline !== undefined ? { baseline: updates.baseline } : {}),
            ...(updates.targetValue !== undefined ? { targetValue: ensureNumber(updates.targetValue, goal.targetValue) } : {}),
            ...(updates.currentValue !== undefined ? { currentValue: ensureNumber(updates.currentValue, goal.currentValue) } : {}),
            ...(updates.autoUpdate !== undefined ? { autoUpdate: Boolean(updates.autoUpdate) } : {}),
            ...(updates.tags !== undefined ? { tags: updates.tags ? [...updates.tags] : undefined } : {}),
            ...(updates.checkpointFrequency !== undefined ? { checkpointFrequency: updates.checkpointFrequency } : {}),
            ...(updates.displayOrder !== undefined ? { displayOrder: updates.displayOrder } : {}),
            ...(updates.motivationMessage !== undefined ? { motivationMessage: updates.motivationMessage } : {}),
          };
          if (updates.metric) {
            nextGoal.metric = cloneGoalMetric({
              ...goal.metric,
              ...updates.metric,
              filters:
                updates.metric.filters !== undefined
                  ? cloneGoalMetricFilters(updates.metric.filters)
                  : goal.metric.filters,
            });
          }
          if (updates.thresholds) {
            nextGoal.thresholds = cloneGoalThresholds({
              ...goal.thresholds,
              ...updates.thresholds,
            });
          }
          if (updates.notificationSettings) {
            nextGoal.notificationSettings = cloneGoalNotificationSettings({
              ...goal.notificationSettings,
              ...updates.notificationSettings,
            });
          }
          nextGoal.status = updates.status ?? evaluateGoalStatus(nextGoal, nextGoal.currentValue);
          nextGoal.lastUpdated = new Date().toISOString();
          targetGoal = nextGoal;
          return nextGoal;
        });
        if (changed) {
          persistGoals(next);
        }
        return next;
      });

      if (targetGoal && (updates.metric || updates.autoUpdate !== undefined || updates.currentValue !== undefined || updates.thresholds || updates.targetValue !== undefined)) {
        recalculateGoalProgress(goalId);
      }

      if (targetGoal) {
        notifyGoalUpdated(targetGoal);
      }
    },
    [recalculateGoalProgress]
  );

  const duplicateGoal = useCallback(
    (goalId: string, overrides: (Partial<Omit<Goal, 'id'>> & { id?: string }) = {}) => {
      const reference = goals.find(goal => goal.id === goalId);
      if (!reference) return null;
      const [clonedReference] = cloneGoals([reference]);
      let title = overrides.title ?? `${clonedReference.title} (cópia)`;
      if (!title || title.trim().length === 0) {
        title = `${clonedReference.title} (cópia)`;
      }
      const id =
        overrides.id && overrides.id.trim().length > 0
          ? overrides.id
          : generateGoalId(title, goals);
      const newGoal: Goal = {
        ...clonedReference,
        ...overrides,
        id,
        title,
        currentValue: overrides.currentValue ?? (overrides.autoUpdate ?? clonedReference.autoUpdate ? 0 : clonedReference.currentValue),
        status: 'attention',
        lastUpdated: new Date().toISOString(),
        tags: overrides.tags
          ? [...(overrides.tags ?? [])]
          : clonedReference.tags
            ? [...clonedReference.tags]
            : undefined,
        metric: overrides.metric
          ? cloneGoalMetric(overrides.metric)
          : cloneGoalMetric(clonedReference.metric),
        thresholds: overrides.thresholds
          ? cloneGoalThresholds(overrides.thresholds)
          : cloneGoalThresholds(clonedReference.thresholds),
        notificationSettings: overrides.notificationSettings
          ? cloneGoalNotificationSettings(overrides.notificationSettings)
          : cloneGoalNotificationSettings(clonedReference.notificationSettings),
      };
      newGoal.status = overrides.status ?? evaluateGoalStatus(newGoal, newGoal.currentValue);
      setGoals(prev => {
        const next = [...prev, newGoal];
        persistGoals(next);
        return next;
      });
      notifyGoalCreated(newGoal);

      if (newGoal.autoUpdate || newGoal.metric.source === 'manual') {
        recalculateGoalProgress(newGoal.id);
      }

      return newGoal;
    },
    [goals, recalculateGoalProgress]
  );

  const removeGoal = useCallback((goalId: string) => {
    let removed = false;
    setGoals(prev => {
      const next = prev.filter(goal => {
        const keep = goal.id !== goalId;
        if (!keep) {
          removed = true;
        }
        return keep;
      });
      if (removed) {
        persistGoals(next);
      }
      return next;
    });

    if (!removed) return;

    setGoalAssignments(prev => {
      const next = prev.filter(assignment => assignment.goalId !== goalId);
      if (next.length !== prev.length) {
        persistGoalAssignments(next);
      }
      return next;
    });
    setGoalCheckpoints(prev => {
      const next = prev.filter(checkpoint => checkpoint.goalId !== goalId);
      if (next.length !== prev.length) {
        persistGoalCheckpoints(next);
      }
      return next;
    });
    setGoalNotificationRules(prev => {
      const next = prev.filter(rule => rule.goalId !== goalId);
      if (next.length !== prev.length) {
        persistGoalNotifications(next);
      }
      return next;
    });
  }, []);

  const recordGoalCheckpoint = useCallback(
    (
      goalId: string,
      checkpoint: Omit<GoalCheckpoint, 'id' | 'goalId'> & { id?: string }
    ) => {
      let created: GoalCheckpoint | null = null;
      setGoalCheckpoints(prev => {
        const id =
          checkpoint.id && checkpoint.id.trim().length > 0
            ? checkpoint.id
            : generateGoalCheckpointId(prev);
        const newCheckpoint: GoalCheckpoint = {
          ...checkpoint,
          id,
          goalId,
          periodStart: checkpoint.periodStart,
          periodEnd: checkpoint.periodEnd,
          recordedAt: checkpoint.recordedAt ?? new Date().toISOString(),
          value: ensureNumber(checkpoint.value, 0),
          delta: checkpoint.delta,
          authorId: checkpoint.authorId,
          notes: checkpoint.notes,
        };
        created = newCheckpoint;
        const next = [...prev, newCheckpoint];
        persistGoalCheckpoints(next);
        return next;
      });

      if (created) {
        recalculateGoalProgress(goalId);
      }
      return created;
    },
    [recalculateGoalProgress]
  );

  const updateGoalCheckpoint = useCallback(
    (checkpointId: string, updates: Partial<Omit<GoalCheckpoint, 'id' | 'goalId'>>) => {
      let relatedGoalId: string | null = null;
      setGoalCheckpoints(prev => {
        let changed = false;
        const next = prev.map(checkpoint => {
          if (checkpoint.id !== checkpointId) return checkpoint;
          changed = true;
          relatedGoalId = checkpoint.goalId;
          return {
            ...checkpoint,
            ...(updates.periodStart !== undefined ? { periodStart: updates.periodStart } : {}),
            ...(updates.periodEnd !== undefined ? { periodEnd: updates.periodEnd } : {}),
            ...(updates.recordedAt !== undefined ? { recordedAt: updates.recordedAt } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            ...(updates.authorId !== undefined ? { authorId: updates.authorId } : {}),
            ...(updates.delta !== undefined ? { delta: updates.delta } : {}),
            ...(updates.value !== undefined ? { value: ensureNumber(updates.value, checkpoint.value) } : {}),
          };
        });
        if (changed) {
          persistGoalCheckpoints(next);
        }
        return next;
      });

      if (relatedGoalId) {
        recalculateGoalProgress(relatedGoalId);
      }
    },
    [recalculateGoalProgress]
  );

  const removeGoalCheckpoint = useCallback((checkpointId: string) => {
    let relatedGoalId: string | null = null;
    setGoalCheckpoints(prev => {
      const next = prev.filter(checkpoint => {
        const keep = checkpoint.id !== checkpointId;
        if (!keep) {
          relatedGoalId = checkpoint.goalId;
        }
        return keep;
      });
      if (next.length !== prev.length) {
        persistGoalCheckpoints(next);
      }
      return next;
    });

    if (relatedGoalId) {
      recalculateGoalProgress(relatedGoalId);
    }
  }, [recalculateGoalProgress]);

  const addGoalAssignment = useCallback(
    (assignment: Omit<GoalAssignment, 'id'> & { id?: string }) => {
      let created: GoalAssignment | null = null;
      setGoalAssignments(prev => {
        const id =
          assignment.id && assignment.id.trim().length > 0
            ? assignment.id
            : generateGoalAssignmentId(prev);
        const newAssignment: GoalAssignment = {
          ...assignment,
          id,
          scope: normalizeGoalAssignmentScope(assignment.scope),
        };
        created = newAssignment;
        const next = [...prev, newAssignment];
        persistGoalAssignments(next);
        return next;
      });
      if (created) {
        const numericAssignee = Number(created.assigneeId);
        const goal = goals.find(item => item.id === created.goalId);
        if (goal && Number.isFinite(numericAssignee)) {
          notifyGoalAssignmentAdded(goal, numericAssignee);
        }
      }
      return created;
    },
    [goals]
  );

  const updateGoalAssignment = useCallback(
    (assignmentId: string, updates: Partial<Omit<GoalAssignment, 'id' | 'goalId'>>) => {
      setGoalAssignments(prev => {
        let changed = false;
        const next = prev.map(assignment => {
          if (assignment.id !== assignmentId) return assignment;
          changed = true;
          return {
            ...assignment,
            ...(updates.assigneeId !== undefined ? { assigneeId: updates.assigneeId } : {}),
            ...(updates.assigneeType !== undefined ? { assigneeType: updates.assigneeType } : {}),
            ...(updates.scope !== undefined
              ? { scope: normalizeGoalAssignmentScope(updates.scope) }
              : {}),
            ...(updates.weight !== undefined ? { weight: updates.weight } : {}),
          };
        });
        if (changed) {
          persistGoalAssignments(next);
        }
        return next;
      });
    },
    []
  );

  const removeGoalAssignment = useCallback((assignmentId: string) => {
    setGoalAssignments(prev => {
      const next = prev.filter(assignment => assignment.id !== assignmentId);
      if (next.length !== prev.length) {
        persistGoalAssignments(next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!authUser) return;
    if (goals.length === 0) {
      goalUserProgressRef.current = new Map();
      goalUserRankRef.current = [];
      return;
    }

    const contributions = new Map<number, number[]>();
    const addContribution = (userId: number | string, progress: number) => {
      const numeric = Number(userId);
      if (!Number.isFinite(numeric)) return;
      const list = contributions.get(numeric) ?? [];
      list.push(progress);
      contributions.set(numeric, list);
    };

    goals.forEach(goal => {
      const progress = getGoalProgressPercentage(goal);
      if (goal.ownerType === 'user' && typeof goal.ownerId === 'number') {
        addContribution(goal.ownerId, progress);
      }
      goalAssignments.forEach(assignment => {
        if (assignment.goalId !== goal.id) return;
        if (assignment.assigneeType !== 'user') return;
        addContribution(assignment.assigneeId, progress);
      });
    });

    const progressMap = new Map<number, number>();
    contributions.forEach((list, userId) => {
      if (list.length === 0) return;
      const average = list.reduce((acc, value) => acc + value, 0) / list.length;
      progressMap.set(userId, average);
    });

    const currentRank = Array.from(progressMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([userId]) => userId);

    const previousRank = goalUserRankRef.current;
    const authId = authUser.id;
    const previousPosition = previousRank.indexOf(authId);
    const currentPosition = currentRank.indexOf(authId);

    if (previousPosition >= 0 && currentPosition >= 0 && currentPosition > previousPosition) {
      const overtakerId = currentPosition > 0 ? currentRank[currentPosition - 1] : null;
      if (overtakerId && overtakerId !== authId) {
        const overtakerUser = users.find(user => user.id === overtakerId);
        if (overtakerUser) {
          pushNotification(authId, {
            title: 'Competição de metas',
            message: `${overtakerUser.name} ultrapassou você no ranking de metas. Ajuste o foco para recuperar a liderança!`,
            entityId: 0,
            entityType: 'goal',
            actorId: overtakerId,
          });
        }
      }
    }

    goalUserProgressRef.current = progressMap;
    goalUserRankRef.current = currentRank;
  }, [goals, goalAssignments, authUser, users]);

  const upsertGoalNotificationRule = useCallback(
    (rule: Omit<GoalNotificationRule, 'id'> & { id?: string }) => {
      let result: GoalNotificationRule | null = null;
      setGoalNotificationRules(prev => {
        const recipients = rule.recipients.map(recipient => ({
          type: recipient.type,
          id: recipient.id,
        }));

        if (rule.id) {
          let updated = false;
          const next = prev.map(existing => {
            if (existing.id !== rule.id) return existing;
            updated = true;
            const updatedRule: GoalNotificationRule = {
              ...existing,
              ...rule,
              trigger: normalizeGoalNotificationTriggerValue(rule.trigger),
              channel: rule.channel,
              recipients,
            };
            result = updatedRule;
            return updatedRule;
          });
          if (updated) {
            persistGoalNotifications(next);
            return next;
          }
        }

        const id = generateGoalNotificationRuleId(prev);
        const newRule: GoalNotificationRule = {
          ...rule,
          id,
          trigger: normalizeGoalNotificationTriggerValue(rule.trigger),
          channel: rule.channel,
          recipients,
        };
        result = newRule;
        const next = [...prev, newRule];
        persistGoalNotifications(next);
        return next;
      });
      return result!;
    },
    []
  );

  const removeGoalNotificationRule = useCallback((ruleId: string) => {
    setGoalNotificationRules(prev => {
      const next = prev.filter(rule => rule.id !== ruleId);
      if (next.length !== prev.length) {
        persistGoalNotifications(next);
      }
      return next;
    });
  }, []);

  const addCategory = (
    groupId: CategoryGroupType,
    data: { name: string; color?: string; description?: string }
  ): CategoryItem | null => {
    const name = ensureString(data.name);
    if (!name) {
      return null;
    }
    const description = data.description ? ensureString(data.description) : undefined;
    const newItem: CategoryItem = {
      id: `${groupId}-${Date.now()}`,
      name,
      color: data.color,
      description,
    };
    let added = false;
    setCategoryGroups(prev => {
      const next = prev.map(group => {
        if (group.id !== groupId) return group;
        const exists = group.items.some(
          item => removeDiacritics(item.name).toLowerCase() === removeDiacritics(name).toLowerCase()
        );
        if (exists) {
          return group;
        }
        added = true;
        return {
          ...group,
          items: [...group.items, newItem],
        };
      });
      if (added) {
        persistCategoryGroups(next);
      }
      return next;
    });
    return added ? newItem : null;
  };

  const updateCategory = (
    groupId: CategoryGroupType,
    categoryId: string,
    updates: Partial<Omit<CategoryItem, 'id'>>
  ) => {
    const normalizedName = updates.name ? ensureString(updates.name) : undefined;
    const normalizedDescription = updates.description
      ? ensureString(updates.description)
      : undefined;
    setCategoryGroups(prev => {
      const next = prev.map(group => {
        if (group.id !== groupId) return group;
        const items = group.items.map(item => {
          if (item.id !== categoryId) return item;
          const next: CategoryItem = {
            ...item,
            ...(normalizedName ? { name: normalizedName } : {}),
            ...(normalizedDescription !== undefined ? { description: normalizedDescription } : {}),
            ...(updates.color !== undefined ? { color: updates.color } : {}),
          };
          return next;
        });
        return { ...group, items };
      });
      persistCategoryGroups(next);
      return next;
    });
  };

  const removeCategory = (groupId: CategoryGroupType, categoryId: string) => {
    let removed = false;
    setCategoryGroups(prev => {
      const next = prev.map(group => {
        if (group.id !== groupId) return group;
        const target = group.items.find(item => item.id === categoryId);
        if (!target || target.isDefault) return group;
        removed = true;
        return {
          ...group,
          items: group.items.filter(item => item.id !== categoryId),
        };
      });
      if (removed) {
        persistCategoryGroups(next);
      }
      return next;
    });

    if (removed) {
      if (groupId === 'tasks') {
        setTasks(prev =>
          prev.map(task =>
            task.categoryId === categoryId ? { ...task, categoryId: undefined } : task
          )
        );
      } else if (groupId === 'financial') {
        setTransactions(prev =>
          prev.map(transaction =>
            transaction.categoryId === categoryId
              ? { ...transaction, categoryId: undefined }
              : transaction
          )
        );
      } else if (groupId === 'contacts') {
        setContacts(prev =>
          prev.map(contact =>
            contact.categoryId === categoryId ? { ...contact, categoryId: undefined } : contact
          )
        );
      } else if (groupId === 'leads') {
        setContacts(prev =>
          prev.map(contact =>
            contact.leadCategoryId === categoryId
              ? { ...contact, leadCategoryId: undefined }
              : contact
          )
        );
      }
    }
  };

  const addUserRole = (data: {
    name: string;
    description?: string;
    color?: string;
    baseRoleId?: string;
    permissions?: Partial<Record<PermissionKey, boolean>>;
  }): RoleDefinition | null => {
    const name = ensureString(data.name);
    if (!name) {
      return null;
    }
    const duplicated = userRoles.some(
      role => removeDiacritics(role.name).toLowerCase() === removeDiacritics(name).toLowerCase()
    );
    if (duplicated) {
      return null;
    }
    const baseRole = data.baseRoleId
      ? userRoles.find(role => role.id === data.baseRoleId)
      : undefined;
    const initialPermissions = PERMISSION_KEYS.reduce<Record<PermissionKey, boolean>>((acc, key) => {
      if (baseRole) {
        acc[key] = Boolean(baseRole.permissions[key]);
      } else {
        acc[key] = false;
      }
      return acc;
    }, {} as Record<PermissionKey, boolean>);

    if (data.permissions) {
      for (const key of Object.keys(data.permissions) as PermissionKey[]) {
        if (PERMISSION_KEYS.includes(key)) {
          initialPermissions[key] = Boolean(data.permissions[key]);
        }
      }
    }

    const newRole: RoleDefinition = {
      id: generateRoleId(name, userRoles),
      name,
      description: data.description ? ensureString(data.description) : '',
      color: data.color || baseRole?.color,
      isSystem: false,
      permissions: initialPermissions,
    };

    setUserRoles(prev => {
      const next = [...prev, newRole];
      persistUserRoles(next);
      return next;
    });
    return newRole;
  };

  const updateUserRole = (
    roleId: string,
    updates: Partial<Pick<RoleDefinition, 'name' | 'description' | 'color'>>
  ) => {
    let normalizedName: string | undefined;
    if (updates.name) {
      const candidate = ensureString(updates.name);
      if (!candidate) {
        return;
      }
      const duplicated = userRoles.some(
        role =>
          role.id !== roleId &&
          removeDiacritics(role.name).toLowerCase() === removeDiacritics(candidate).toLowerCase()
      );
      if (duplicated) {
        return;
      }
      normalizedName = candidate;
    }
    setUserRoles(prev => {
      const next = prev.map(role => {
        if (role.id !== roleId) return role;
        const next: RoleDefinition = {
          ...role,
          ...(normalizedName ? { name: normalizedName } : {}),
          ...(updates.description !== undefined
            ? { description: ensureString(updates.description, role.description) }
            : {}),
          ...(updates.color !== undefined ? { color: updates.color } : {}),
        };
        return next;
      });
      persistUserRoles(next);
      return next;
    });
  };

  const removeUserRole = (roleId: string) => {
    setUserRoles(prev => {
      const next = prev.filter(role => {
        if (role.id !== roleId) return true;
        return role.isSystem;
      });
      if (next.length !== prev.length) {
        persistUserRoles(next);
      }
      return next;
    });
  };

  const setRolePermission = (roleId: string, permission: PermissionKey, enabled: boolean) => {
    if (!PERMISSION_KEYS.includes(permission)) {
      return;
    }
    setUserRoles(prev => {
      const next = prev.map(role => {
        if (role.id !== roleId) return role;
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permission]: enabled,
          },
        };
      });
      persistUserRoles(next);
      return next;
    });
  };

  const value = {
    users,
    contacts,
    lawsuits,
    tasks,
    kanbanCards,
    calendarEvents,
    transactions,
    goalPrograms,
    goals,
    goalAssignments,
    goalCheckpoints,
    goalNotificationRules,
    categoryGroups,
    permissionsCatalog,
    userRoles,
    notifications,
    loading,
    error,
    updateKanbanCardColumn,
    updateKanbanCardDetails,
    updateTaskStatus,
    updateTask,
    addTask,
    addKanbanCard,
    addContact,
    createCollaborator,
    updateCollaborator,
    deleteCollaborator,
    updateUserCache,
    addLawsuit,
    addTransaction,
    createGoalProgram,
    updateGoalProgram,
    removeGoalProgram,
    createGoal,
    updateGoal,
    duplicateGoal,
    removeGoal,
    recordGoalCheckpoint,
    updateGoalCheckpoint,
    removeGoalCheckpoint,
    addGoalAssignment,
    updateGoalAssignment,
    removeGoalAssignment,
    recalculateGoalProgress,
    upsertGoalNotificationRule,
    removeGoalNotificationRule,
    addCategory,
    updateCategory,
    removeCategory,
    addUserRole,
    updateUserRole,
    removeUserRole,
    setRolePermission,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
