import { jsx } from "react/jsx-runtime";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import {
  KanbanColumn,
  KanbanPhase,
  TaskStatus,
  TransactionType
} from "../types/types";
import { initRealtime, disconnectRealtime, subscribeToTenantChannels } from "../lib/realtime";
import dayjs from "dayjs";
import { ApiError, apiClient, isUsingMockApi } from "../services/api";
import { useAuth } from "./AuthContext";
import { getGoalProgressPercentage } from "../lib/goal-utils";
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
  GOAL_NOTIFICATIONS
} from "../data/seed";
const isApiCollection = (payload) => {
  if (!payload) return false;
  if (Array.isArray(payload)) return true;
  return typeof payload === "object" && Array.isArray(payload.data);
};
const toArray = (payload) => {
  if (!isApiCollection(payload)) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};
const ensureString = (value, fallback = "") => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (value === null || value === void 0) return fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};
const ensureNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const ensureEntityId = (value) => {
  if (value === null || value === void 0) return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const str = ensureString(value);
  return str || 0;
};
const fetchOptionalCollection = async (endpoint) => {
  try {
    return await apiClient.get(endpoint);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};
const ensureOptionalNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : void 0;
};
const optionalString = (value) => {
  const normalized = ensureString(value);
  return normalized ? normalized : void 0;
};
const extractMessageFromPayload = (payload) => {
  if (!payload) {
    return "";
  }
  if (typeof payload === "string") {
    return payload.toLowerCase();
  }
  if (typeof payload === "object") {
    const data = payload;
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.toLowerCase();
    }
    if (data.errors && typeof data.errors === "object" && data.errors !== null) {
      const errors = data.errors;
      for (const key of Object.keys(errors)) {
        const value = errors[key];
        if (typeof value === "string" && value.trim()) {
          return value.toLowerCase();
        }
        if (Array.isArray(value)) {
          const message = value.find((item) => typeof item === "string" && item.trim());
          if (typeof message === "string") {
            return message.toLowerCase();
          }
        }
      }
    }
  }
  return "";
};
const avatarFallback = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Usu\xE1rio")}&background=random`;
const removeDiacritics = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const isBrowserEnvironment = typeof window !== "undefined";
const CATEGORY_STORAGE_KEY = "workflow-studio:category-groups:v1";
const ROLE_STORAGE_KEY = "workflow-studio:user-roles:v1";
const NOTIFICATION_STORAGE_KEY = "workflow-studio:notifications:v1";
const TASK_NOTES_STORAGE_KEY = "workflow-studio:task-annotations:v1";
const CONTACT_NOTES_STORAGE_KEY = "workflow-studio:contact-annotations:v1";
const LAWSUIT_NOTES_STORAGE_KEY = "workflow-studio:lawsuit-annotations:v1";
const GOAL_PROGRAMS_STORAGE_KEY = "workflow-studio:goal-programs:v1";
const GOALS_STORAGE_KEY = "workflow-studio:goals:v1";
const GOAL_ASSIGNMENTS_STORAGE_KEY = "workflow-studio:goal-assignments:v1";
const GOAL_CHECKPOINTS_STORAGE_KEY = "workflow-studio:goal-checkpoints:v1";
const GOAL_NOTIFICATIONS_STORAGE_KEY = "workflow-studio:goal-notifications:v1";
const safeParseJSON = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse stored data", error);
    return null;
  }
};
const cloneCategoryGroups = (groups) => groups.map((group) => ({
  ...group,
  items: group.items.map((item) => ({ ...item }))
}));
const cloneRoles = (roles) => roles.map((role) => ({
  ...role,
  permissions: { ...role.permissions }
}));
const cloneGoalMetricFilters = (filters) => {
  if (!filters) return void 0;
  return {
    ...filters,
    responsibleIds: filters.responsibleIds ? [...filters.responsibleIds] : void 0,
    areas: filters.areas ? [...filters.areas] : void 0,
    taskStatus: filters.taskStatus ? [...filters.taskStatus] : void 0,
    transactionTypes: filters.transactionTypes ? [...filters.transactionTypes] : void 0,
    contactStatus: filters.contactStatus ? [...filters.contactStatus] : void 0,
    owners: filters.owners ? [...filters.owners] : void 0,
    tags: filters.tags ? [...filters.tags] : void 0,
    lawsuitStatus: filters.lawsuitStatus ? [...filters.lawsuitStatus] : void 0,
    dateRange: filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : void 0
  };
};
const cloneGoalMetric = (metric) => ({
  ...metric,
  filters: cloneGoalMetricFilters(metric.filters)
});
const cloneGoalThresholds = (thresholds) => ({
  ...thresholds
});
const cloneGoalNotificationSettings = (settings) => {
  if (!settings) return void 0;
  return {
    ...settings,
    channels: settings.channels ? [...settings.channels] : void 0
  };
};
const cloneGoalPrograms = (programs) => programs.map((program) => ({
  ...program,
  tags: program.tags ? [...program.tags] : void 0
}));
const cloneGoals = (goals) => goals.map((goal) => ({
  ...goal,
  tags: goal.tags ? [...goal.tags] : void 0,
  metric: cloneGoalMetric(goal.metric),
  thresholds: cloneGoalThresholds(goal.thresholds),
  notificationSettings: cloneGoalNotificationSettings(goal.notificationSettings)
}));
const cloneGoalAssignments = (assignments) => assignments.map((assignment) => ({
  ...assignment
}));
const cloneGoalCheckpoints = (checkpoints) => checkpoints.map((checkpoint) => ({
  ...checkpoint
}));
const cloneGoalNotifications = (rules) => rules.map((rule) => ({
  ...rule,
  recipients: rule.recipients ? rule.recipients.map((recipient) => ({ ...recipient })) : []
}));
const generateNotificationId = () => `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const generateRandomId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
const buildMentionsSignature = (mentions) => (mentions ?? []).map((mention) => `${mention.kind}:${mention.id}:${mention.label}`).sort().join("|");
const tasksAreEqual = (prev, next) => {
  if (prev.length !== next.length) return false;
  const reference = new Map(prev.map((task) => [task.id, task]));
  for (const task of next) {
    const existing = reference.get(task.id);
    if (!existing) return false;
    if (existing.title !== task.title || existing.status !== task.status || existing.dueDate !== task.dueDate || existing.deadline !== task.deadline || existing.responsibleId !== task.responsibleId || existing.lawsuitId !== task.lawsuitId || existing.clientId !== task.clientId || existing.score !== task.score || existing.categoryId !== task.categoryId || (existing.notes || "") !== (task.notes || "") || buildMentionsSignature(existing.mentions) !== buildMentionsSignature(task.mentions)) {
      return false;
    }
  }
  return true;
};
const notificationsAreEqual = (prev, next) => {
  if (prev.length !== next.length) return false;
  for (let index = 0; index < prev.length; index += 1) {
    const current = prev[index];
    const candidate = next[index];
    if (current.id !== candidate.id || current.recipientId !== candidate.recipientId || current.actorId !== candidate.actorId || current.title !== candidate.title || current.message !== candidate.message || current.createdAt !== candidate.createdAt || current.isRead !== candidate.isRead || current.entityType !== candidate.entityType || current.entityId !== candidate.entityId) {
      return false;
    }
  }
  return true;
};
const mapMentionsFromApi = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const id = ensureNumber(item?.id);
    const kind = item?.kind === "contact" ? "contact" : item?.kind === "user" ? "user" : null;
    const label = ensureString(item?.label);
    if (!kind || !label || id <= 0) return null;
    return { id, kind, label };
  }).filter(Boolean);
};
const sortNotifications = (items) => [...items].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
const mapNotificationFromApi = (raw) => {
  const id = ensureString(raw?.id, generateNotificationId());
  const recipientId = ensureNumber(raw?.recipientId ?? raw?.recipient_id);
  const actorId = ensureOptionalNumber(raw?.actorId ?? raw?.actor_id);
  const entityTypeRaw = ensureString(raw?.entityType ?? raw?.entity_type, "task").toLowerCase();
  const allowedTypes = ["task", "lawsuit", "contact", "goal", "social"];
  const entityType = allowedTypes.includes(entityTypeRaw) ? entityTypeRaw : "task";
  return {
    id,
    recipientId,
    actorId: actorId ?? void 0,
    title: ensureString(raw?.title, "Notifica\xE7\xE3o"),
    message: ensureString(raw?.message),
    createdAt: ensureString(raw?.createdAt ?? raw?.created_at, (/* @__PURE__ */ new Date()).toISOString()),
    isRead: Boolean(raw?.isRead ?? raw?.is_read),
    entityType,
    entityId: ensureEntityId(raw?.entityId ?? raw?.entity_id)
  };
};
const mergeCategoryGroupsSeed = (seed, stored) => {
  if (!stored || !Array.isArray(stored)) {
    return cloneCategoryGroups(seed);
  }
  const storedMap = /* @__PURE__ */ new Map();
  stored.forEach((group) => {
    if (group?.id) {
      storedMap.set(group.id, {
        ...group,
        items: Array.isArray(group.items) ? group.items.map((item) => ({ ...item })) : []
      });
    }
  });
  const merged = seed.map((seedGroup) => {
    const storedGroup = storedMap.get(seedGroup.id);
    if (!storedGroup) {
      return {
        ...seedGroup,
        items: seedGroup.items.map((item) => ({ ...item }))
      };
    }
    const storedItemsMap = /* @__PURE__ */ new Map();
    storedGroup.items.forEach((item) => {
      if (item?.id) {
        storedItemsMap.set(item.id, { ...item });
      }
    });
    const mergedItems = [];
    storedGroup.items.forEach((item) => {
      if (item?.id) {
        const seedItem = seedGroup.items.find((seedIt) => seedIt.id === item.id);
        mergedItems.push({
          ...item,
          isDefault: seedItem?.isDefault ?? item.isDefault
        });
      }
    });
    seedGroup.items.forEach((seedItem) => {
      if (!storedItemsMap.has(seedItem.id)) {
        mergedItems.push({ ...seedItem });
      }
    });
    return {
      ...seedGroup,
      items: mergedItems
    };
  });
  return merged;
};
const ensureRolePermissions = (role) => {
  const normalizedPermissions = PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(role.permissions?.[key]);
    return acc;
  }, {});
  return {
    ...role,
    permissions: normalizedPermissions
  };
};
const mergeRoleSeeds = (seedRoles, storedRoles) => {
  const storedMap = /* @__PURE__ */ new Map();
  storedRoles?.forEach((role) => {
    if (role?.id) {
      storedMap.set(role.id, ensureRolePermissions(role));
    }
  });
  const mergedSystemRoles = seedRoles.map((seedRole) => {
    const stored = storedMap.get(seedRole.id);
    if (!stored) {
      return ensureRolePermissions({ ...seedRole });
    }
    const mergedPermissions = PERMISSION_KEYS.reduce((acc, key) => {
      const storedValue = stored.permissions?.[key];
      const seedValue = seedRole.permissions?.[key];
      acc[key] = storedValue !== void 0 ? storedValue : Boolean(seedValue);
      return acc;
    }, {});
    return {
      ...seedRole,
      color: stored.color ?? seedRole.color,
      permissions: mergedPermissions
    };
  });
  const customRoles = storedRoles?.filter((role) => role && !role.isSystem).map((role) => ensureRolePermissions({ ...role })) ?? [];
  return [...mergedSystemRoles, ...customRoles];
};
const loadStoredCategoryGroups = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(window.localStorage.getItem(CATEGORY_STORAGE_KEY));
  if (!parsed) return null;
  return mergeCategoryGroupsSeed(CATEGORY_GROUPS, parsed);
};
const loadStoredRoles = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(window.localStorage.getItem(ROLE_STORAGE_KEY));
  if (!parsed) return null;
  return mergeRoleSeeds(USER_ROLES, parsed);
};
const loadStoredNotifications = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(window.localStorage.getItem(NOTIFICATION_STORAGE_KEY));
  if (!parsed) return null;
  return parsed.map((item) => ({
    ...item,
    createdAt: ensureString(item.createdAt, (/* @__PURE__ */ new Date()).toISOString()),
    message: ensureString(item.message),
    title: ensureString(item.title, "Notifica\xE7\xE3o"),
    isRead: Boolean(item?.isRead)
  }));
};
const loadStoredGoalPrograms = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(window.localStorage.getItem(GOAL_PROGRAMS_STORAGE_KEY));
  if (!parsed) return null;
  return cloneGoalPrograms(parsed);
};
const loadStoredGoals = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(window.localStorage.getItem(GOALS_STORAGE_KEY));
  if (!parsed) return null;
  return cloneGoals(parsed);
};
const loadStoredGoalAssignments = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(
    window.localStorage.getItem(GOAL_ASSIGNMENTS_STORAGE_KEY)
  );
  if (!parsed) return null;
  return cloneGoalAssignments(parsed);
};
const loadStoredGoalCheckpoints = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(
    window.localStorage.getItem(GOAL_CHECKPOINTS_STORAGE_KEY)
  );
  if (!parsed) return null;
  return cloneGoalCheckpoints(parsed);
};
const loadStoredGoalNotifications = () => {
  if (!isBrowserEnvironment) return null;
  const parsed = safeParseJSON(
    window.localStorage.getItem(GOAL_NOTIFICATIONS_STORAGE_KEY)
  );
  if (!parsed) return null;
  return cloneGoalNotifications(parsed);
};
const persistCategoryGroups = (groups) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error("Failed to persist category groups", error);
  }
};
const persistUserRoles = (roles) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
  } catch (error) {
    console.error("Failed to persist user roles", error);
  }
};
const persistNotifications = (items) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to persist notifications", error);
  }
};
const persistGoalPrograms = (programs) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
  } catch (error) {
    console.error("Failed to persist goal programs", error);
  }
};
const persistGoals = (goals) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error("Failed to persist goals", error);
  }
};
const persistGoalAssignments = (assignments) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error("Failed to persist goal assignments", error);
  }
};
const persistGoalCheckpoints = (checkpoints) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_CHECKPOINTS_STORAGE_KEY, JSON.stringify(checkpoints));
  } catch (error) {
    console.error("Failed to persist goal checkpoints", error);
  }
};
const persistGoalNotifications = (rules) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(GOAL_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(rules));
  } catch (error) {
    console.error("Failed to persist goal notifications", error);
  }
};
const loadAnnotationCache = (storageKey) => {
  if (!isBrowserEnvironment) return {};
  const parsed = safeParseJSON(window.localStorage.getItem(storageKey));
  if (!parsed) return {};
  return parsed;
};
const persistAnnotationCache = (storageKey, cache) => {
  if (!isBrowserEnvironment) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to persist annotations cache", error);
  }
};
const slugify = (value) => removeDiacritics(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const generateRoleId = (name, existing) => {
  const base = slugify(name) || `perfil-${Date.now()}`;
  let candidate = base;
  let suffix = 1;
  const existingIds = new Set(existing.map((role) => role.id));
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};
const generateGoalProgramId = (name, existing) => {
  const base = slugify(name) || `programa-${Date.now().toString(36)}`;
  let candidate = base;
  let suffix = 1;
  const existingIds = new Set(existing.map((program) => program.id));
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};
const generateGoalId = (title, existing) => {
  const base = slugify(title) || `meta-${Date.now().toString(36)}`;
  let candidate = base;
  let suffix = 1;
  const existingIds = new Set(existing.map((goal) => goal.id));
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};
const generateGoalAssignmentId = (existing) => {
  let candidate = generateRandomId("goal-assignment");
  const existingIds = new Set(existing.map((assignment) => assignment.id));
  while (existingIds.has(candidate)) {
    candidate = generateRandomId("goal-assignment");
  }
  return candidate;
};
const generateGoalCheckpointId = (existing) => {
  let candidate = generateRandomId("goal-checkpoint");
  const existingIds = new Set(existing.map((checkpoint) => checkpoint.id));
  while (existingIds.has(candidate)) {
    candidate = generateRandomId("goal-checkpoint");
  }
  return candidate;
};
const generateGoalNotificationRuleId = (existing) => {
  let candidate = generateRandomId("goal-notification");
  const existingIds = new Set(existing.map((rule) => rule.id));
  while (existingIds.has(candidate)) {
    candidate = generateRandomId("goal-notification");
  }
  return candidate;
};
const formatDateForApi = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
};
const normalizeKanbanColumn = (value) => {
  const normalized = removeDiacritics(ensureString(value)).toLowerCase();
  const map = {
    "prospeccao": KanbanColumn.Prospeccao,
    "prospecao": KanbanColumn.Prospeccao,
    "prospec\xE7\xE3o": KanbanColumn.Prospeccao,
    "backlog": KanbanColumn.Prospeccao,
    "analise de documentos": KanbanColumn.AnaliseDocumentos,
    "an\xE1lise de documentos": KanbanColumn.AnaliseDocumentos,
    "em progresso": KanbanColumn.AnaliseDocumentos,
    "elaboracao da peticao": KanbanColumn.ElaboracaoPeticao,
    "elabora\xE7\xE3o da peti\xE7\xE3o": KanbanColumn.ElaboracaoPeticao,
    "revisao": KanbanColumn.ElaboracaoPeticao,
    "revis\xE3o": KanbanColumn.ElaboracaoPeticao,
    "aguardando julgamento": KanbanColumn.AguardandoJulgamento,
    "finalizados": KanbanColumn.Finalizados
  };
  return map[normalized] ?? KanbanColumn.Prospeccao;
};
const normalizeKanbanPhase = (value) => {
  const normalized = ensureString(value, KanbanPhase.Judicial).toLowerCase();
  return normalized === KanbanPhase.Extrajudicial.toLowerCase() ? KanbanPhase.Extrajudicial : KanbanPhase.Judicial;
};
const normalizeGoalVisibility = (value) => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === "team") return "team";
  if (normalized === "individual") return "individual";
  return "global";
};
const normalizeGoalProgramType = (value) => {
  const normalized = ensureString(value).toLowerCase();
  switch (normalized) {
    case "financeiro":
      return "Financeiro";
    case "producao":
    case "produ\xE7\xE3o":
    case "operacional":
      return "Produ\xE7\xE3o";
    case "relacionamento":
    case "crm":
      return "Relacionamento";
    case "marketing":
      return "Marketing";
    case "qualidade":
      return "Qualidade";
    default:
      return "Financeiro";
  }
};
const normalizeGoalUnit = (value) => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === "currency") return "currency";
  if (normalized === "percentage") return "percentage";
  if (normalized === "hours") return "hours";
  return "count";
};
const normalizeGoalPeriodicity = (value) => {
  const normalized = ensureString(value).toLowerCase();
  const allowed = ["one-time", "monthly", "weekly", "quarterly", "annual"];
  return allowed.includes(normalized) ? normalized : "one-time";
};
const normalizeGoalOwnerType = (value) => {
  const normalized = ensureString(value).toLowerCase();
  return normalized === "user" ? "user" : "team";
};
const normalizeGoalOwnerId = (value) => {
  if (value === null || value === void 0) return void 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const str = ensureString(value);
  if (!str) return void 0;
  const numeric = Number(str);
  if (Number.isFinite(numeric) && str === String(numeric)) {
    return numeric;
  }
  return str;
};
const normalizeGoalMetricSource = (value) => {
  const normalized = ensureString(value).toLowerCase();
  const allowed = ["manual", "tasks", "lawsuits", "transactions", "contacts"];
  return allowed.includes(normalized) ? normalized : "manual";
};
const normalizeGoalAggregation = (value) => {
  const normalized = ensureString(value).toLowerCase();
  const allowed = ["sum", "count", "average", "percent"];
  return allowed.includes(normalized) ? normalized : "count";
};
const normalizeGoalStatus = (value) => {
  const normalized = ensureString(value).toLowerCase();
  switch (normalized) {
    case "achieved":
      return "achieved";
    case "ontrack":
    case "on_track":
    case "on-track":
      return "onTrack";
    case "critical":
      return "critical";
    default:
      return "attention";
  }
};
const normalizeCheckpointFrequency = (value) => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === "weekly" || normalized === "monthly" || normalized === "quarterly") {
    return normalized;
  }
  return void 0;
};
const normalizeNotificationChannels = (raw) => {
  if (!Array.isArray(raw)) return void 0;
  const channels = raw.map((channel) => ensureString(channel).toLowerCase()).map((channel) => {
    if (channel === "inapp" || channel === "in-app" || channel === "app") return "inApp";
    if (channel === "email") return "email";
    if (channel === "slack") return "slack";
    return null;
  }).filter(Boolean);
  return channels.length > 0 ? channels : void 0;
};
const normalizeGoalNotificationTriggerValue = (value) => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === "warning") return "warning";
  if (normalized === "critical") return "critical";
  if (normalized === "achieved") return "achieved";
  return "checkpoint";
};
const normalizeGoalAssignmentScope = (value) => {
  const normalized = ensureString(value).toLowerCase();
  if (normalized === "collaborator") return "collaborator";
  if (normalized === "observer") return "observer";
  return "responsible";
};
const matchesOwnerFilter = (value, allowed) => {
  if (!allowed || allowed.length === 0) return true;
  if (value === void 0 || value === null) return false;
  return allowed.some((item) => {
    if (typeof item === "number" && Number.isFinite(item)) {
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
const matchesStringFilter = (value, allowed) => {
  if (!allowed || allowed.length === 0) return true;
  if (!value) return false;
  return allowed.some((item) => ensureString(item).toLowerCase() === value.toLowerCase());
};
const isWithinDateRange = (dateISO, range) => {
  if (!range || !range.from && !range.to) return true;
  if (!dateISO) return false;
  const parsedDate = dayjs(dateISO);
  if (!parsedDate.isValid()) return false;
  if (range.from) {
    const fromDate = dayjs(range.from);
    if (fromDate.isValid() && parsedDate.isBefore(fromDate, "day")) {
      return false;
    }
  }
  if (range.to) {
    const toDate = dayjs(range.to);
    if (toDate.isValid() && parsedDate.isAfter(toDate, "day")) {
      return false;
    }
  }
  return true;
};
const mapUserFromApi = (raw) => {
  const name = ensureString(raw?.name, "Usu\xE1rio");
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
    roleId: roleId ?? void 0,
    roleName: roleName ?? void 0
  };
};
const mapSocialCommentFromApi = (raw) => {
  const id = ensureNumber(raw?.id);
  if (!id) {
    return null;
  }
  return {
    id,
    postId: ensureNumber(raw?.postId ?? raw?.post_id),
    userId: ensureNumber(raw?.userId ?? raw?.user_id),
    tenantId: ensureNumber(raw?.tenantId ?? raw?.tenant_id),
    body: ensureString(raw?.body),
    createdAt: ensureString(raw?.createdAt ?? raw?.created_at),
    updatedAt: optionalString(raw?.updatedAt ?? raw?.updated_at),
    user: raw?.user ? mapUserFromApi(raw.user) : void 0,
    mentions: mapMentionsFromApi(raw?.mentions)
  };
};
const mapSocialPostFromApi = (raw) => {
  const id = ensureNumber(raw?.id);
  if (!id) {
    return null;
  }
  const createdAt = optionalString(raw?.createdAt ?? raw?.created_at) ?? (/* @__PURE__ */ new Date()).toISOString();
  return {
    id,
    tenantId: ensureNumber(raw?.tenantId ?? raw?.tenant_id),
    userId: ensureNumber(raw?.userId ?? raw?.user_id),
    content: optionalString(raw?.content),
    imageUrl: optionalString(raw?.imageUrl ?? raw?.image_url),
    likesCount: ensureNumber(raw?.likesCount ?? raw?.likes_count),
    isLiked: Boolean(raw?.isLiked ?? raw?.is_liked),
    createdAt,
    updatedAt: optionalString(raw?.updatedAt ?? raw?.updated_at),
    user: raw?.user ? mapUserFromApi(raw.user) : void 0,
    comments: toArray(raw?.comments).map(mapSocialCommentFromApi).filter(Boolean),
    mentions: mapMentionsFromApi(raw?.mentions)
  };
};
const mapContactFromApi = (raw) => ({
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
  mentions: mapMentionsFromApi(raw?.mentions)
});
const mapLawsuitFromApi = (raw) => ({
  id: ensureNumber(raw?.id),
  internalNumber: ensureString(raw?.internalNumber ?? raw?.internal_number),
  clientId: ensureNumber(raw?.clientId ?? raw?.client_id),
  responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
  area: ensureString(raw?.area, "C\xEDvel"),
  phase: ensureString(raw?.phase),
  deadline: ensureString(raw?.deadline ?? raw?.deadline_at),
  status: ensureString(raw?.status, "Ativo"),
  kanbanColumn: normalizeKanbanColumn(raw?.kanbanColumn ?? raw?.kanban_column),
  kanbanPhase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
  notes: optionalString(raw?.notes),
  mentions: mapMentionsFromApi(raw?.mentions)
});
const mapTaskFromApi = (raw) => ({
  id: ensureNumber(raw?.id),
  title: ensureString(raw?.title),
  status: ensureString(raw?.status, TaskStatus.Pendente),
  dueDate: ensureString(raw?.dueDate ?? raw?.due_date ?? raw?.deadline),
  deadline: ensureString(raw?.deadline ?? raw?.due_date ?? raw?.dueDate),
  responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
  lawsuitId: ensureOptionalNumber(raw?.lawsuitId ?? raw?.lawsuit_id),
  clientId: ensureOptionalNumber(raw?.clientId ?? raw?.client_id),
  score: ensureNumber(raw?.score),
  categoryId: optionalString(raw?.categoryId ?? raw?.category_id),
  notes: optionalString(raw?.notes),
  mentions: mapMentionsFromApi(raw?.mentions)
});
const mapCalendarEventFromApi = (raw) => ({
  id: ensureNumber(raw?.id),
  title: ensureString(raw?.title),
  start: ensureString(raw?.start),
  end: ensureString(raw?.end ?? raw?.start),
  color: ensureString(raw?.color, "#3B82F6")
});
const mapTransactionFromApi = (raw) => ({
  id: ensureNumber(raw?.id),
  date: ensureString(raw?.date),
  description: ensureString(raw?.description),
  category: ensureString(raw?.category),
  account: ensureString(raw?.account),
  value: Number.parseFloat(String(raw?.value ?? 0)) || 0,
  type: ensureString(raw?.type, TransactionType.Despesa),
  categoryId: optionalString(raw?.categoryId ?? raw?.category_id)
});
const mapPaymentInstallmentFromApi = (raw) => ({
  id: ensureNumber(raw?.id),
  paymentScheduleId: ensureNumber(raw?.payment_schedule_id ?? raw?.paymentScheduleId),
  sequence: ensureNumber(raw?.sequence),
  dueDate: optionalString(raw?.due_date ?? raw?.dueDate) ?? null,
  amount: Number.parseFloat(String(raw?.amount ?? 0)) || 0,
  status: ensureString(raw?.status, "pending"),
  paidAt: optionalString(raw?.paid_at ?? raw?.paidAt),
  transactionId: ensureOptionalNumber(raw?.transaction_id ?? raw?.transactionId),
  createdAt: optionalString(raw?.created_at ?? raw?.createdAt),
  updatedAt: optionalString(raw?.updated_at ?? raw?.updatedAt)
});
const mapPaymentScheduleFromApi = (raw) => ({
  id: ensureNumber(raw?.id),
  tenantId: ensureNumber(raw?.tenant_id ?? raw?.tenantId),
  contactId: ensureNumber(raw?.contact_id ?? raw?.contactId),
  title: optionalString(raw?.title) ?? null,
  notes: optionalString(raw?.notes),
  totalAmount: Number.parseFloat(String(raw?.total_amount ?? raw?.totalAmount ?? 0)) || 0,
  installmentsCount: ensureNumber(raw?.installments_count ?? raw?.installmentsCount),
  installmentAmount: Number.parseFloat(String(raw?.installment_amount ?? raw?.installmentAmount ?? 0)) || 0,
  firstDueDate: optionalString(raw?.first_due_date ?? raw?.firstDueDate),
  createdAt: optionalString(raw?.created_at ?? raw?.createdAt),
  updatedAt: optionalString(raw?.updated_at ?? raw?.updatedAt),
  contact: raw?.contact && typeof raw.contact === "object" ? {
    id: ensureNumber(raw.contact.id),
    name: ensureString(raw.contact.name),
    email: optionalString(raw.contact.email),
    phone: optionalString(raw.contact.phone)
  } : null,
  installments: Array.isArray(raw?.installments) ? raw.installments.map(mapPaymentInstallmentFromApi) : []
});
const mapKanbanCardFromLawsuit = (raw) => {
  const column = normalizeKanbanColumn(raw?.kanbanColumn ?? raw?.kanban_column);
  const deadline = ensureString(raw?.deadline ?? raw?.deadline_at);
  const description = ensureString(raw?.description ?? raw?.notes);
  return {
    id: `lawsuit-${ensureNumber(raw?.id)}`,
    title: ensureString(
      raw?.title ?? raw?.internalNumber ?? raw?.internal_number ?? `Processo #${ensureNumber(raw?.id)}`
    ),
    description: description || void 0,
    column,
    phase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
    area: ensureString(raw?.area, "N\xE3o definido"),
    responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
    deadline: deadline || void 0,
    hasAttachments: Boolean(raw?.hasAttachments ?? raw?.has_attachments ?? false),
    commentsCount: ensureNumber(raw?.commentsCount ?? raw?.comments_count, 0),
    hasReminder: Boolean(raw?.hasReminder ?? raw?.has_reminder ?? false),
    isDelayed: deadline ? dayjs(deadline).isBefore(dayjs(), "day") : false
  };
};
const mapKanbanCardFromMock = (raw) => ({
  id: ensureString(raw?.id),
  title: ensureString(raw?.title),
  description: ensureString(raw?.description) || void 0,
  column: raw?.column ?? KanbanColumn.Prospeccao,
  phase: raw?.phase ?? KanbanPhase.Judicial,
  area: raw?.area ?? "N\xE3o definido",
  responsibleId: ensureNumber(raw?.responsibleId),
  deadline: ensureString(raw?.deadline) || void 0,
  hasAttachments: Boolean(raw?.hasAttachments),
  commentsCount: ensureNumber(raw?.commentsCount, 0),
  hasReminder: Boolean(raw?.hasReminder),
  isDelayed: Boolean(raw?.isDelayed)
});
const extractLawsuitIdFromCard = (cardId) => {
  if (!cardId) return null;
  if (cardId.startsWith("lawsuit-")) {
    const parsed = Number(cardId.replace("lawsuit-", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numeric = Number(cardId);
  return Number.isFinite(numeric) ? numeric : null;
};
const mapStringArray = (raw) => {
  if (!Array.isArray(raw)) return void 0;
  const values = raw.map((item) => ensureString(item)).filter((value) => value.length > 0);
  return values.length > 0 ? values : void 0;
};
const mapGoalMetricFiltersFromApi = (raw) => {
  if (!raw || typeof raw !== "object") return void 0;
  const filters = {};
  const responsibleIds = raw.responsibleIds ?? raw.responsible_ids ?? raw.responsible_id;
  if (Array.isArray(responsibleIds)) {
    filters.responsibleIds = responsibleIds.map((item) => ensureNumber(item)).filter((value) => Number.isFinite(value));
  }
  const ownersRaw = raw.owners ?? raw.ownerIds ?? raw.owner_ids;
  if (Array.isArray(ownersRaw)) {
    const ownerIds = ownersRaw.map((item) => ensureNumber(item, Number.NaN)).filter((value) => Number.isFinite(value));
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
    filters.taskStatus = taskStatusRaw.map((item) => ensureString(item)).filter((value) => value.length > 0);
  }
  const transactionTypesRaw = raw.transactionTypes ?? raw.transaction_types;
  if (Array.isArray(transactionTypesRaw)) {
    filters.transactionTypes = transactionTypesRaw.map((item) => ensureString(item)).filter((value) => value.length > 0);
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
    filters.lawsuitStatus = lawsuitStatusRaw.map((item) => ensureString(item)).filter((value) => value.length > 0);
  }
  const dateRangeRaw = raw.dateRange ?? raw.date_range;
  if (dateRangeRaw && (dateRangeRaw.from || dateRangeRaw.to)) {
    const from = optionalString(dateRangeRaw.from);
    const to = optionalString(dateRangeRaw.to);
    if (from || to) {
      filters.dateRange = { from: from ?? void 0, to: to ?? void 0 };
    }
  }
  return Object.keys(filters).length > 0 ? filters : void 0;
};
const mapGoalMetricFromApi = (raw) => ({
  source: normalizeGoalMetricSource(raw?.source),
  aggregation: normalizeGoalAggregation(raw?.aggregation),
  unit: raw?.unit ? normalizeGoalUnit(raw.unit) : void 0,
  field: raw?.field === "value" ? "value" : raw?.field === "score" ? "score" : void 0,
  filters: mapGoalMetricFiltersFromApi(raw?.filters)
});
const mapGoalThresholdsFromApi = (raw) => {
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
  const thresholds = {
    success,
    warning,
    critical: criticalValue ?? void 0,
    successLabel: optionalString(raw?.successLabel ?? raw?.success_label),
    warningLabel: optionalString(raw?.warningLabel ?? raw?.warning_label),
    criticalLabel: optionalString(raw?.criticalLabel ?? raw?.critical_label)
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
const mapGoalNotificationSettingsFromApi = (raw) => {
  if (!raw || typeof raw !== "object") return void 0;
  const reminderFrequency = normalizeCheckpointFrequency(
    raw.reminderFrequency ?? raw.reminder_frequency
  );
  const channels = normalizeNotificationChannels(raw.channels);
  const beforeDeadlineDays = ensureOptionalNumber(
    raw.beforeDeadlineDays ?? raw.before_deadline_days
  );
  const mentionAssignees = raw.mentionAssignees ?? raw.mention_assignees ?? raw.notify_assignees;
  const settings = {};
  if (reminderFrequency) {
    settings.reminderFrequency = reminderFrequency;
  }
  if (channels) {
    settings.channels = channels;
  }
  if (Number.isFinite(beforeDeadlineDays ?? NaN)) {
    settings.beforeDeadlineDays = beforeDeadlineDays ?? void 0;
  }
  if (mentionAssignees !== void 0) {
    settings.mentionAssignees = Boolean(mentionAssignees);
  }
  return Object.keys(settings).length > 0 ? settings : void 0;
};
const mapGoalProgramFromApi = (raw) => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  name: ensureString(raw?.name, "Programa de metas"),
  description: optionalString(raw?.description),
  type: normalizeGoalProgramType(raw?.type),
  icon: void 0,
  color: optionalString(raw?.color),
  startDate: ensureString(
    raw?.startDate ?? raw?.start_date ?? dayjs().startOf("year").format("YYYY-MM-DD")
  ),
  endDate: ensureString(
    raw?.endDate ?? raw?.end_date ?? dayjs().endOf("year").format("YYYY-MM-DD")
  ),
  visibility: normalizeGoalVisibility(raw?.visibility),
  ownerTeamId: optionalString(raw?.ownerTeamId ?? raw?.owner_team_id),
  tags: mapStringArray(raw?.tags)
});
const mapGoalFromApi = (raw) => {
  const metric = mapGoalMetricFromApi(raw?.metric ?? raw);
  const thresholds = mapGoalThresholdsFromApi(raw?.thresholds ?? raw);
  return {
    id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
    programId: ensureString(raw?.programId ?? raw?.program_id),
    title: ensureString(raw?.title, "Meta"),
    description: optionalString(raw?.description),
    ownerType: normalizeGoalOwnerType(raw?.ownerType ?? raw?.owner_type),
    ownerId: normalizeGoalOwnerId(raw?.ownerId ?? raw?.owner_id),
    periodicity: normalizeGoalPeriodicity(raw?.periodicity ?? raw?.period),
    startDate: ensureString(
      raw?.startDate ?? raw?.start_date ?? dayjs().format("YYYY-MM-DD")
    ),
    endDate: ensureString(
      raw?.endDate ?? raw?.end_date ?? dayjs().add(1, "month").format("YYYY-MM-DD")
    ),
    unit: raw?.unit ? normalizeGoalUnit(raw.unit) : metric.unit ?? "count",
    baseline: ensureOptionalNumber(raw?.baseline),
    targetValue: ensureNumber(raw?.targetValue ?? raw?.target_value, 0),
    currentValue: ensureNumber(raw?.currentValue ?? raw?.current_value, 0),
    autoUpdate: Boolean(raw?.autoUpdate ?? raw?.auto_update ?? true),
    metric,
    thresholds,
    status: normalizeGoalStatus(raw?.status),
    lastUpdated: ensureString(
      raw?.lastUpdated ?? raw?.last_updated ?? (/* @__PURE__ */ new Date()).toISOString()
    ),
    tags: mapStringArray(raw?.tags),
    checkpointFrequency: normalizeCheckpointFrequency(
      raw?.checkpointFrequency ?? raw?.checkpoint_frequency
    ),
    displayOrder: ensureOptionalNumber(raw?.displayOrder ?? raw?.display_order),
    notificationSettings: mapGoalNotificationSettingsFromApi(
      raw?.notificationSettings ?? raw?.notification_settings
    ),
    motivationMessage: optionalString(raw?.motivationMessage ?? raw?.motivation_message)
  };
};
const mapGoalAssignmentFromApi = (raw) => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  goalId: ensureString(raw?.goalId ?? raw?.goal_id),
  assigneeType: normalizeGoalOwnerType(raw?.assigneeType ?? raw?.assignee_type),
  assigneeId: normalizeGoalOwnerId(raw?.assigneeId ?? raw?.assignee_id) ?? "",
  scope: normalizeGoalAssignmentScope(raw?.scope),
  weight: ensureOptionalNumber(raw?.weight)
});
const mapGoalCheckpointFromApi = (raw) => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  goalId: ensureString(raw?.goalId ?? raw?.goal_id),
  periodStart: ensureString(raw?.periodStart ?? raw?.period_start ?? raw?.period),
  periodEnd: optionalString(raw?.periodEnd ?? raw?.period_end),
  recordedAt: ensureString(raw?.recordedAt ?? raw?.recorded_at ?? (/* @__PURE__ */ new Date()).toISOString()),
  value: ensureNumber(raw?.value, 0),
  notes: optionalString(raw?.notes),
  authorId: ensureOptionalNumber(raw?.authorId ?? raw?.author_id),
  delta: ensureOptionalNumber(raw?.delta)
});
const mapGoalNotificationRuleFromApi = (raw) => ({
  id: ensureString(raw?.id ?? raw?.uuid ?? raw?.slug),
  goalId: ensureString(raw?.goalId ?? raw?.goal_id),
  trigger: normalizeGoalNotificationTriggerValue(raw?.trigger),
  channel: normalizeNotificationChannels([raw?.channel])[0] ?? "inApp",
  message: optionalString(raw?.message),
  recipients: Array.isArray(raw?.recipients) ? raw.recipients.map((recipient) => {
    const type = normalizeGoalOwnerType(recipient?.type ?? recipient?.kind);
    const id = normalizeGoalOwnerId(recipient?.id ?? recipient?.targetId ?? recipient?.target_id);
    if (!id) return null;
    return { type, id };
  }).filter(
    (recipient) => recipient !== null
  ) : [],
  repeat: Boolean(raw?.repeat ?? raw?.recurrent ?? false)
});
const groupCheckpointsByGoal = (checkpoints) => {
  const map = /* @__PURE__ */ new Map();
  checkpoints.forEach((checkpoint) => {
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
const getLatestCheckpoint = (checkpoints) => {
  if (checkpoints.length === 0) return void 0;
  return checkpoints.reduce((latest, checkpoint) => {
    if (!latest) return checkpoint;
    const latestDate = dayjs(latest.recordedAt);
    const currentDate = dayjs(checkpoint.recordedAt);
    return currentDate.isAfter(latestDate) ? checkpoint : latest;
  }, void 0);
};
const computeTasksValue = (goal, context) => {
  const filters = goal.metric.filters;
  const tasksFiltered = context.tasks.filter((task) => {
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
      const lawsuit = task.lawsuitId ? context.lawsuitsById.get(task.lawsuitId) : void 0;
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
  if (goal.metric.aggregation === "sum") {
    const field = goal.metric.field === "value" ? "score" : "score";
    return tasksFiltered.reduce((total, task) => {
      const value = field === "score" ? task.score ?? 0 : task.score ?? 0;
      return total + ensureNumber(value);
    }, 0);
  }
  if (goal.metric.aggregation === "average") {
    const sum = tasksFiltered.reduce((total, task) => total + ensureNumber(task.score, 0), 0);
    return tasksFiltered.length > 0 ? sum / tasksFiltered.length : 0;
  }
  if (goal.metric.aggregation === "percent") {
    const target = goal.targetValue > 0 ? goal.targetValue : tasksFiltered.length;
    return target > 0 ? tasksFiltered.length / target * 100 : 0;
  }
  return tasksFiltered.length;
};
const computeTransactionsValue = (goal, context) => {
  const filters = goal.metric.filters;
  const transactionsFiltered = context.transactions.filter((transaction) => {
    if (filters?.transactionTypes?.length && !filters.transactionTypes.includes(transaction.type)) {
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
  if (goal.metric.aggregation === "count") {
    return transactionsFiltered.length;
  }
  if (goal.metric.aggregation === "average") {
    return transactionsFiltered.length > 0 ? sumValues / transactionsFiltered.length : 0;
  }
  if (goal.metric.aggregation === "percent") {
    const target = goal.targetValue > 0 ? goal.targetValue : sumValues;
    return target > 0 ? sumValues / target * 100 : 0;
  }
  return sumValues;
};
const computeContactsValue = (goal, context) => {
  const filters = goal.metric.filters;
  const contactsFiltered = context.contacts.filter((contact) => {
    if (filters?.contactStatus?.length && !filters.contactStatus.includes(contact.status)) {
      return false;
    }
    if (!matchesOwnerFilter(contact.ownerId, filters?.owners)) {
      return false;
    }
    if (filters?.tags?.length) {
      const contactTags = [contact.categoryId, contact.leadCategoryId].filter(Boolean);
      if (!contactTags.some((tag) => filters.tags?.includes(tag))) {
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
  if (goal.metric.aggregation === "percent") {
    const target = goal.targetValue > 0 ? goal.targetValue : contactsFiltered.length;
    return target > 0 ? contactsFiltered.length / target * 100 : 0;
  }
  return contactsFiltered.length;
};
const computeLawsuitsValue = (goal, context) => {
  const filters = goal.metric.filters;
  const lawsuitsFiltered = context.lawsuits.filter((lawsuit) => {
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
  if (goal.metric.aggregation === "percent") {
    const target = goal.targetValue > 0 ? goal.targetValue : lawsuitsFiltered.length;
    return target > 0 ? lawsuitsFiltered.length / target * 100 : 0;
  }
  return goal.metric.aggregation === "sum" ? lawsuitsFiltered.length : lawsuitsFiltered.length;
};
const evaluateGoalStatus = (goal, value) => {
  const target = goal.targetValue;
  if (target <= 0) {
    return value > 0 ? "achieved" : "attention";
  }
  const ratio = value / target;
  const successThreshold = goal.thresholds.success ?? 1;
  const warningThreshold = goal.thresholds.warning ?? 0.8;
  const criticalThreshold = goal.thresholds.critical !== void 0 ? goal.thresholds.critical : Math.min(warningThreshold * 0.7, warningThreshold - 0.1);
  if (ratio >= successThreshold) {
    return "achieved";
  }
  if (ratio >= warningThreshold) {
    return "onTrack";
  }
  if (ratio >= criticalThreshold) {
    return "attention";
  }
  return "critical";
};
const computeGoalSnapshot = (goal, context) => {
  const checkpoints = context.checkpointsIndex.get(goal.id) ?? [];
  let computedValue = goal.currentValue;
  if (goal.metric.source === "manual") {
    const latestCheckpoint = getLatestCheckpoint(checkpoints);
    if (latestCheckpoint) {
      computedValue = ensureNumber(latestCheckpoint.value, computedValue);
    }
  }
  if (goal.autoUpdate) {
    switch (goal.metric.source) {
      case "tasks":
        computedValue = computeTasksValue(goal, context);
        break;
      case "transactions":
        computedValue = computeTransactionsValue(goal, context);
        break;
      case "contacts":
        computedValue = computeContactsValue(goal, context);
        break;
      case "lawsuits":
        computedValue = computeLawsuitsValue(goal, context);
        break;
      case "manual":
      default:
        break;
    }
  }
  const status = evaluateGoalStatus(goal, computedValue);
  return { value: computedValue, status };
};
const AppContext = createContext(void 0);
const AppProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, logout, user: authUser, token, tenantSlug } = useAuth();
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [lawsuits, setLawsuits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [kanbanCards, setKanbanCards] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const [goalPrograms, setGoalPrograms] = useState(() => {
    const stored = loadStoredGoalPrograms();
    return stored ?? cloneGoalPrograms(GOAL_PROGRAMS);
  });
  const [goals, setGoals] = useState(() => {
    const stored = loadStoredGoals();
    return stored ?? cloneGoals(GOALS);
  });
  const [goalAssignments, setGoalAssignments] = useState(() => {
    const stored = loadStoredGoalAssignments();
    return stored ?? cloneGoalAssignments(GOAL_ASSIGNMENTS);
  });
  const [goalCheckpoints, setGoalCheckpoints] = useState(() => {
    const stored = loadStoredGoalCheckpoints();
    return stored ?? cloneGoalCheckpoints(GOAL_CHECKPOINTS);
  });
  const [goalNotificationRules, setGoalNotificationRules] = useState(() => {
    const stored = loadStoredGoalNotifications();
    return stored ?? cloneGoalNotifications(GOAL_NOTIFICATIONS);
  });
  const goalUserProgressRef = useRef(/* @__PURE__ */ new Map());
  const goalUserRankRef = useRef([]);
  const [categoryGroups, setCategoryGroups] = useState(() => {
    const stored = loadStoredCategoryGroups();
    return stored ?? cloneCategoryGroups(CATEGORY_GROUPS);
  });
  const [userRoles, setUserRoles] = useState(() => {
    const stored = loadStoredRoles();
    return stored ?? cloneRoles(USER_ROLES);
  });
  const [notifications, setNotifications] = useState(() => {
    const stored = loadStoredNotifications();
    if (stored && stored.length > 0) {
      return sortNotifications(stored);
    }
    return sortNotifications([...NOTIFICATIONS]);
  });
  const [socialPosts, setSocialPosts] = useState([]);
  const [taskAnnotations, setTaskAnnotations] = useState(
    () => loadAnnotationCache(TASK_NOTES_STORAGE_KEY)
  );
  const [contactAnnotations, setContactAnnotations] = useState(
    () => loadAnnotationCache(CONTACT_NOTES_STORAGE_KEY)
  );
  const [lawsuitAnnotations, setLawsuitAnnotations] = useState(
    () => loadAnnotationCache(LAWSUIT_NOTES_STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const permissionsCatalog = useMemo(
    () => PERMISSIONS.map((definition) => ({ ...definition })),
    []
  );
  const taskAnnotationsRef = useRef(taskAnnotations);
  const tasksRef = useRef(tasks);
  const notificationsRef = useRef(notifications);
  const contactAnnotationsRef = useRef(contactAnnotations);
  const lawsuitsRef = useRef(lawsuits);
  const lawsuitAnnotationsRef = useRef(lawsuitAnnotations);
  const pollDelayRef = useRef(1e4);
  const realtimeActiveRef = useRef(false);
  useEffect(() => {
    taskAnnotationsRef.current = taskAnnotations;
  }, [taskAnnotations]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => {
    lawsuitsRef.current = lawsuits;
  }, [lawsuits]);
  useEffect(() => {
    lawsuitAnnotationsRef.current = lawsuitAnnotations;
  }, [lawsuitAnnotations]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    contactAnnotationsRef.current = contactAnnotations;
  }, [contactAnnotations]);
  const applyTasksPayload = useCallback(
    (rawTasks) => {
      const baseTasks = toArray(rawTasks).map(mapTaskFromApi);
      const annotatedTasks = baseTasks.map((task) => {
        const overrides = taskAnnotationsRef.current[task.id];
        return overrides ? {
          ...task,
          notes: overrides.notes ?? task.notes,
          mentions: overrides.mentions ?? task.mentions
        } : task;
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
    (updater) => {
      setNotifications((prev) => {
        const next = sortNotifications(updater(prev));
        const limited = next.slice(0, 200);
        persistNotifications(limited);
        return limited;
      });
    },
    [setNotifications]
  );
  const applyNotificationsPayload = useCallback(
    (rawNotifications) => {
      const list = toArray(rawNotifications).map(mapNotificationFromApi);
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
    (goalId) => {
      const focusSet = goalId ? /* @__PURE__ */ new Set([goalId]) : null;
      const checkpointsIndex = groupCheckpointsByGoal(goalCheckpoints);
      const lawsuitsById = new Map(lawsuits.map((lawsuit) => [lawsuit.id, lawsuit]));
      const context = {
        tasks,
        transactions,
        contacts,
        lawsuits,
        lawsuitsById,
        checkpointsIndex
      };
      const achievedGoals = [];
      setGoals((prevGoals) => {
        let changed = false;
        const nextGoals = prevGoals.map((goal) => {
          const shouldRecalculate = !focusSet || focusSet.has(goal.id) || goal.autoUpdate || goal.metric.source === "manual";
          if (!shouldRecalculate) {
            return goal;
          }
          const snapshot = computeGoalSnapshot(goal, context);
          const valueChanged = Math.abs(snapshot.value - goal.currentValue) > 1e-4;
          const statusChanged = snapshot.status !== goal.status;
          if (!valueChanged && !statusChanged) {
            return goal;
          }
          changed = true;
          const updated = {
            ...goal,
            currentValue: snapshot.value,
            status: snapshot.status,
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (goal.status !== "achieved" && updated.status === "achieved") {
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
    (goalId) => {
      recalculateGoalsInternal(goalId);
    },
    [recalculateGoalsInternal]
  );
  const updateAnnotationCache = (setter, storageKey, id, notes, mentions) => {
    setter((prev) => {
      const next = { ...prev };
      const sanitizedMentions = mentions?.filter(Boolean) ?? [];
      if ((!notes || notes.trim().length === 0) && sanitizedMentions.length === 0) {
        delete next[id];
      } else {
        next[id] = {
          notes: notes?.trim() || void 0,
          mentions: sanitizedMentions
        };
      }
      persistAnnotationCache(storageKey, next);
      return next;
    });
  };
  const refreshAnnotationCache = (setter, storageKey, currentCache, items) => {
    const next = { ...currentCache };
    items.forEach((item) => {
      const sanitizedNotes = item.notes?.trim() || "";
      const sanitizedMentions = item.mentions ?? [];
      if (!sanitizedNotes && sanitizedMentions.length === 0) {
        delete next[item.id];
      } else {
        next[item.id] = {
          notes: sanitizedNotes || void 0,
          mentions: sanitizedMentions
        };
      }
    });
    persistAnnotationCache(storageKey, next);
    setter(next);
  };
  useEffect(() => {
    recalculateGoalsInternal();
  }, [recalculateGoalsInternal]);
  const markNotificationAsRead = (notificationId) => {
    updateNotificationsState(
      (prev) => prev.map(
        (notification) => notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
    if (!isUsingMockApi) {
      apiClient.post(`/notifications/${notificationId}/read`, {}).catch((error2) => {
        console.warn("Falha ao marcar notifica\xE7\xE3o como lida.", error2);
      });
    }
  };
  const markAllNotificationsAsRead = (recipientId) => {
    updateNotificationsState(
      (prev) => prev.map(
        (notification) => notification.recipientId === recipientId ? { ...notification, isRead: true } : notification
      )
    );
    if (!isUsingMockApi) {
      apiClient.post("/notifications/read-all", {}).catch((error2) => {
        console.warn("Falha ao marcar todas notifica\xE7\xF5es como lidas.", error2);
      });
    }
  };
  const createNotificationsForMentions = (mentions, entityType, entityId, entityLabel) => {
    if (!Array.isArray(mentions) || mentions.length === 0) return;
    if (!isUsingMockApi) {
      return;
    }
    const actorId = authUser?.id ?? null;
    const actorName = authUser?.name ?? "Algu\xE9m";
    const uniqueUserMentions = /* @__PURE__ */ new Map();
    mentions.forEach((mention) => {
      if (mention.kind !== "user") return;
      if (mention.id <= 0) return;
      if (!uniqueUserMentions.has(mention.id)) {
        uniqueUserMentions.set(mention.id, mention);
      }
    });
    if (uniqueUserMentions.size === 0) return;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const contextLabel = entityType === "task" ? `na tarefa "${entityLabel}"` : entityType === "lawsuit" ? `no processo "${entityLabel}"` : `no contato "${entityLabel}"`;
    const newNotifications = Array.from(uniqueUserMentions.values()).map(
      (mention) => ({
        id: generateNotificationId(),
        recipientId: mention.id,
        actorId: actorId ?? void 0,
        title: "Voc\xEA foi mencionado",
        message: `${actorName} mencionou voc\xEA ${contextLabel}.`,
        createdAt,
        isRead: false,
        entityType,
        entityId
      })
    );
    updateNotificationsState((prev) => [...newNotifications, ...prev]);
  };
  const ensureResponsibleMention = useCallback(
    (mentions, responsibleId) => {
      if (!responsibleId) {
        return Array.isArray(mentions) ? [...mentions] : [];
      }
      const normalized = Array.isArray(mentions) ? [...mentions] : [];
      const alreadyMentioned = normalized.some(
        (mention) => mention.kind === "user" && mention.id === responsibleId
      );
      if (alreadyMentioned) {
        return normalized;
      }
      const responsibleUser = users.find((user) => user.id === responsibleId);
      if (!responsibleUser) {
        return normalized;
      }
      return [
        ...normalized,
        {
          id: responsibleUser.id,
          kind: "user",
          label: responsibleUser.name
        }
      ];
    },
    [users]
  );
  const pushNotification = (recipientId, {
    title,
    message,
    entityId = 0,
    entityType = "goal",
    actorId
  }) => {
    if (!recipientId || recipientId <= 0) return;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const notification = {
      id: generateNotificationId(),
      recipientId,
      actorId: actorId ?? void 0,
      title,
      message,
      createdAt,
      isRead: false,
      entityType,
      entityId
    };
    updateNotificationsState((prev) => [notification, ...prev]);
    if (!isUsingMockApi) {
      apiClient.post("/notifications", {
        recipient_id: recipientId,
        actor_id: actorId ?? null,
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
        created_at: createdAt
      }).catch((error2) => {
        console.warn("Falha ao registrar notifica\xE7\xE3o de metas", error2);
      });
    }
  };
  const getGoalRecipientIds = (goal, assignments, includeOwner = true) => {
    const recipients = /* @__PURE__ */ new Set();
    if (includeOwner && goal.ownerType === "user" && typeof goal.ownerId === "number") {
      recipients.add(goal.ownerId);
    }
    assignments.forEach((assignment) => {
      if (assignment.goalId !== goal.id) return;
      if (assignment.assigneeType !== "user") return;
      const numericId = Number(assignment.assigneeId);
      if (Number.isFinite(numericId)) {
        recipients.add(numericId);
      }
    });
    return Array.from(recipients);
  };
  const notifyGoalEvent = (goal, title, message, options) => {
    const exclude = options?.exclude ?? /* @__PURE__ */ new Set();
    const recipients = getGoalRecipientIds(goal, goalAssignments, true);
    const actorId = options?.actorId ?? authUser?.id ?? null;
    recipients.forEach((recipientId) => {
      if (exclude.has(recipientId)) return;
      pushNotification(recipientId, {
        title,
        message,
        entityId: goal.id,
        entityType: "goal",
        actorId
      });
    });
    if (recipients.length === 0 && actorId && !exclude.has(actorId)) {
      pushNotification(actorId, {
        title,
        message,
        entityId: goal.id,
        entityType: "goal",
        actorId
      });
    }
  };
  const notifyGoalAchievement = (goal) => {
    const title = "Meta conclu\xEDda";
    const message = `A meta "${goal.title}" foi conclu\xEDda com sucesso!`;
    const exclude = /* @__PURE__ */ new Set();
    if (authUser?.id) {
      exclude.add(authUser.id);
    }
    notifyGoalEvent(goal, title, message, { exclude });
  };
  const notifyGoalCreated = (goal) => {
    const title = "Nova meta registrada";
    const message = `A meta "${goal.title}" foi criada.`;
    notifyGoalEvent(goal, title, message, { actorId: authUser?.id ?? null });
  };
  const notifyGoalUpdated = (goal) => {
    const title = "Meta atualizada";
    const message = `A meta "${goal.title}" recebeu atualiza\xE7\xF5es.`;
    notifyGoalEvent(goal, title, message, { actorId: authUser?.id ?? null });
  };
  const handleRealtimeTaskUpsert = useCallback(
    (rawTask) => {
      if (!rawTask) return;
      const mapped = mapTaskFromApi(rawTask);
      const overrides = taskAnnotationsRef.current[mapped.id];
      const annotated = overrides ? {
        ...mapped,
        notes: overrides.notes ?? mapped.notes,
        mentions: overrides.mentions ?? mapped.mentions
      } : mapped;
      setTasks((prev) => {
        const index = prev.findIndex((task) => task.id === annotated.id);
        if (index === -1) {
          return [...prev, annotated];
        }
        const next = [...prev];
        next[index] = { ...prev[index], ...annotated };
        return next;
      });
      updateAnnotationCache(
        setTaskAnnotations,
        TASK_NOTES_STORAGE_KEY,
        annotated.id,
        annotated.notes,
        annotated.mentions
      );
    },
    [setTasks, setTaskAnnotations, updateAnnotationCache]
  );
  const handleRealtimeLawsuitUpsert = useCallback(
    (rawLawsuit) => {
      if (!rawLawsuit) return;
      const syncStateFromPayload = (payload) => {
        const mapped = mapLawsuitFromApi(payload);
        const overrides = lawsuitAnnotationsRef.current[mapped.id];
        const annotated = overrides ? {
          ...mapped,
          notes: overrides.notes ?? mapped.notes,
          mentions: overrides.mentions ?? mapped.mentions
        } : mapped;
        setLawsuits((prev) => {
          const withoutCurrent = prev.filter((item) => item.id !== annotated.id);
          return [annotated, ...withoutCurrent];
        });
        const card = mapKanbanCardFromLawsuit(payload);
        const cardId = `lawsuit-${annotated.id}`;
        setKanbanCards((prev) => [{ ...card, id: cardId }, ...prev.filter((item) => item.id !== cardId)]);
        updateAnnotationCache(
          setLawsuitAnnotations,
          LAWSUIT_NOTES_STORAGE_KEY,
          annotated.id,
          annotated.notes,
          annotated.mentions
        );
        return annotated.id;
      };
      const lawsuitId = syncStateFromPayload(rawLawsuit);
      if (!isUsingMockApi) {
        apiClient.get(`/lawsuits/${lawsuitId}`).then(syncStateFromPayload).catch(() => {
        });
      }
    },
    [setLawsuits, setKanbanCards, setLawsuitAnnotations, updateAnnotationCache, isUsingMockApi]
  );
  const handleRealtimeTaskDeleted = useCallback(
    (payload) => {
      const taskId = ensureNumber(payload?.id ?? payload);
      if (!taskId) return;
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setTaskAnnotations((prev) => {
        if (!prev[taskId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[taskId];
        persistAnnotationCache(TASK_NOTES_STORAGE_KEY, next);
        return next;
      });
    },
    [setTasks, setTaskAnnotations]
  );
  const handleRealtimeLawsuitDeleted = useCallback(
    (payload) => {
      const lawsuitId = ensureNumber(payload?.id ?? payload);
      if (!lawsuitId) return;
      setLawsuits((prev) => prev.filter((lawsuit) => lawsuit.id !== lawsuitId));
      setKanbanCards((prev) => prev.filter((card) => card.id !== `lawsuit-${lawsuitId}`));
      setLawsuitAnnotations((prev) => {
        if (!prev[lawsuitId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[lawsuitId];
        persistAnnotationCache(LAWSUIT_NOTES_STORAGE_KEY, next);
        return next;
      });
      setTasks(
        (prev) => prev.map(
          (task) => task.lawsuitId === lawsuitId ? { ...task, lawsuitId: void 0 } : task
        )
      );
    },
    [setLawsuits, setKanbanCards, setLawsuitAnnotations, setTasks]
  );
  const handleRealtimeContactUpsert = useCallback(
    (payload) => {
      if (!payload) return;
      const mapped = mapContactFromApi(payload);
      const overrides = contactAnnotationsRef.current[mapped.id];
      const annotated = overrides ? {
        ...mapped,
        notes: overrides.notes ?? mapped.notes,
        mentions: overrides.mentions ?? mapped.mentions
      } : mapped;
      setContacts((prev) => {
        const withoutCurrent = prev.filter((contact) => contact.id !== annotated.id);
        return [annotated, ...withoutCurrent];
      });
      updateAnnotationCache(
        setContactAnnotations,
        CONTACT_NOTES_STORAGE_KEY,
        annotated.id,
        annotated.notes,
        annotated.mentions
      );
    },
    [setContacts, setContactAnnotations, updateAnnotationCache]
  );
  const handleRealtimeContactDeleted = useCallback(
    (payload) => {
      const contactId = ensureNumber(payload?.id ?? payload);
      if (!contactId) return;
      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
      setContactAnnotations((prev) => {
        if (!prev[contactId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[contactId];
        persistAnnotationCache(CONTACT_NOTES_STORAGE_KEY, next);
        return next;
      });
      setPaymentSchedules((prev) => prev.filter((schedule) => schedule.contactId !== contactId));
    },
    [setContacts, setContactAnnotations, setPaymentSchedules]
  );
  const handleRealtimeTransactionUpsert = useCallback(
    (payload) => {
      if (!payload) return;
      const mapped = mapTransactionFromApi(payload);
      setTransactions((prev) => {
        const without = prev.filter((transaction) => transaction.id !== mapped.id);
        const next = [mapped, ...without];
        next.sort((a, b) => {
          const timeA = a.date ? dayjs(a.date).valueOf() : 0;
          const timeB = b.date ? dayjs(b.date).valueOf() : 0;
          return timeB - timeA;
        });
        return next;
      });
    },
    [setTransactions]
  );
  const handleRealtimeTransactionDeleted = useCallback(
    (payload) => {
      const transactionId = ensureNumber(payload?.id ?? payload);
      if (!transactionId) return;
      setTransactions((prev) => prev.filter((transaction) => transaction.id !== transactionId));
    },
    [setTransactions]
  );
  const handleRealtimeCalendarEventUpsert = useCallback(
    (payload) => {
      if (!payload) return;
      const mapped = mapCalendarEventFromApi(payload);
      setCalendarEvents((prev) => {
        const without = prev.filter((event) => event.id !== mapped.id);
        const next = [mapped, ...without];
        next.sort((a, b) => {
          const timeA = a.start ? dayjs(a.start).valueOf() : Number.MAX_SAFE_INTEGER;
          const timeB = b.start ? dayjs(b.start).valueOf() : Number.MAX_SAFE_INTEGER;
          return timeA - timeB;
        });
        return next;
      });
    },
    [setCalendarEvents]
  );
  const handleRealtimeCalendarEventDeleted = useCallback(
    (payload) => {
      const eventId = ensureNumber(payload?.id ?? payload);
      if (!eventId) return;
      setCalendarEvents((prev) => prev.filter((event) => event.id !== eventId));
    },
    [setCalendarEvents]
  );
  const handleRealtimeSocialPostUpsert = useCallback(
    (payload) => {
      if (!payload) return;
      const mapped = mapSocialPostFromApi(payload);
      setSocialPosts((prev) => {
        const without = prev.filter((post) => post.id !== mapped.id);
        return [mapped, ...without];
      });
    },
    [setSocialPosts]
  );
  const handleRealtimeSocialPostDeleted = useCallback(
    (payload) => {
      const postId = ensureNumber(payload?.id ?? payload?.postId ?? payload?.post_id ?? payload);
      if (!postId) return;
      setSocialPosts((prev) => prev.filter((post) => post.id !== postId));
    },
    [setSocialPosts]
  );
  const handleRealtimeSocialCommentCreated = useCallback(
    (payload) => {
      if (!payload) return;
      const mapped = mapSocialCommentFromApi(payload);
      if (!mapped) return;
      const postId = mapped.postId;
      if (!postId) return;
      setSocialPosts(
        (prev) => prev.map(
          (post) => post.id === postId ? {
            ...post,
            comments: [mapped, ...post.comments.filter((comment) => comment.id !== mapped.id)]
          } : post
        )
      );
    },
    [setSocialPosts]
  );
  const handleRealtimeSocialCommentDeleted = useCallback(
    (payload) => {
      const postId = ensureNumber(payload?.postId ?? payload?.post_id);
      const commentId = ensureNumber(payload?.id ?? payload?.commentId ?? payload?.comment_id);
      if (!postId || !commentId) return;
      setSocialPosts(
        (prev) => prev.map(
          (post) => post.id === postId ? {
            ...post,
            comments: post.comments.filter((comment) => comment.id !== commentId)
          } : post
        )
      );
    },
    [setSocialPosts]
  );
  const handleRealtimeSocialLikeUpdated = useCallback(
    (payload) => {
      const postId = ensureNumber(payload?.postId ?? payload?.post_id);
      if (!postId) return;
      const likesCount = ensureNumber(payload?.likesCount ?? payload?.likes_count);
      const likerIdsRaw = Array.isArray(payload?.likerIds ?? payload?.liker_ids) ? payload.likerIds ?? payload.liker_ids : [];
      const likerIds = likerIdsRaw.map((id) => Number(id)).filter((id) => Number.isFinite(id));
      const currentUserId = authUser?.id;
      setSocialPosts(
        (prev) => prev.map(
          (post) => post.id === postId ? {
            ...post,
            likesCount,
            isLiked: currentUserId ? likerIds.includes(currentUserId) : post.isLiked
          } : post
        )
      );
    },
    [setSocialPosts, authUser?.id]
  );
  const handleRealtimeNotificationCreated = useCallback(
    (payload) => {
      if (!payload) return;
      const mapped = mapNotificationFromApi(payload);
      updateNotificationsState((prev) => {
        const index = prev.findIndex((item) => item.id === mapped.id);
        if (index !== -1) {
          const next = [...prev];
          next[index] = { ...next[index], ...mapped };
          return next;
        }
        return [mapped, ...prev];
      });
    },
    [updateNotificationsState]
  );
  const createSocialPost = async ({
    content,
    image,
    mentions
  }) => {
    const normalizedContent = content?.trim() ?? "";
    if (!normalizedContent && !image) {
      return;
    }
    try {
      if (isUsingMockApi) {
        const newPost = {
          id: Date.now(),
          tenantId: authUser?.tenantId ?? authUser?.tenant?.id ?? 0,
          userId: authUser?.id ?? 0,
          content: normalizedContent,
          imageUrl: image ? URL.createObjectURL(image) : null,
          likesCount: 0,
          isLiked: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          user: authUser ?? void 0,
          comments: [],
          mentions: mentions ?? []
        };
        setSocialPosts((prev) => [newPost, ...prev]);
        setError(null);
        return;
      }
      const formData = new FormData();
      if (normalizedContent) {
        formData.append("content", normalizedContent);
      }
      if (image) {
        formData.append("image", image);
      }
      if (Array.isArray(mentions)) {
        formData.append("mentions", JSON.stringify(mentions));
      }
      const response = await apiClient.post("/social/posts", formData);
      const mapped = mapSocialPostFromApi(response);
      if (!mapped) {
        return;
      }
      setSocialPosts((prev) => [mapped, ...prev.filter((post) => post.id !== mapped.id)]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel publicar a atualiza\xE7\xE3o.");
      throw err;
    }
  };
  const deleteSocialPost = async (postId) => {
    try {
      if (!isUsingMockApi) {
        await apiClient.delete(`/social/posts/${postId}`);
      }
      setSocialPosts((prev) => prev.filter((post) => post.id !== postId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel remover a publica\xE7\xE3o.");
      throw err;
    }
  };
  const toggleSocialPostLike = async (postId) => {
    try {
      if (isUsingMockApi) {
        setSocialPosts(
          (prev) => prev.map(
            (post) => post.id === postId ? {
              ...post,
              likesCount: post.isLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
              isLiked: !post.isLiked
            } : post
          )
        );
        return;
      }
      const response = await apiClient.post(`/social/posts/${postId}/like`, {});
      const likesCount = ensureNumber(response?.likesCount ?? response?.likes_count);
      const isLiked = Boolean(response?.isLiked ?? response?.is_liked);
      setSocialPosts(
        (prev) => prev.map((post) => post.id === postId ? { ...post, likesCount, isLiked } : post)
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel atualizar a rea\xE7\xE3o da publica\xE7\xE3o.");
      throw err;
    }
  };
  const addSocialComment = async (postId, body, mentions) => {
    const normalizedBody = body.trim();
    if (!normalizedBody) return;
    try {
      if (isUsingMockApi) {
        const newComment = {
          id: Date.now(),
          postId,
          userId: authUser?.id ?? 0,
          tenantId: authUser?.tenantId ?? authUser?.tenant?.id ?? 0,
          body: normalizedBody,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          user: authUser ?? void 0,
          mentions: mentions ?? []
        };
        setSocialPosts(
          (prev) => prev.map(
            (post) => post.id === postId ? { ...post, comments: [newComment, ...post.comments] } : post
          )
        );
        setError(null);
        return;
      }
      const response = await apiClient.post(`/social/posts/${postId}/comments`, {
        body: normalizedBody,
        mentions: mentions ?? []
      });
      const mapped = mapSocialCommentFromApi(response);
      if (!mapped) {
        return;
      }
      setSocialPosts(
        (prev) => prev.map(
          (post) => post.id === postId ? {
            ...post,
            comments: [mapped, ...post.comments.filter((comment) => comment.id !== mapped.id)]
          } : post
        )
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel adicionar o coment\xE1rio.");
      throw err;
    }
  };
  const deleteSocialComment = async (postId, commentId) => {
    try {
      if (!isUsingMockApi) {
        await apiClient.delete(`/social/posts/${postId}/comments/${commentId}`);
      }
      setSocialPosts(
        (prev) => prev.map(
          (post) => post.id === postId ? {
            ...post,
            comments: post.comments.filter((comment) => comment.id !== commentId)
          } : post
        )
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel remover o coment\xE1rio.");
      throw err;
    }
  };
  const notifyGoalAssignmentAdded = (goal, assigneeId) => {
    if (!Number.isFinite(assigneeId)) return;
    if (authUser?.id && authUser.id === assigneeId) return;
    pushNotification(assigneeId, {
      title: "Nova meta atribu\xEDda",
      message: `Voc\xEA foi inclu\xEDdo na meta "${goal.title}".`,
      entityId: goal.id,
      entityType: "goal",
      actorId: authUser?.id ?? null
    });
    const actorId = authUser?.id ?? null;
    if (actorId) {
      pushNotification(actorId, {
        title: "Colaborador adicionado",
        message: `Voc\xEA adicionou um colaborador \xE0 meta "${goal.title}".`,
        entityId: goal.id,
        entityType: "goal",
        actorId
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
      setSocialPosts([]);
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
          socialPostsRaw,
          paymentSchedulesRaw,
          kanbanRaw,
          goalProgramsRaw,
          goalsRaw,
          goalAssignmentsRaw,
          goalCheckpointsRaw,
          goalNotificationsRaw
        ] = await Promise.all([
          apiClient.get("/users"),
          apiClient.get("/contacts"),
          apiClient.get("/lawsuits"),
          apiClient.get("/tasks"),
          apiClient.get("/calendar-events"),
          apiClient.get("/transactions"),
          apiClient.get("/social/posts"),
          isUsingMockApi ? Promise.resolve([]) : apiClient.get("/payment-schedules"),
          isUsingMockApi ? apiClient.get("/kanban-cards") : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection("/goal-programs") : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection("/goals") : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection("/goal-assignments") : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection("/goal-checkpoints") : Promise.resolve(null),
          isUsingMockApi ? fetchOptionalCollection("/goal-notifications") : Promise.resolve(null)
        ]);
        if (isCancelled) return;
        const lawsuitsRawList = toArray(lawsuitsRaw);
        const lawsuitsList = lawsuitsRawList.map(mapLawsuitFromApi);
        setUsers(toArray(usersRaw).map(mapUserFromApi));
        applyTasksPayload(tasksRaw);
        setCalendarEvents(toArray(calendarRaw).map(mapCalendarEventFromApi));
        setTransactions(toArray(transactionsRaw).map(mapTransactionFromApi));
        setPaymentSchedules(toArray(paymentSchedulesRaw).map(mapPaymentScheduleFromApi));
        setKanbanCards(
          isUsingMockApi ? toArray(kanbanRaw).map(mapKanbanCardFromMock) : lawsuitsList.map(mapKanbanCardFromLawsuit)
        );
        const goalProgramsFromApi = toArray(goalProgramsRaw).map(mapGoalProgramFromApi);
        const resolvedGoalPrograms = goalProgramsFromApi.length > 0 ? cloneGoalPrograms(goalProgramsFromApi) : loadStoredGoalPrograms() ?? cloneGoalPrograms(GOAL_PROGRAMS);
        setGoalPrograms(resolvedGoalPrograms);
        persistGoalPrograms(resolvedGoalPrograms);
        const goalsFromApi = toArray(goalsRaw).map(mapGoalFromApi);
        const resolvedGoals = goalsFromApi.length > 0 ? cloneGoals(goalsFromApi) : loadStoredGoals() ?? cloneGoals(GOALS);
        setGoals(resolvedGoals);
        persistGoals(resolvedGoals);
        const goalAssignmentsFromApi = toArray(goalAssignmentsRaw).map(mapGoalAssignmentFromApi).filter((assignment) => {
          const assigneeId = assignment.assigneeId;
          const hasAssignee = assigneeId !== void 0 && assigneeId !== null && String(assigneeId).trim().length > 0;
          return assignment.goalId && hasAssignee;
        });
        const resolvedGoalAssignments = goalAssignmentsFromApi.length > 0 ? cloneGoalAssignments(goalAssignmentsFromApi) : loadStoredGoalAssignments() ?? cloneGoalAssignments(GOAL_ASSIGNMENTS);
        setGoalAssignments(resolvedGoalAssignments);
        persistGoalAssignments(resolvedGoalAssignments);
        const goalCheckpointsFromApi = toArray(goalCheckpointsRaw).map(
          mapGoalCheckpointFromApi
        );
        const resolvedGoalCheckpoints = goalCheckpointsFromApi.length > 0 ? cloneGoalCheckpoints(goalCheckpointsFromApi) : loadStoredGoalCheckpoints() ?? cloneGoalCheckpoints(GOAL_CHECKPOINTS);
        setGoalCheckpoints(resolvedGoalCheckpoints);
        persistGoalCheckpoints(resolvedGoalCheckpoints);
        const goalNotificationsFromApi = toArray(goalNotificationsRaw).map(
          mapGoalNotificationRuleFromApi
        );
        const resolvedGoalNotifications = goalNotificationsFromApi.length > 0 ? cloneGoalNotifications(goalNotificationsFromApi) : loadStoredGoalNotifications() ?? cloneGoalNotifications(GOAL_NOTIFICATIONS);
        setGoalNotificationRules(resolvedGoalNotifications);
        persistGoalNotifications(resolvedGoalNotifications);
        const lawsuitsWithNotes = lawsuitsList.map((lawsuit) => {
          const overrides = lawsuitAnnotations[lawsuit.id];
          return overrides ? {
            ...lawsuit,
            notes: overrides.notes ?? lawsuit.notes,
            mentions: overrides.mentions ?? lawsuit.mentions
          } : lawsuit;
        });
        setLawsuits(lawsuitsWithNotes);
        refreshAnnotationCache(
          setLawsuitAnnotations,
          LAWSUIT_NOTES_STORAGE_KEY,
          lawsuitAnnotations,
          lawsuitsWithNotes
        );
        const contactsList = toArray(contactsRaw).map(mapContactFromApi).map((contact) => {
          const overrides = contactAnnotations[contact.id];
          return overrides ? {
            ...contact,
            notes: overrides.notes ?? contact.notes,
            mentions: overrides.mentions ?? contact.mentions
          } : contact;
        });
        setContacts(contactsList);
        refreshAnnotationCache(
          setContactAnnotations,
          CONTACT_NOTES_STORAGE_KEY,
          contactAnnotations,
          contactsList
        );
        const socialPostsList = toArray(socialPostsRaw).map(mapSocialPostFromApi).filter((post) => Boolean(post));
        setSocialPosts(socialPostsList);
        let notificationsPayload = null;
        if (isUsingMockApi) {
          notificationsPayload = NOTIFICATIONS;
        } else {
          try {
            notificationsPayload = await apiClient.get("/notifications");
          } catch (notifError) {
            if (!(notifError instanceof ApiError && notifError.status === 404)) {
              throw notifError;
            }
            notificationsPayload = null;
          }
        }
        const notificationsFromApi = toArray(notificationsPayload).map(mapNotificationFromApi);
        const mergedNotifications = notificationsFromApi.length > 0 ? notificationsFromApi : loadStoredNotifications() ?? [...NOTIFICATIONS];
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
            setError("Sua sess\xE3o expirou. Fa\xE7a login novamente.");
          }
        } else if (!isCancelled) {
          setError("Falha ao carregar os dados do servidor. Verifique sua conex\xE3o e autentica\xE7\xE3o.");
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
    if (authLoading) {
      return;
    }
    if (!isAuthenticated || isUsingMockApi) {
      if (realtimeActiveRef.current) {
        disconnectRealtime();
        realtimeActiveRef.current = false;
        setIsRealtimeActive(false);
      }
      return;
    }
    const tenantId = authUser?.tenantId ?? authUser?.tenant?.id ?? null;
    const userId = authUser?.id ?? null;
    const effectiveTenantSlug = tenantSlug ?? authUser?.tenant?.slug ?? null;
    if (!token || !tenantId || !userId) {
      if (realtimeActiveRef.current) {
        disconnectRealtime();
        realtimeActiveRef.current = false;
        setIsRealtimeActive(false);
      }
      return;
    }
    const instance = initRealtime({ token, tenantSlug: effectiveTenantSlug });
    if (!instance) {
      realtimeActiveRef.current = false;
      setIsRealtimeActive(false);
      return;
    }
    realtimeActiveRef.current = true;
    setIsRealtimeActive(true);
    const unsubscribe = subscribeToTenantChannels(tenantId, userId, {
      onTaskCreated: handleRealtimeTaskUpsert,
      onTaskUpdated: handleRealtimeTaskUpsert,
      onTaskDeleted: handleRealtimeTaskDeleted,
      onLawsuitCreated: handleRealtimeLawsuitUpsert,
      onLawsuitUpdated: handleRealtimeLawsuitUpsert,
      onLawsuitDeleted: handleRealtimeLawsuitDeleted,
      onContactCreated: handleRealtimeContactUpsert,
      onContactUpdated: handleRealtimeContactUpsert,
      onContactDeleted: handleRealtimeContactDeleted,
      onTransactionCreated: handleRealtimeTransactionUpsert,
      onTransactionUpdated: handleRealtimeTransactionUpsert,
      onTransactionDeleted: handleRealtimeTransactionDeleted,
      onCalendarEventCreated: handleRealtimeCalendarEventUpsert,
      onCalendarEventUpdated: handleRealtimeCalendarEventUpsert,
      onCalendarEventDeleted: handleRealtimeCalendarEventDeleted,
      onSocialPostCreated: handleRealtimeSocialPostUpsert,
      onSocialPostDeleted: handleRealtimeSocialPostDeleted,
      onSocialCommentCreated: handleRealtimeSocialCommentCreated,
      onSocialCommentDeleted: handleRealtimeSocialCommentDeleted,
      onSocialLikeUpdated: handleRealtimeSocialLikeUpdated,
      onNotificationCreated: handleRealtimeNotificationCreated
    });
    return () => {
      unsubscribe?.();
      disconnectRealtime();
      realtimeActiveRef.current = false;
      setIsRealtimeActive(false);
    };
  }, [
    authLoading,
    isAuthenticated,
    isUsingMockApi,
    token,
    tenantSlug,
    authUser?.tenantId,
    authUser?.tenant?.id,
    authUser?.tenant?.slug,
    authUser?.id,
    handleRealtimeTaskUpsert,
    handleRealtimeTaskDeleted,
    handleRealtimeLawsuitUpsert,
    handleRealtimeLawsuitDeleted,
    handleRealtimeContactUpsert,
    handleRealtimeContactDeleted,
    handleRealtimeTransactionUpsert,
    handleRealtimeTransactionDeleted,
    handleRealtimeCalendarEventUpsert,
    handleRealtimeCalendarEventDeleted,
    handleRealtimeSocialPostUpsert,
    handleRealtimeSocialPostDeleted,
    handleRealtimeSocialCommentCreated,
    handleRealtimeSocialCommentDeleted,
    handleRealtimeSocialLikeUpdated,
    handleRealtimeNotificationCreated
  ]);
  useEffect(() => {
    if (authLoading || !isAuthenticated || isUsingMockApi || !isBrowserEnvironment || isRealtimeActive) {
      return;
    }
    let cancelled = false;
    let timeoutId = null;
    const POLL_MIN = 1e4;
    const POLL_MAX = 6e4;
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
        const tasksPayload = await apiClient.get("/tasks");
        if (!cancelled) {
          const changed = applyTasksPayload(tasksPayload);
          if (changed) {
            shouldResetDelay = true;
          }
        }
      } catch (error2) {
        if (!cancelled) {
          console.warn("Falha ao sincronizar tarefas.", error2);
          shouldResetDelay = true;
        }
      }
      if (!cancelled) {
        try {
          const notificationsPayload = await apiClient.get("/notifications");
          if (!cancelled) {
            const changed = applyNotificationsPayload(notificationsPayload);
            if (changed) {
              shouldResetDelay = true;
            }
          }
        } catch (error2) {
          if (!cancelled) {
            const isNotFound = error2 instanceof ApiError && error2.status === 404;
            if (!isNotFound) {
              console.warn("Falha ao sincronizar notifica\xE7\xF5es.", error2);
              shouldResetDelay = true;
            }
          }
        }
      }
      if (cancelled) {
        return;
      }
      pollDelayRef.current = shouldResetDelay ? POLL_MIN : Math.min(POLL_MAX, Math.round(pollDelayRef.current * BACKOFF_FACTOR));
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
    isRealtimeActive,
    applyTasksPayload,
    applyNotificationsPayload
  ]);
  const updateKanbanCardColumn = async (cardId, newColumn, newPhase) => {
    const lawsuitId = extractLawsuitIdFromCard(cardId);
    try {
      if (!isUsingMockApi && lawsuitId) {
        await apiClient.put(`/lawsuits/${lawsuitId}/kanban`, {
          kanban_column: newColumn,
          kanban_phase: newPhase
        });
      }
      setKanbanCards(
        (prev) => prev.map(
          (card) => card.id === cardId ? { ...card, column: newColumn, phase: newPhase } : card
        )
      );
      if (lawsuitId) {
        setLawsuits(
          (prev) => prev.map(
            (lawsuit) => lawsuit.id === lawsuitId ? { ...lawsuit, kanbanColumn: newColumn, kanbanPhase: newPhase } : lawsuit
          )
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel atualizar o card no backend.");
      throw err;
    }
  };
  const updateKanbanCardDetails = async (cardId, updates) => {
    const lawsuitId = extractLawsuitIdFromCard(cardId);
    const hasDeadlineUpdate = Object.prototype.hasOwnProperty.call(updates, "deadline");
    try {
      if (!isUsingMockApi && lawsuitId) {
        const payload = {};
        if (Object.prototype.hasOwnProperty.call(updates, "responsibleId")) {
          payload.responsible_id = updates.responsibleId ?? null;
        }
        if (updates.area && updates.area !== "N\xE3o definido") {
          payload.area = updates.area;
        }
        if (Object.prototype.hasOwnProperty.call(updates, "title") && updates.title) {
          payload.internal_number = updates.title;
        }
        if (hasDeadlineUpdate) {
          payload.deadline = updates.deadline ? formatDateForApi(updates.deadline) : null;
        }
        if (Object.keys(payload).length > 0) {
          const response = await apiClient.put(`/lawsuits/${lawsuitId}`, payload);
          const mappedLawsuit = mapLawsuitFromApi(response);
          const mappedCard = mapKanbanCardFromLawsuit(mappedLawsuit);
          setLawsuits(
            (prev) => prev.map((lawsuit) => lawsuit.id === lawsuitId ? mappedLawsuit : lawsuit)
          );
          setKanbanCards(
            (prev) => prev.map(
              (card) => card.id === cardId ? {
                ...mappedCard,
                title: updates.title ?? mappedCard.title,
                description: updates.description ?? mappedCard.description,
                area: updates.area ?? mappedCard.area,
                responsibleId: updates.responsibleId ?? mappedCard.responsibleId,
                hasAttachments: updates.hasAttachments ?? mappedCard.hasAttachments,
                hasReminder: updates.hasReminder ?? mappedCard.hasReminder,
                commentsCount: updates.commentsCount ?? mappedCard.commentsCount,
                isDelayed: updates.isDelayed ?? mappedCard.isDelayed,
                deadline: hasDeadlineUpdate ? updates.deadline ?? void 0 : mappedCard.deadline
              } : card
            )
          );
        } else {
          setKanbanCards(
            (prev) => prev.map(
              (card) => card.id === cardId ? {
                ...card,
                ...updates
              } : card
            )
          );
        }
      } else {
        setKanbanCards(
          (prev) => prev.map(
            (card) => card.id === cardId ? {
              ...card,
              ...updates
            } : card
          )
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel atualizar os detalhes do card.");
      throw err;
    }
  };
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      let updatedTask = null;
      if (!isUsingMockApi) {
        const response = await apiClient.put(`/tasks/${taskId}/status`, { status: newStatus });
        if (response) {
          updatedTask = mapTaskFromApi(response);
        }
      }
      setTasks(
        (prev) => prev.map(
          (task) => task.id === taskId ? updatedTask ?? { ...task, status: newStatus } : task
        )
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel atualizar o status da tarefa no backend.");
      throw err;
    }
  };
  const updateTask = async (taskId, data) => {
    const previousTask = tasks.find((task) => task.id === taskId);
    try {
      if (isUsingMockApi) {
        setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, ...data } : task));
        updateAnnotationCache(
          setTaskAnnotations,
          TASK_NOTES_STORAGE_KEY,
          taskId,
          data.notes ?? previousTask?.notes,
          data.mentions ?? previousTask?.mentions
        );
        if (data.mentions && previousTask) {
          const previousSet = new Set(
            (previousTask.mentions ?? []).filter((mention) => mention.kind === "user").map((mention) => mention.id)
          );
          const newMentions = (data.mentions ?? []).filter(
            (mention) => mention.kind === "user" && !previousSet.has(mention.id)
          );
          if (newMentions.length > 0) {
            createNotificationsForMentions(newMentions, "task", previousTask.id, previousTask.title);
          }
        }
        return;
      }
      const payload = {};
      if (Object.prototype.hasOwnProperty.call(data, "title")) {
        payload.title = data.title;
      }
      if (Object.prototype.hasOwnProperty.call(data, "status")) {
        payload.status = data.status;
      }
      if (Object.prototype.hasOwnProperty.call(data, "score")) {
        payload.score = data.score;
      }
      if (Object.prototype.hasOwnProperty.call(data, "dueDate")) {
        const dueDate = data.dueDate;
        payload.due_date = dueDate ? formatDateForApi(dueDate) : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, "deadline")) {
        const deadline = data.deadline;
        payload.deadline = deadline ? formatDateForApi(deadline) : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, "responsibleId")) {
        payload.responsible_id = data.responsibleId;
      }
      if (Object.prototype.hasOwnProperty.call(data, "lawsuitId")) {
        payload.lawsuit_id = data.lawsuitId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, "clientId")) {
        payload.client_id = data.clientId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, "categoryId")) {
        payload.category_id = data.categoryId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, "notes")) {
        payload.notes = data.notes ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, "mentions")) {
        payload.mentions = (data.mentions ?? []).map((mention) => ({
          id: mention.id,
          kind: mention.kind
        }));
      }
      const response = await apiClient.put(`/tasks/${taskId}`, payload);
      const mapped = mapTaskFromApi(response);
      const enriched = {
        ...mapped,
        notes: Object.prototype.hasOwnProperty.call(data, "notes") ? data.notes : mapped.notes,
        mentions: data.mentions ?? mapped.mentions ?? []
      };
      setTasks((prev) => prev.map((task) => task.id === taskId ? enriched : task));
      if (previousTask) {
        const previousSet = new Set(
          (previousTask.mentions ?? []).filter((mention) => mention.kind === "user").map((mention) => mention.id)
        );
        const newMentions = (enriched.mentions ?? []).filter(
          (mention) => mention.kind === "user" && !previousSet.has(mention.id)
        );
        if (newMentions.length > 0) {
          createNotificationsForMentions(newMentions, "task", enriched.id, enriched.title);
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
      setError("N\xE3o foi poss\xEDvel atualizar a tarefa.");
      throw err;
    }
  };
  const addTask = async (taskData) => {
    const computedStatus = taskData.status ? taskData.status : dayjs(taskData.deadline).isBefore(dayjs(), "day") ? TaskStatus.Atrasada : TaskStatus.Pendente;
    try {
      const mentionsWithResponsible = ensureResponsibleMention(
        taskData.mentions,
        taskData.responsibleId
      );
      if (isUsingMockApi) {
        const newId = Math.max(...tasks.map((t) => t.id), 0) + 1;
        const newTask = {
          ...taskData,
          id: newId,
          status: computedStatus,
          notes: taskData.notes,
          mentions: mentionsWithResponsible
        };
        setTasks((prev) => [...prev, newTask]);
        createNotificationsForMentions(newTask.mentions, "task", newId, newTask.title);
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
        mentions: mentionsWithResponsible.map((mention) => ({
          id: mention.id,
          kind: mention.kind
        }))
      };
      const created = await apiClient.post("/tasks", payload);
      const mapped = mapTaskFromApi(created);
      const enriched = {
        ...mapped,
        notes: taskData.notes,
        mentions: mentionsWithResponsible
      };
      setTasks((prev) => [...prev, enriched]);
      createNotificationsForMentions(enriched.mentions, "task", enriched.id, enriched.title);
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
      setError("N\xE3o foi poss\xEDvel criar a tarefa no backend.");
      throw err;
    }
  };
  const addKanbanCard = async (cardData) => {
    try {
      if (isUsingMockApi) {
        const newCard = {
          ...cardData,
          id: `card-${Date.now()}`
        };
        setKanbanCards((prev) => [...prev, newCard]);
        return;
      }
      const defaultClientId = contacts[0]?.id;
      const defaultResponsibleId = users[0]?.id ?? null;
      if (!defaultClientId) {
        throw new Error("Nenhum contato dispon\xEDvel para vincular ao processo.");
      }
      const rawDeadline = cardData.deadline ?? dayjs().add(30, "day").toISOString();
      const payload = {
        internal_number: `CARD-${Date.now()}`,
        area: cardData.area === "N\xE3o definido" ? "C\xEDvel" : cardData.area,
        phase: "Inicial",
        deadline: formatDateForApi(rawDeadline),
        status: "Ativo",
        client_id: defaultClientId,
        responsible_id: cardData.responsibleId || defaultResponsibleId,
        kanban_column: cardData.column,
        kanban_phase: cardData.phase
      };
      const created = await apiClient.post("/lawsuits", payload);
      const mappedLawsuit = mapLawsuitFromApi(created);
      const mappedCard = mapKanbanCardFromLawsuit(mappedLawsuit);
      setLawsuits((prev) => [...prev, mappedLawsuit]);
      setKanbanCards((prev) => [
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
          isDelayed: cardData.isDelayed
        }
      ]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel criar o card no backend.");
      throw err;
    }
  };
  const addContact = async (contactData) => {
    try {
      if (isUsingMockApi) {
        const newContact = {
          id: Math.max(...contacts.map((c) => c.id), 0) + 1,
          ...contactData,
          lastInteraction: contactData.lastInteraction ?? "",
          notes: contactData.notes,
          mentions: contactData.mentions ?? []
        };
        setContacts((prev) => [...prev, newContact]);
        setError(null);
        createNotificationsForMentions(newContact.mentions, "contact", newContact.id, newContact.name);
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
        mentions: (contactData.mentions ?? []).map((mention) => ({
          id: mention.id,
          kind: mention.kind
        }))
      };
      const created = await apiClient.post("/contacts", payload);
      const mapped = mapContactFromApi(created);
      const enriched = {
        ...mapped,
        notes: contactData.notes,
        mentions: contactData.mentions ?? []
      };
      setContacts((prev) => [...prev, enriched]);
      setError(null);
      createNotificationsForMentions(enriched.mentions, "contact", enriched.id, enriched.name);
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
        const normalizedMessage = (err.message ?? "").toLowerCase();
        const payloadMessage = extractMessageFromPayload(err.data);
        const isDuplicateDocument = normalizedMessage.includes("contacts_document_unique") || normalizedMessage.includes("duplicate entry") || payloadMessage.includes("contacts_document_unique") || payloadMessage.includes("duplicate entry");
        if (isDuplicateDocument) {
          err.code = "contact_document_duplicate";
          throw err;
        }
        if (err.status === 422) {
          throw err;
        }
      }
      setError("N\xE3o foi poss\xEDvel criar o contato no backend.");
      throw err;
    }
  };
  const deleteContact = async (contactId) => {
    try {
      if (!isUsingMockApi) {
        await apiClient.delete(`/contacts/${contactId}`);
      }
      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
      setContactAnnotations((prev) => {
        if (!prev[contactId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[contactId];
        persistAnnotationCache(CONTACT_NOTES_STORAGE_KEY, next);
        return next;
      });
      setPaymentSchedules((prev) => prev.filter((schedule) => schedule.contactId !== contactId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel remover o contato.");
      throw err;
    }
  };
  const createCollaborator = async (data) => {
    try {
      if (isUsingMockApi) {
        const newUser = {
          id: Math.max(...users.map((u) => u.id), 0) + 1,
          name: data.name,
          email: data.email,
          avatar: data.avatar ?? avatarFallback(data.name),
          personalEmail: data.email,
          roleId: data.roleId,
          roleName: data.roleId ? userRoles.find((role) => role.id === data.roleId)?.name : void 0
        };
        setUsers((prev) => [...prev, newUser]);
        setError(null);
        return newUser;
      }
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: data.avatar,
        personal_email: data.email,
        role_id: data.roleId ?? null
      };
      const created = await apiClient.post("/users", payload);
      const mapped = mapUserFromApi(created);
      const enriched = mapped.roleId && !mapped.roleName ? { ...mapped, roleName: userRoles.find((role) => role.id === mapped.roleId)?.name } : mapped;
      setUsers((prev) => [...prev, enriched]);
      setError(null);
      return enriched;
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 422) {
        throw err;
      }
      setError("N\xE3o foi poss\xEDvel cadastrar o colaborador.");
      throw err;
    }
  };
  const updateCollaborator = async (userId, data) => {
    try {
      if (isUsingMockApi) {
        const updated = users.find((user) => user.id === userId);
        if (!updated) {
          throw new Error("Colaborador n\xE3o encontrado.");
        }
        const merged = {
          ...updated,
          name: data.name,
          email: data.email,
          personalEmail: data.email,
          avatar: data.avatar ?? updated.avatar,
          roleId: data.roleId ?? updated.roleId,
          roleName: data.roleId !== void 0 ? userRoles.find((role) => role.id === data.roleId)?.name ?? updated.roleName : updated.roleName
        };
        setUsers((prev) => prev.map((user) => user.id === userId ? merged : user));
        setError(null);
        return merged;
      }
      const payload = {
        name: data.name,
        email: data.email,
        personal_email: data.email,
        role_id: data.roleId ?? null
      };
      if (data.password && data.password.trim().length >= 8) {
        payload.password = data.password.trim();
      }
      if (data.avatar) {
        payload.avatar = data.avatar;
      }
      const response = await apiClient.put(`/users/${userId}`, payload);
      const mapped = mapUserFromApi(response);
      const enriched = mapped.roleId && !mapped.roleName ? { ...mapped, roleName: userRoles.find((role) => role.id === mapped.roleId)?.name } : mapped;
      setUsers((prev) => prev.map((user) => user.id === userId ? enriched : user));
      setError(null);
      return enriched;
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 422) {
        throw err;
      }
      setError("N\xE3o foi poss\xEDvel atualizar o colaborador.");
      throw err;
    }
  };
  const deleteCollaborator = async (userId) => {
    try {
      if (isUsingMockApi) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        setError(null);
        return;
      }
      await apiClient.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel remover o colaborador.");
      throw err;
    }
  };
  const updateUserCache = (userData) => {
    setUsers(
      (prev) => prev.some((user) => user.id === userData.id) ? prev.map((user) => user.id === userData.id ? { ...user, ...userData } : user) : prev
    );
  };
  const addLawsuit = async (data) => {
    try {
      if (isUsingMockApi) {
        const newItem = {
          id: Math.max(...lawsuits.map((l) => l.id), 0) + 1,
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
          mentions: data.mentions ?? []
        };
        setLawsuits((prev) => [...prev, newItem]);
        setKanbanCards((prev) => [...prev, mapKanbanCardFromLawsuit(newItem)]);
        setError(null);
        createNotificationsForMentions(newItem.mentions, "lawsuit", newItem.id, newItem.internalNumber);
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
        mentions: (data.mentions ?? []).map((mention) => ({
          id: mention.id,
          kind: mention.kind
        }))
      };
      const created = await apiClient.post("/lawsuits", payload);
      const mapped = mapLawsuitFromApi(created);
      const enriched = {
        ...mapped,
        notes: data.notes,
        mentions: data.mentions ?? []
      };
      setLawsuits((prev) => [...prev, enriched]);
      setKanbanCards((prev) => [...prev, mapKanbanCardFromLawsuit(enriched)]);
      setError(null);
      createNotificationsForMentions(enriched.mentions, "lawsuit", enriched.id, enriched.internalNumber);
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
      setError("N\xE3o foi poss\xEDvel criar o processo no backend.");
      throw err;
    }
  };
  const deleteLawsuit = async (lawsuitId) => {
    try {
      if (!isUsingMockApi) {
        await apiClient.delete(`/lawsuits/${lawsuitId}`);
      }
      setLawsuits((prev) => prev.filter((lawsuit) => lawsuit.id !== lawsuitId));
      setKanbanCards((prev) => prev.filter((card) => card.id !== `lawsuit-${lawsuitId}`));
      setTasks(
        (prev) => prev.map(
          (task) => task.lawsuitId === lawsuitId ? { ...task, lawsuitId: void 0 } : task
        )
      );
      setLawsuitAnnotations((prev) => {
        if (!prev[lawsuitId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[lawsuitId];
        persistAnnotationCache(LAWSUIT_NOTES_STORAGE_KEY, next);
        return next;
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel remover o processo.");
      throw err;
    }
  };
  const addPaymentSchedule = async (payload) => {
    try {
      if (isUsingMockApi) {
        const scheduleId = Date.now();
        const installments = payload.installments.map((installment, index) => ({
          id: scheduleId + index + 1,
          paymentScheduleId: scheduleId,
          sequence: index + 1,
          dueDate: installment.dueDate,
          amount: installment.amount,
          status: "pending",
          paidAt: null,
          transactionId: void 0
        }));
        const contactInfo = contacts.find((contact) => contact.id === payload.contactId);
        const schedule = {
          id: scheduleId,
          tenantId: 0,
          contactId: payload.contactId,
          title: payload.title ?? null,
          notes: payload.notes,
          totalAmount: payload.totalAmount,
          installmentsCount: payload.installmentsCount,
          installmentAmount: payload.installmentAmount,
          firstDueDate: payload.firstDueDate ?? (installments[0]?.dueDate ?? null),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          contact: contactInfo ? {
            id: contactInfo.id,
            name: contactInfo.name,
            email: contactInfo.email,
            phone: contactInfo.phone
          } : null,
          installments
        };
        setPaymentSchedules((prev) => [...prev, schedule]);
        return schedule;
      }
      const response = await apiClient.post("/payment-schedules", {
        contact_id: payload.contactId,
        title: payload.title ?? null,
        notes: payload.notes ?? null,
        total_amount: payload.totalAmount,
        installments_count: payload.installmentsCount,
        installment_amount: payload.installmentAmount,
        first_due_date: payload.firstDueDate ?? null,
        installments: payload.installments.map((installment) => ({
          id: installment.id,
          due_date: installment.dueDate,
          amount: installment.amount
        }))
      });
      const mapped = mapPaymentScheduleFromApi(response);
      setPaymentSchedules((prev) => [...prev, mapped]);
      return mapped;
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel cadastrar o cronograma de pagamentos.");
      throw err;
    }
  };
  const deletePaymentSchedule = async (scheduleId) => {
    try {
      if (!isUsingMockApi) {
        await apiClient.delete(`/payment-schedules/${scheduleId}`);
      }
      setPaymentSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel remover o cronograma de pagamentos.");
      throw err;
    }
  };
  const markPaymentInstallmentAsPaid = async (installmentId, payload = {}) => {
    try {
      if (isUsingMockApi) {
        const paidAt = payload.paidAt ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        setPaymentSchedules(
          (prev) => prev.map((schedule) => ({
            ...schedule,
            installments: schedule.installments.map(
              (installment) => installment.id === installmentId ? {
                ...installment,
                status: "paid",
                paidAt
              } : installment
            )
          }))
        );
        setTransactions((prev) => [
          ...prev,
          {
            id: Date.now(),
            date: paidAt,
            description: payload.description ?? "Recebimento de parcela",
            category: payload.category ?? "Receitas recorrentes",
            account: payload.account ?? "Contas a receber",
            value: paymentSchedules.flatMap((schedule) => schedule.installments).find((installment) => installment.id === installmentId)?.amount ?? 0,
            type: TransactionType.Receita,
            categoryId: void 0
          }
        ]);
        return;
      }
      const response = await apiClient.post(
        `/payment-installments/${installmentId}/mark-paid`,
        {
          paid_at: payload.paidAt,
          description: payload.description,
          category: payload.category,
          account: payload.account
        }
      );
      const updatedInstallment = mapPaymentInstallmentFromApi(response.installment);
      setPaymentSchedules(
        (prev) => prev.map((schedule) => {
          if (schedule.id !== updatedInstallment.paymentScheduleId) {
            return schedule;
          }
          return {
            ...schedule,
            installments: schedule.installments.map(
              (installment) => installment.id === updatedInstallment.id ? updatedInstallment : installment
            )
          };
        })
      );
      if (response.transaction) {
        const mappedTransaction = mapTransactionFromApi(response.transaction);
        setTransactions((prev) => {
          const exists = prev.some((transaction) => transaction.id === mappedTransaction.id);
          return exists ? prev : [...prev, mappedTransaction];
        });
      }
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel registrar o pagamento desta parcela.");
      throw err;
    }
  };
  const addTransaction = async (data) => {
    try {
      if (isUsingMockApi) {
        const newItem = {
          id: Math.max(...transactions.map((t) => t.id), 0) + 1,
          date: data.date,
          description: data.description,
          category: data.category,
          account: data.account,
          value: data.value,
          type: data.type,
          categoryId: data.categoryId
        };
        setTransactions((prev) => [...prev, newItem]);
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
        category_id: data.categoryId ?? null
      };
      const created = await apiClient.post("/transactions", payload);
      const mapped = mapTransactionFromApi(created);
      setTransactions((prev) => [...prev, mapped]);
      setError(null);
      return mapped;
    } catch (err) {
      console.error(err);
      setError("N\xE3o foi poss\xEDvel registrar a transa\xE7\xE3o.");
      throw err;
    }
  };
  const createGoalProgram = useCallback(
    (programData) => {
      let createdProgram = null;
      setGoalPrograms((prev) => {
        const normalizedName = ensureString(programData.name, "Programa sem nome");
        const id = programData.id && programData.id.trim().length > 0 ? programData.id : generateGoalProgramId(normalizedName, prev);
        const startDate = programData.startDate ?? dayjs().startOf("month").format("YYYY-MM-DD");
        const endDate = programData.endDate ?? dayjs(startDate).add(3, "month").format("YYYY-MM-DD");
        const newProgram = {
          ...programData,
          id,
          name: normalizedName,
          startDate,
          endDate,
          visibility: normalizeGoalVisibility(programData.visibility),
          tags: programData.tags ? [...programData.tags] : void 0
        };
        createdProgram = newProgram;
        const next = [...prev, newProgram];
        persistGoalPrograms(next);
        return next;
      });
      return createdProgram;
    },
    []
  );
  const updateGoalProgram = useCallback(
    (programId, updates) => {
      setGoalPrograms((prev) => {
        let updated = false;
        const next = prev.map((program) => {
          if (program.id !== programId) return program;
          updated = true;
          return {
            ...program,
            ...updates.name !== void 0 ? { name: ensureString(updates.name, program.name) } : {},
            ...updates.description !== void 0 ? { description: updates.description } : {},
            ...updates.color !== void 0 ? { color: updates.color } : {},
            ...updates.startDate !== void 0 ? { startDate: updates.startDate } : {},
            ...updates.endDate !== void 0 ? { endDate: updates.endDate } : {},
            ...updates.visibility !== void 0 ? { visibility: normalizeGoalVisibility(updates.visibility) } : {},
            ...updates.ownerTeamId !== void 0 ? { ownerTeamId: updates.ownerTeamId } : {},
            ...updates.icon !== void 0 ? { icon: updates.icon } : {},
            ...updates.tags !== void 0 ? { tags: updates.tags ? [...updates.tags] : void 0 } : {}
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
  const removeGoalProgram = useCallback((programId) => {
    let removed = false;
    const removedGoalIds = [];
    setGoalPrograms((prev) => {
      const next = prev.filter((program) => program.id !== programId);
      if (next.length !== prev.length) {
        removed = true;
        persistGoalPrograms(next);
        return next;
      }
      return prev;
    });
    if (!removed) return;
    setGoals((prev) => {
      const next = prev.filter((goal) => {
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
      setGoalAssignments((prev) => {
        const next = prev.filter((assignment) => !removedGoalIds.includes(assignment.goalId));
        if (next.length !== prev.length) {
          persistGoalAssignments(next);
        }
        return next;
      });
      setGoalCheckpoints((prev) => {
        const next = prev.filter((checkpoint) => !removedGoalIds.includes(checkpoint.goalId));
        if (next.length !== prev.length) {
          persistGoalCheckpoints(next);
        }
        return next;
      });
      setGoalNotificationRules((prev) => {
        const next = prev.filter((rule) => !removedGoalIds.includes(rule.goalId));
        if (next.length !== prev.length) {
          persistGoalNotifications(next);
        }
        return next;
      });
    }
  }, []);
  const createGoal = useCallback(
    (data) => {
      let createdGoal = null;
      setGoals((prev) => {
        const id = data.id && data.id.trim().length > 0 ? data.id : generateGoalId(data.title, prev);
        const currentValue = ensureNumber(data.currentValue ?? 0);
        const metric = cloneGoalMetric(data.metric);
        const thresholds = cloneGoalThresholds(data.thresholds);
        const notificationSettings = cloneGoalNotificationSettings(data.notificationSettings);
        const newGoal = {
          ...data,
          id,
          title: ensureString(data.title, "Nova meta"),
          programId: data.programId,
          description: data.description,
          ownerType: data.ownerType ?? "team",
          ownerId: data.ownerId,
          periodicity: data.periodicity ?? "one-time",
          startDate: data.startDate ?? dayjs().format("YYYY-MM-DD"),
          endDate: data.endDate ?? dayjs().add(1, "month").format("YYYY-MM-DD"),
          unit: data.unit ?? "count",
          baseline: data.baseline,
          targetValue: ensureNumber(data.targetValue, 0),
          currentValue,
          autoUpdate: data.autoUpdate ?? false,
          metric,
          thresholds,
          status: "attention",
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          tags: data.tags ? [...data.tags] : void 0,
          checkpointFrequency: data.checkpointFrequency,
          displayOrder: data.displayOrder,
          notificationSettings,
          motivationMessage: data.motivationMessage
        };
        newGoal.status = data.status ?? evaluateGoalStatus(newGoal, currentValue);
        createdGoal = newGoal;
        const next = [...prev, newGoal];
        persistGoals(next);
        return next;
      });
      if (createdGoal) {
        notifyGoalCreated(createdGoal);
        if (createdGoal.autoUpdate || createdGoal.metric.source === "manual") {
          recalculateGoalProgress(createdGoal.id);
        }
        return createdGoal;
      }
      throw new Error("N\xE3o foi poss\xEDvel criar a meta.");
    },
    [recalculateGoalProgress]
  );
  const updateGoal = useCallback(
    (goalId, updates) => {
      let targetGoal = null;
      setGoals((prev) => {
        let changed = false;
        const next = prev.map((goal) => {
          if (goal.id !== goalId) return goal;
          changed = true;
          const nextGoal = {
            ...goal,
            ...updates.programId ? { programId: updates.programId } : {},
            ...updates.title !== void 0 ? { title: ensureString(updates.title, goal.title) } : {},
            ...updates.description !== void 0 ? { description: updates.description } : {},
            ...updates.ownerType !== void 0 ? { ownerType: updates.ownerType } : {},
            ...updates.ownerId !== void 0 ? { ownerId: updates.ownerId } : {},
            ...updates.periodicity !== void 0 ? { periodicity: updates.periodicity } : {},
            ...updates.startDate !== void 0 ? { startDate: updates.startDate } : {},
            ...updates.endDate !== void 0 ? { endDate: updates.endDate } : {},
            ...updates.unit !== void 0 ? { unit: updates.unit } : {},
            ...updates.baseline !== void 0 ? { baseline: updates.baseline } : {},
            ...updates.targetValue !== void 0 ? { targetValue: ensureNumber(updates.targetValue, goal.targetValue) } : {},
            ...updates.currentValue !== void 0 ? { currentValue: ensureNumber(updates.currentValue, goal.currentValue) } : {},
            ...updates.autoUpdate !== void 0 ? { autoUpdate: Boolean(updates.autoUpdate) } : {},
            ...updates.tags !== void 0 ? { tags: updates.tags ? [...updates.tags] : void 0 } : {},
            ...updates.checkpointFrequency !== void 0 ? { checkpointFrequency: updates.checkpointFrequency } : {},
            ...updates.displayOrder !== void 0 ? { displayOrder: updates.displayOrder } : {},
            ...updates.motivationMessage !== void 0 ? { motivationMessage: updates.motivationMessage } : {}
          };
          if (updates.metric) {
            nextGoal.metric = cloneGoalMetric({
              ...goal.metric,
              ...updates.metric,
              filters: updates.metric.filters !== void 0 ? cloneGoalMetricFilters(updates.metric.filters) : goal.metric.filters
            });
          }
          if (updates.thresholds) {
            nextGoal.thresholds = cloneGoalThresholds({
              ...goal.thresholds,
              ...updates.thresholds
            });
          }
          if (updates.notificationSettings) {
            nextGoal.notificationSettings = cloneGoalNotificationSettings({
              ...goal.notificationSettings,
              ...updates.notificationSettings
            });
          }
          nextGoal.status = updates.status ?? evaluateGoalStatus(nextGoal, nextGoal.currentValue);
          nextGoal.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
          targetGoal = nextGoal;
          return nextGoal;
        });
        if (changed) {
          persistGoals(next);
        }
        return next;
      });
      if (targetGoal && (updates.metric || updates.autoUpdate !== void 0 || updates.currentValue !== void 0 || updates.thresholds || updates.targetValue !== void 0)) {
        recalculateGoalProgress(goalId);
      }
      if (targetGoal) {
        notifyGoalUpdated(targetGoal);
      }
    },
    [recalculateGoalProgress]
  );
  const duplicateGoal = useCallback(
    (goalId, overrides = {}) => {
      const reference = goals.find((goal) => goal.id === goalId);
      if (!reference) return null;
      const [clonedReference] = cloneGoals([reference]);
      let title = overrides.title ?? `${clonedReference.title} (c\xF3pia)`;
      if (!title || title.trim().length === 0) {
        title = `${clonedReference.title} (c\xF3pia)`;
      }
      const id = overrides.id && overrides.id.trim().length > 0 ? overrides.id : generateGoalId(title, goals);
      const newGoal = {
        ...clonedReference,
        ...overrides,
        id,
        title,
        currentValue: overrides.currentValue ?? (overrides.autoUpdate ?? clonedReference.autoUpdate ? 0 : clonedReference.currentValue),
        status: "attention",
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        tags: overrides.tags ? [...overrides.tags ?? []] : clonedReference.tags ? [...clonedReference.tags] : void 0,
        metric: overrides.metric ? cloneGoalMetric(overrides.metric) : cloneGoalMetric(clonedReference.metric),
        thresholds: overrides.thresholds ? cloneGoalThresholds(overrides.thresholds) : cloneGoalThresholds(clonedReference.thresholds),
        notificationSettings: overrides.notificationSettings ? cloneGoalNotificationSettings(overrides.notificationSettings) : cloneGoalNotificationSettings(clonedReference.notificationSettings)
      };
      newGoal.status = overrides.status ?? evaluateGoalStatus(newGoal, newGoal.currentValue);
      setGoals((prev) => {
        const next = [...prev, newGoal];
        persistGoals(next);
        return next;
      });
      notifyGoalCreated(newGoal);
      if (newGoal.autoUpdate || newGoal.metric.source === "manual") {
        recalculateGoalProgress(newGoal.id);
      }
      return newGoal;
    },
    [goals, recalculateGoalProgress]
  );
  const removeGoal = useCallback((goalId) => {
    let removed = false;
    setGoals((prev) => {
      const next = prev.filter((goal) => {
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
    setGoalAssignments((prev) => {
      const next = prev.filter((assignment) => assignment.goalId !== goalId);
      if (next.length !== prev.length) {
        persistGoalAssignments(next);
      }
      return next;
    });
    setGoalCheckpoints((prev) => {
      const next = prev.filter((checkpoint) => checkpoint.goalId !== goalId);
      if (next.length !== prev.length) {
        persistGoalCheckpoints(next);
      }
      return next;
    });
    setGoalNotificationRules((prev) => {
      const next = prev.filter((rule) => rule.goalId !== goalId);
      if (next.length !== prev.length) {
        persistGoalNotifications(next);
      }
      return next;
    });
  }, []);
  const recordGoalCheckpoint = useCallback(
    (goalId, checkpoint) => {
      let created = null;
      setGoalCheckpoints((prev) => {
        const id = checkpoint.id && checkpoint.id.trim().length > 0 ? checkpoint.id : generateGoalCheckpointId(prev);
        const newCheckpoint = {
          ...checkpoint,
          id,
          goalId,
          periodStart: checkpoint.periodStart,
          periodEnd: checkpoint.periodEnd,
          recordedAt: checkpoint.recordedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
          value: ensureNumber(checkpoint.value, 0),
          delta: checkpoint.delta,
          authorId: checkpoint.authorId,
          notes: checkpoint.notes
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
    (checkpointId, updates) => {
      let relatedGoalId = null;
      setGoalCheckpoints((prev) => {
        let changed = false;
        const next = prev.map((checkpoint) => {
          if (checkpoint.id !== checkpointId) return checkpoint;
          changed = true;
          relatedGoalId = checkpoint.goalId;
          return {
            ...checkpoint,
            ...updates.periodStart !== void 0 ? { periodStart: updates.periodStart } : {},
            ...updates.periodEnd !== void 0 ? { periodEnd: updates.periodEnd } : {},
            ...updates.recordedAt !== void 0 ? { recordedAt: updates.recordedAt } : {},
            ...updates.notes !== void 0 ? { notes: updates.notes } : {},
            ...updates.authorId !== void 0 ? { authorId: updates.authorId } : {},
            ...updates.delta !== void 0 ? { delta: updates.delta } : {},
            ...updates.value !== void 0 ? { value: ensureNumber(updates.value, checkpoint.value) } : {}
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
  const removeGoalCheckpoint = useCallback((checkpointId) => {
    let relatedGoalId = null;
    setGoalCheckpoints((prev) => {
      const next = prev.filter((checkpoint) => {
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
    (assignment) => {
      let created = null;
      setGoalAssignments((prev) => {
        const id = assignment.id && assignment.id.trim().length > 0 ? assignment.id : generateGoalAssignmentId(prev);
        const newAssignment = {
          ...assignment,
          id,
          scope: normalizeGoalAssignmentScope(assignment.scope)
        };
        created = newAssignment;
        const next = [...prev, newAssignment];
        persistGoalAssignments(next);
        return next;
      });
      if (created) {
        const numericAssignee = Number(created.assigneeId);
        const goal = goals.find((item) => item.id === created.goalId);
        if (goal && Number.isFinite(numericAssignee)) {
          notifyGoalAssignmentAdded(goal, numericAssignee);
        }
      }
      return created;
    },
    [goals]
  );
  const updateGoalAssignment = useCallback(
    (assignmentId, updates) => {
      setGoalAssignments((prev) => {
        let changed = false;
        const next = prev.map((assignment) => {
          if (assignment.id !== assignmentId) return assignment;
          changed = true;
          return {
            ...assignment,
            ...updates.assigneeId !== void 0 ? { assigneeId: updates.assigneeId } : {},
            ...updates.assigneeType !== void 0 ? { assigneeType: updates.assigneeType } : {},
            ...updates.scope !== void 0 ? { scope: normalizeGoalAssignmentScope(updates.scope) } : {},
            ...updates.weight !== void 0 ? { weight: updates.weight } : {}
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
  const removeGoalAssignment = useCallback((assignmentId) => {
    setGoalAssignments((prev) => {
      const next = prev.filter((assignment) => assignment.id !== assignmentId);
      if (next.length !== prev.length) {
        persistGoalAssignments(next);
      }
      return next;
    });
  }, []);
  useEffect(() => {
    if (!authUser) return;
    if (goals.length === 0) {
      goalUserProgressRef.current = /* @__PURE__ */ new Map();
      goalUserRankRef.current = [];
      return;
    }
    const contributions = /* @__PURE__ */ new Map();
    const addContribution = (userId, progress) => {
      const numeric = Number(userId);
      if (!Number.isFinite(numeric)) return;
      const list = contributions.get(numeric) ?? [];
      list.push(progress);
      contributions.set(numeric, list);
    };
    goals.forEach((goal) => {
      const progress = getGoalProgressPercentage(goal);
      if (goal.ownerType === "user" && typeof goal.ownerId === "number") {
        addContribution(goal.ownerId, progress);
      }
      goalAssignments.forEach((assignment) => {
        if (assignment.goalId !== goal.id) return;
        if (assignment.assigneeType !== "user") return;
        addContribution(assignment.assigneeId, progress);
      });
    });
    const progressMap = /* @__PURE__ */ new Map();
    contributions.forEach((list, userId) => {
      if (list.length === 0) return;
      const average = list.reduce((acc, value2) => acc + value2, 0) / list.length;
      progressMap.set(userId, average);
    });
    const currentRank = Array.from(progressMap.entries()).sort((a, b) => b[1] - a[1]).map(([userId]) => userId);
    const previousRank = goalUserRankRef.current;
    const authId = authUser.id;
    const previousPosition = previousRank.indexOf(authId);
    const currentPosition = currentRank.indexOf(authId);
    if (previousPosition >= 0 && currentPosition >= 0 && currentPosition > previousPosition) {
      const overtakerId = currentPosition > 0 ? currentRank[currentPosition - 1] : null;
      if (overtakerId && overtakerId !== authId) {
        const overtakerUser = users.find((user) => user.id === overtakerId);
        if (overtakerUser) {
          pushNotification(authId, {
            title: "Competi\xE7\xE3o de metas",
            message: `${overtakerUser.name} ultrapassou voc\xEA no ranking de metas. Ajuste o foco para recuperar a lideran\xE7a!`,
            entityId: 0,
            entityType: "goal",
            actorId: overtakerId
          });
        }
      }
    }
    goalUserProgressRef.current = progressMap;
    goalUserRankRef.current = currentRank;
  }, [goals, goalAssignments, authUser, users]);
  const upsertGoalNotificationRule = useCallback(
    (rule) => {
      let result = null;
      setGoalNotificationRules((prev) => {
        const recipients = rule.recipients.map((recipient) => ({
          type: recipient.type,
          id: recipient.id
        }));
        if (rule.id) {
          let updated = false;
          const next2 = prev.map((existing) => {
            if (existing.id !== rule.id) return existing;
            updated = true;
            const updatedRule = {
              ...existing,
              ...rule,
              trigger: normalizeGoalNotificationTriggerValue(rule.trigger),
              channel: rule.channel,
              recipients
            };
            result = updatedRule;
            return updatedRule;
          });
          if (updated) {
            persistGoalNotifications(next2);
            return next2;
          }
        }
        const id = generateGoalNotificationRuleId(prev);
        const newRule = {
          ...rule,
          id,
          trigger: normalizeGoalNotificationTriggerValue(rule.trigger),
          channel: rule.channel,
          recipients
        };
        result = newRule;
        const next = [...prev, newRule];
        persistGoalNotifications(next);
        return next;
      });
      return result;
    },
    []
  );
  const removeGoalNotificationRule = useCallback((ruleId) => {
    setGoalNotificationRules((prev) => {
      const next = prev.filter((rule) => rule.id !== ruleId);
      if (next.length !== prev.length) {
        persistGoalNotifications(next);
      }
      return next;
    });
  }, []);
  const addCategory = (groupId, data) => {
    const name = ensureString(data.name);
    if (!name) {
      return null;
    }
    const description = data.description ? ensureString(data.description) : void 0;
    const newItem = {
      id: `${groupId}-${Date.now()}`,
      name,
      color: data.color,
      description
    };
    let added = false;
    setCategoryGroups((prev) => {
      const next = prev.map((group) => {
        if (group.id !== groupId) return group;
        const exists = group.items.some(
          (item) => removeDiacritics(item.name).toLowerCase() === removeDiacritics(name).toLowerCase()
        );
        if (exists) {
          return group;
        }
        added = true;
        return {
          ...group,
          items: [...group.items, newItem]
        };
      });
      if (added) {
        persistCategoryGroups(next);
      }
      return next;
    });
    return added ? newItem : null;
  };
  const updateCategory = (groupId, categoryId, updates) => {
    const normalizedName = updates.name ? ensureString(updates.name) : void 0;
    const normalizedDescription = updates.description ? ensureString(updates.description) : void 0;
    setCategoryGroups((prev) => {
      const next = prev.map((group) => {
        if (group.id !== groupId) return group;
        const items = group.items.map((item) => {
          if (item.id !== categoryId) return item;
          const next2 = {
            ...item,
            ...normalizedName ? { name: normalizedName } : {},
            ...normalizedDescription !== void 0 ? { description: normalizedDescription } : {},
            ...updates.color !== void 0 ? { color: updates.color } : {}
          };
          return next2;
        });
        return { ...group, items };
      });
      persistCategoryGroups(next);
      return next;
    });
  };
  const removeCategory = (groupId, categoryId) => {
    let removed = false;
    setCategoryGroups((prev) => {
      const next = prev.map((group) => {
        if (group.id !== groupId) return group;
        const target = group.items.find((item) => item.id === categoryId);
        if (!target || target.isDefault) return group;
        removed = true;
        return {
          ...group,
          items: group.items.filter((item) => item.id !== categoryId)
        };
      });
      if (removed) {
        persistCategoryGroups(next);
      }
      return next;
    });
    if (removed) {
      if (groupId === "tasks") {
        setTasks(
          (prev) => prev.map(
            (task) => task.categoryId === categoryId ? { ...task, categoryId: void 0 } : task
          )
        );
      } else if (groupId === "financial") {
        setTransactions(
          (prev) => prev.map(
            (transaction) => transaction.categoryId === categoryId ? { ...transaction, categoryId: void 0 } : transaction
          )
        );
      } else if (groupId === "contacts") {
        setContacts(
          (prev) => prev.map(
            (contact) => contact.categoryId === categoryId ? { ...contact, categoryId: void 0 } : contact
          )
        );
      } else if (groupId === "leads") {
        setContacts(
          (prev) => prev.map(
            (contact) => contact.leadCategoryId === categoryId ? { ...contact, leadCategoryId: void 0 } : contact
          )
        );
      }
    }
  };
  const addUserRole = (data) => {
    const name = ensureString(data.name);
    if (!name) {
      return null;
    }
    const duplicated = userRoles.some(
      (role) => removeDiacritics(role.name).toLowerCase() === removeDiacritics(name).toLowerCase()
    );
    if (duplicated) {
      return null;
    }
    const baseRole = data.baseRoleId ? userRoles.find((role) => role.id === data.baseRoleId) : void 0;
    const initialPermissions = PERMISSION_KEYS.reduce((acc, key) => {
      if (baseRole) {
        acc[key] = Boolean(baseRole.permissions[key]);
      } else {
        acc[key] = false;
      }
      return acc;
    }, {});
    if (data.permissions) {
      for (const key of Object.keys(data.permissions)) {
        if (PERMISSION_KEYS.includes(key)) {
          initialPermissions[key] = Boolean(data.permissions[key]);
        }
      }
    }
    const newRole = {
      id: generateRoleId(name, userRoles),
      name,
      description: data.description ? ensureString(data.description) : "",
      color: data.color || baseRole?.color,
      isSystem: false,
      permissions: initialPermissions
    };
    setUserRoles((prev) => {
      const next = [...prev, newRole];
      persistUserRoles(next);
      return next;
    });
    return newRole;
  };
  const updateUserRole = (roleId, updates) => {
    let normalizedName;
    if (updates.name) {
      const candidate = ensureString(updates.name);
      if (!candidate) {
        return;
      }
      const duplicated = userRoles.some(
        (role) => role.id !== roleId && removeDiacritics(role.name).toLowerCase() === removeDiacritics(candidate).toLowerCase()
      );
      if (duplicated) {
        return;
      }
      normalizedName = candidate;
    }
    setUserRoles((prev) => {
      const next = prev.map((role) => {
        if (role.id !== roleId) return role;
        const next2 = {
          ...role,
          ...normalizedName ? { name: normalizedName } : {},
          ...updates.description !== void 0 ? { description: ensureString(updates.description, role.description) } : {},
          ...updates.color !== void 0 ? { color: updates.color } : {}
        };
        return next2;
      });
      persistUserRoles(next);
      return next;
    });
  };
  const removeUserRole = (roleId) => {
    setUserRoles((prev) => {
      const next = prev.filter((role) => {
        if (role.id !== roleId) return true;
        return role.isSystem;
      });
      if (next.length !== prev.length) {
        persistUserRoles(next);
      }
      return next;
    });
  };
  const setRolePermission = (roleId, permission, enabled) => {
    if (!PERMISSION_KEYS.includes(permission)) {
      return;
    }
    setUserRoles((prev) => {
      const next = prev.map((role) => {
        if (role.id !== roleId) return role;
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permission]: enabled
          }
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
    paymentSchedules,
    goalPrograms,
    goals,
    goalAssignments,
    goalCheckpoints,
    goalNotificationRules,
    categoryGroups,
    permissionsCatalog,
    userRoles,
    notifications,
    socialPosts,
    loading,
    error,
    updateKanbanCardColumn,
    updateKanbanCardDetails,
    updateTaskStatus,
    updateTask,
    addTask,
    addKanbanCard,
    addContact,
    deleteContact,
    createCollaborator,
    updateCollaborator,
    deleteCollaborator,
    updateUserCache,
    addLawsuit,
    deleteLawsuit,
    addPaymentSchedule,
    deletePaymentSchedule,
    markPaymentInstallmentAsPaid,
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
    createSocialPost,
    deleteSocialPost,
    toggleSocialPostLike,
    addSocialComment,
    deleteSocialComment
  };
  return /* @__PURE__ */ jsx(AppContext.Provider, { value, children });
};
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
export {
  AppProvider,
  useApp
};
