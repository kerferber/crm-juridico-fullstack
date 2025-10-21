import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { AnimatedProgressBar } from '../ui/AnimatedProgressBar';
import { useApp } from '../../store/AppContext';
import {
  Goal,
  GoalProgram,
  GoalStatus,
  GoalUnit,
  GoalPeriodicity,
  GoalMetricSourceType,
  TaskStatus,
  TransactionType,
  GoalCheckpoint,
  GoalAssignment,
  User,
  CategoryItem,
} from '../../types/types';
import { cn } from '../../lib/utils';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Target,
  Flag,
  Users as UsersIcon,
  Sparkles,
  Activity,
  TrendingUp,
  LineChart,
  Gauge,
  Calendar,
  CalendarPlus,
  Save,
  X,
  User as UserIcon,
  Circle,
  Clock,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  getGoalProgressPercentage,
  groupGoalCheckpoints,
  getLatestGoalCheckpoint,
} from '../../lib/goal-utils';

dayjs.extend(relativeTime);

const PROGRAM_TYPES: Array<GoalProgram['type']> = [
  'Financeiro',
  'Produção',
  'Relacionamento',
  'Marketing',
  'Qualidade',
];

const STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  achieved: {
    label: 'Alcançada',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  onTrack: {
    label: 'No ritmo',
    dot: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
  },
  attention: {
    label: 'Atenção',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  critical: {
    label: 'Crítica',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10',
  },
};

const UNIT_LABELS: Record<GoalUnit, string> = {
  count: 'Quantidade',
  currency: 'Financeiro',
  percentage: 'Percentual',
  hours: 'Horas',
};

const PERIODICITY_LABELS: Record<GoalPeriodicity, string> = {
  'one-time': 'Única',
  monthly: 'Mensal',
  weekly: 'Semanal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

const METRIC_SOURCE_LABELS: Record<GoalMetricSourceType, string> = {
  manual: 'Manual',
  tasks: 'Tarefas',
  transactions: 'Financeiro',
  contacts: 'CRM',
  lawsuits: 'Processos',
};

const REMINDER_OPTIONS: Array<{ value: Goal['checkpointFrequency']; label: string }> = [
  { value: undefined, label: 'Sem lembrete' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
];

const STATUS_ORDER: GoalStatus[] = ['critical', 'attention', 'onTrack', 'achieved'];

const formatPercentage = (value: number) =>
  `${Math.round(Math.max(0, Math.min(100, value)))}%`;

const getGoalAssignmentsMap = (assignments: GoalAssignment[]) => {
  const map = new Map<string, GoalAssignment[]>();
  assignments.forEach(item => {
    if (!map.has(item.goalId)) {
      map.set(item.goalId, []);
    }
    map.get(item.goalId)!.push(item);
  });
  return map;
};

const statusSortValue = (status: GoalStatus) => STATUS_ORDER.indexOf(status);

const parseTagsString = (value: string) =>
  value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

interface SimpleModalProps {
  open: boolean;
  title: string;
  description?: string;
  widthClass?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const SimpleModal: React.FC<SimpleModalProps> = ({
  open,
  title,
  description,
  widthClass = 'max-w-3xl',
  onClose,
  children,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-6 backdrop-blur-sm md:py-10">
      <div
        className={cn(
          'flex w-full max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-card/95 dark:text-dark-foreground',
          widthClass
        )}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 dark:border-dark-border/60">
          <div>
            <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground dark:text-dark-muted">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-6 py-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

interface GoalProgramFormProps {
  initial?: GoalProgram;
  onSubmit: (payload: Omit<GoalProgram, 'id'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

const GoalProgramForm: React.FC<GoalProgramFormProps> = ({ initial, onSubmit, onClose }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<GoalProgram['type']>(initial?.type ?? 'Financeiro');
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? dayjs().startOf('month').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ?? dayjs().add(3, 'month').endOf('month').format('YYYY-MM-DD')
  );
  const [visibility, setVisibility] = useState<GoalProgram['visibility']>(
    initial?.visibility ?? 'global'
  );
  const [ownerTeamId, setOwnerTeamId] = useState(initial?.ownerTeamId ?? '');
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [color, setColor] = useState(initial?.color ?? '#0EA5E9');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initial?.id,
        name,
        description,
        type,
        startDate,
        endDate,
        visibility,
        ownerTeamId: ownerTeamId || undefined,
        color,
        tags: parseTagsString(tagsInput),
        icon: initial?.icon,
      });
      onClose();
    } catch (error) {
      console.error(error);
      setFormError('Não foi possível salvar o programa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Nome do programa</label>
          <input
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            required
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Ex.: Metas Financeiras 2025"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Tipo</label>
          <select
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            value={type}
            onChange={event => setType(event.target.value as GoalProgram['type'])}
          >
            {PROGRAM_TYPES.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Visibilidade</label>
          <select
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            value={visibility}
            onChange={event => setVisibility(event.target.value as GoalProgram['visibility'])}
          >
            <option value="global">Organização inteira</option>
            <option value="team">Equipe específica</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={event => setEndDate(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Equipe/Owner</label>
          <input
            value={ownerTeamId}
            onChange={event => setOwnerTeamId(event.target.value)}
            placeholder="Ex.: contencioso, financeiro..."
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Cor</label>
          <input
            type="color"
            value={color}
            onChange={event => setColor(event.target.value)}
            className="h-10 w-full rounded-lg border border-border/70 bg-white p-1 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background"
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Descrição</label>
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={3}
            placeholder="Explique o foco deste programa de metas."
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Tags (separe por vírgula)</label>
          <input
            value={tagsInput}
            onChange={event => setTagsInput(event.target.value)}
            placeholder="financeiro, estratégico, q1..."
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
      </div>
      {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Salvar programa'}
        </Button>
      </div>
    </form>
  );
};

interface GoalFormPayload
  extends Omit<Goal, 'id' | 'lastUpdated' | 'status' | 'currentValue'> {
  id?: string;
  currentValue?: number;
  status?: GoalStatus;
}

interface GoalFormProps {
  programId: string;
  initial?: Goal;
  initialAssignments?: GoalAssignment[];
  onSubmit: (payload: GoalFormPayload, collaboratorIds: number[]) => Promise<void>;
  onClose: () => void;
  users: User[];
  taskCategories: CategoryItem[];
  financialCategories: CategoryItem[];
  contactStatuses: string[];
  lawsuitAreas: string[];
  lawsuitStatuses: string[];
}

const GoalForm: React.FC<GoalFormProps> = ({
  programId,
  initial,
  initialAssignments = [],
  onSubmit,
  onClose,
  users,
  taskCategories,
  financialCategories,
  contactStatuses,
  lawsuitAreas,
  lawsuitStatuses,
}) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? dayjs().startOf('month').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ?? dayjs().add(1, 'month').endOf('month').format('YYYY-MM-DD')
  );
  const [unit, setUnit] = useState<GoalUnit>(initial?.unit ?? 'count');
  const [periodicity, setPeriodicity] = useState<GoalPeriodicity>(
    initial?.periodicity ?? 'one-time'
  );
  const [targetValue, setTargetValue] = useState<number>(initial?.targetValue ?? 0);
  const [baseline, setBaseline] = useState<number | undefined>(initial?.baseline);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(initial?.autoUpdate ?? true);
  const [ownerType, setOwnerType] = useState<Goal['ownerType']>(initial?.ownerType ?? 'team');
  const [selectedOwnerUser, setSelectedOwnerUser] = useState<string>(
    initial?.ownerType === 'user' ? String(initial.ownerId ?? users[0]?.id ?? '') : ''
  );
  const [teamOwner, setTeamOwner] = useState<string>(
    initial?.ownerType === 'team' ? String(initial.ownerId ?? '') : ''
  );
  const initialResponsibleIds = (initial?.metric.filters?.responsibleIds ?? []).map(String);

  const [metricSource, setMetricSource] = useState<GoalMetricSourceType>(
    initial?.metric.source ?? 'tasks'
  );
  const [metricAggregation, setMetricAggregation] = useState<Goal['metric']['aggregation']>(
    initial?.metric.aggregation ?? 'count'
  );
  const [metricUnit, setMetricUnit] = useState<GoalUnit | undefined>(initial?.metric.unit);
  const [metricDateFrom, setMetricDateFrom] = useState<string | undefined>(
    initial?.metric.filters?.dateRange?.from
  );
  const [metricDateTo, setMetricDateTo] = useState<string | undefined>(
    initial?.metric.filters?.dateRange?.to
  );
  const [taskStatuses, setTaskStatuses] = useState<string[]>(
    initial?.metric.filters?.taskStatus ?? [TaskStatus.Concluida]
  );
  const [taskResponsibleIds, setTaskResponsibleIds] = useState<string[]>(
    initial?.metric.source === 'tasks' ? initialResponsibleIds : []
  );
  const [taskCategoryIds, setTaskCategoryIds] = useState<string[]>(
    initial?.metric.filters?.tags ?? []
  );
  const [transactionType, setTransactionType] = useState<TransactionType | 'all'>(
    initial?.metric.filters?.transactionTypes?.[0] ?? 'Receita'
  );
  const [transactionCategories, setTransactionCategories] = useState<string[]>(
    initial?.metric.filters?.tags ?? []
  );
  const [contactStatusFilter, setContactStatusFilter] = useState<string[]>(
    initial?.metric.filters?.contactStatus ?? []
  );
  const [contactOwnerIds, setContactOwnerIds] = useState<string[]>(
    (initial?.metric.filters?.owners ?? []).map(String)
  );
  const [lawsuitStatusesFilter, setLawsuitStatusesFilter] = useState<string[]>(
    initial?.metric.source === 'lawsuits' ? initial?.metric.filters?.lawsuitStatus ?? [] : []
  );
  const [lawsuitAreasFilter, setLawsuitAreasFilter] = useState<string[]>(
    initial?.metric.source === 'lawsuits' ? initial?.metric.filters?.areas ?? [] : []
  );
  const [lawsuitResponsibleIds, setLawsuitResponsibleIds] = useState<string[]>(
    initial?.metric.source === 'lawsuits' ? initialResponsibleIds : []
  );
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [successThreshold, setSuccessThreshold] = useState<number>(
    Math.round((initial?.thresholds.success ?? 1) * 100)
  );
  const [warningThreshold, setWarningThreshold] = useState<number>(
    Math.round((initial?.thresholds.warning ?? 0.75) * 100)
  );
  const [criticalThreshold, setCriticalThreshold] = useState<number>(
    Math.round((initial?.thresholds.critical ?? 0.5) * 100)
  );
  const [motivationMessage, setMotivationMessage] = useState<string>(
    initial?.motivationMessage ?? ''
  );
  const [checkpointFrequency, setCheckpointFrequency] = useState<Goal['checkpointFrequency']>(
    initial?.checkpointFrequency
  );
  const [reminderFrequency, setReminderFrequency] = useState<
    Goal['notificationSettings'] extends undefined
      ? Goal['checkpointFrequency']
      : Goal['notificationSettings']['reminderFrequency']
  >(initial?.notificationSettings?.reminderFrequency);
  const [notificationChannels, setNotificationChannels] = useState<string[]>(
    initial?.notificationSettings?.channels ?? ['inApp']
  );
  const [beforeDeadlineDays, setBeforeDeadlineDays] = useState<number | undefined>(
    initial?.notificationSettings?.beforeDeadlineDays
  );
  const [mentionAssignees, setMentionAssignees] = useState<boolean>(
    initial?.notificationSettings?.mentionAssignees ?? true
  );
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(
    initialAssignments
      .filter(assignment => assignment.scope === 'collaborator' && assignment.assigneeType === 'user')
      .map(assignment => String(assignment.assigneeId))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (metricSource === 'manual') {
      setAutoUpdate(false);
    }
  }, [metricSource]);

  const handleUserCheckbox = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(
      list.includes(value) ? list.filter(item => item !== value) : [...list, value]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const parsedTarget = Number.isFinite(targetValue) ? targetValue : 0;
      const parsedBaseline = baseline !== undefined ? Number(baseline) : undefined;
      const fallbackUserId = users[0]?.id ?? 0;
      const selectedOwner =
        ownerType === 'user'
          ? Number(selectedOwnerUser || fallbackUserId) || fallbackUserId
          : teamOwner.trim() || 'equipa';

      const filters: Goal['metric']['filters'] = {};
      if (metricDateFrom || metricDateTo) {
        filters.dateRange = {
          from: metricDateFrom || undefined,
          to: metricDateTo || undefined,
        };
      }
      if (metricSource === 'tasks') {
        if (taskStatuses.length > 0) filters.taskStatus = taskStatuses as TaskStatus[];
        if (taskResponsibleIds.length > 0) {
          filters.responsibleIds = taskResponsibleIds.map(id => Number(id)).filter(Number.isFinite);
        }
        if (taskCategoryIds.length > 0) filters.tags = taskCategoryIds;
      }
      if (metricSource === 'transactions') {
        if (transactionType !== 'all') {
          filters.transactionTypes = [transactionType as TransactionType];
        }
        if (transactionCategories.length > 0) filters.tags = transactionCategories;
      }
      if (metricSource === 'contacts') {
        if (contactStatusFilter.length > 0) filters.contactStatus = contactStatusFilter;
        if (contactOwnerIds.length > 0) {
          filters.owners = contactOwnerIds.map(id => {
            const numeric = Number(id);
            return Number.isFinite(numeric) ? numeric : id;
          });
        }
      }
      if (metricSource === 'lawsuits') {
        if (lawsuitStatusesFilter.length > 0) {
          filters.lawsuitStatus = lawsuitStatusesFilter as Goal['metric']['filters']['lawsuitStatus'];
        }
        if (lawsuitAreasFilter.length > 0) {
          filters.areas = lawsuitAreasFilter;
        }
        if (lawsuitResponsibleIds.length > 0) {
          filters.responsibleIds = lawsuitResponsibleIds
            .map(id => Number(id))
            .filter(Number.isFinite);
        }
      }

      const metric: Goal['metric'] = {
        source: metricSource,
        aggregation: metricAggregation,
        unit: metricUnit,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        field:
          metricSource === 'transactions'
            ? 'value'
            : metricSource === 'tasks' && metricAggregation !== 'count'
              ? 'score'
              : undefined,
      };

      const payload: GoalFormPayload = {
        id: initial?.id,
        programId,
        title,
        description,
        ownerType,
        ownerId: selectedOwner ?? undefined,
        periodicity,
        startDate,
        endDate,
        unit,
        baseline: parsedBaseline,
        targetValue: parsedTarget,
        currentValue: initial?.currentValue,
        autoUpdate: metricSource === 'manual' ? false : autoUpdate,
        metric,
        thresholds: {
          success: Math.max(0, Math.min(1, successThreshold / 100)),
          warning: Math.max(0, Math.min(1, warningThreshold / 100)),
          critical: Math.max(0, Math.min(1, criticalThreshold / 100)),
        },
        tags: parseTagsString(tagsInput),
        checkpointFrequency,
        notificationSettings:
          reminderFrequency || beforeDeadlineDays || notificationChannels.length > 0
            ? {
                reminderFrequency: reminderFrequency || undefined,
                channels: notificationChannels.length > 0 ? (notificationChannels as Goal['notificationSettings']['channels']) : undefined,
                beforeDeadlineDays,
                mentionAssignees,
              }
            : undefined,
        motivationMessage: motivationMessage || undefined,
        status: initial?.status,
      };

      await onSubmit(payload, collaboratorIds.map(id => Number(id)));
      onClose();
    } catch (error) {
      console.error(error);
      setFormError('Não foi possível salvar a meta. Revise os campos e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Título da meta</label>
          <input
            required
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Ex.: Faturar R$ 25 mil no trimestre"
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Descrição</label>
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={3}
            placeholder="Contextualize o objetivo, indicadores e premissas."
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Período inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Período final</label>
          <input
            type="date"
            value={endDate}
            onChange={event => setEndDate(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Periodicidade</label>
          <select
            value={periodicity}
            onChange={event => setPeriodicity(event.target.value as GoalPeriodicity)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          >
            {Object.entries(PERIODICITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Unidade</label>
          <select
            value={unit}
            onChange={event => setUnit(event.target.value as GoalUnit)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          >
            {Object.entries(UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Meta alvo</label>
          <input
            type="number"
            step="0.01"
            required
            value={targetValue}
            onChange={event => setTargetValue(Number(event.target.value))}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Baseline</label>
          <input
            type="number"
            step="0.01"
            value={baseline ?? ''}
            onChange={event =>
              setBaseline(event.target.value ? Number(event.target.value) : undefined)
            }
            placeholder="Opcional"
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Responsável</label>
          <select
            value={ownerType}
            onChange={event => setOwnerType(event.target.value as Goal['ownerType'])}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          >
            <option value="team">Equipe</option>
            <option value="user">Usuário</option>
          </select>
        </div>
        <div className="space-y-2">
          {ownerType === 'user' ? (
            <>
              <label className="text-sm font-semibold text-muted-foreground">Usuário responsável</label>
              <select
                value={selectedOwnerUser}
                onChange={event => setSelectedOwnerUser(event.target.value)}
                className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="text-sm font-semibold text-muted-foreground">Equipe/Owner</label>
              <input
                value={teamOwner}
                onChange={event => setTeamOwner(event.target.value)}
                placeholder="Ex.: contencioso, financeiro, marketing..."
                className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
              />
            </>
          )}
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={autoUpdate}
              disabled={metricSource === 'manual'}
              onChange={event => setAutoUpdate(event.target.checked)}
              className="h-4 w-4 rounded border-border/70 text-primary focus:ring-primary"
            />
            Atualizar automaticamente
          </label>
          <p className="text-xs text-muted-foreground">
            Ative para recalcular o progresso sempre que os dados associados forem alterados.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-4 dark:border-dark-border/60 dark:bg-dark-card/40">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            Métrica e fonte de dados
          </h4>
          <div className="flex items-center gap-2">
            <select
              value={metricSource}
              onChange={event => setMetricSource(event.target.value as GoalMetricSourceType)}
              className="rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            >
              {Object.entries(METRIC_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={metricAggregation}
              onChange={event => setMetricAggregation(event.target.value as Goal['metric']['aggregation'])}
              className="rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            >
              <option value="count">Contagem</option>
              <option value="sum">Somatório</option>
              <option value="average">Média</option>
              <option value="percent">% relativo</option>
            </select>
            <select
              value={metricUnit ?? ''}
              onChange={event =>
                setMetricUnit(event.target.value ? (event.target.value as GoalUnit) : undefined)
              }
              className="rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            >
              <option value="">Unidade da métrica</option>
              {Object.entries(UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs text-muted-foreground">
          {metricSource === 'tasks' && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-white/70 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/60">
              <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                Filtros para tarefas
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.values(TaskStatus).map(status => (
                  <label
                    key={status}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5',
                      taskStatuses.includes(status)
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={taskStatuses.includes(status)}
                      onChange={() => handleUserCheckbox(status, taskStatuses, setTaskStatuses)}
                      className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                    />
                    {status}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground dark:text-dark-foreground text-sm">Responsáveis</p>
                <div className="flex flex-wrap gap-2">
                  {users.map(user => (
                    <label
                      key={user.id}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5',
                        taskResponsibleIds.includes(String(user.id))
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={taskResponsibleIds.includes(String(user.id))}
                        onChange={() =>
                          handleUserCheckbox(String(user.id), taskResponsibleIds, setTaskResponsibleIds)
                        }
                        className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                      />
                      {user.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">Categorias</p>
                <div className="flex flex-wrap gap-2">
                  {taskCategories.map(category => (
                    <label
                      key={category.id}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5',
                        taskCategoryIds.includes(category.id)
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={taskCategoryIds.includes(category.id)}
                        onChange={() =>
                          handleUserCheckbox(category.id, taskCategoryIds, setTaskCategoryIds)
                        }
                        className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {metricSource === 'transactions' && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-white/70 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/60">
              <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                Filtros financeiro
              </p>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="transaction-type"
                    value="Receita"
                    checked={transactionType === TransactionType.Receita}
                    onChange={() => setTransactionType(TransactionType.Receita)}
                    className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                  />
                  Receita
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="transaction-type"
                    value="Despesa"
                    checked={transactionType === TransactionType.Despesa}
                    onChange={() => setTransactionType(TransactionType.Despesa)}
                    className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                  />
                  Despesa
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="transaction-type"
                    value="all"
                    checked={transactionType === 'all'}
                    onChange={() => setTransactionType('all')}
                    className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                  />
                  Ambas
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">Categorias</p>
                <div className="flex flex-wrap gap-2">
                  {financialCategories.map(category => (
                    <label
                      key={category.id}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5',
                        transactionCategories.includes(category.id)
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={transactionCategories.includes(category.id)}
                        onChange={() =>
                          handleUserCheckbox(category.id, transactionCategories, setTransactionCategories)
                        }
                        className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {metricSource === 'contacts' && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-white/70 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/60">
              <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                Filtros de contatos
              </p>
              <div className="flex flex-wrap gap-2">
                {contactStatuses.map(status => (
                  <label
                    key={status}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5',
                      contactStatusFilter.includes(status)
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={contactStatusFilter.includes(status)}
                      onChange={() =>
                        handleUserCheckbox(status, contactStatusFilter, setContactStatusFilter)
                      }
                      className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                    />
                    {status}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                  Donos
                </p>
                <div className="flex flex-wrap gap-2">
                  {users.map(user => (
                    <label
                      key={`contact-owner-${user.id}`}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5',
                        contactOwnerIds.includes(String(user.id))
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={contactOwnerIds.includes(String(user.id))}
                        onChange={() =>
                          handleUserCheckbox(String(user.id), contactOwnerIds, setContactOwnerIds)
                        }
                        className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                      />
                      {user.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {metricSource === 'lawsuits' && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-white/70 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/60">
              <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                Filtros de processos
              </p>
              <div className="flex flex-wrap gap-2">
                {lawsuitStatuses.map(status => (
                  <label
                    key={`lawsuit-status-${status}`}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5',
                      lawsuitStatusesFilter.includes(status)
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={lawsuitStatusesFilter.includes(status)}
                      onChange={() =>
                        handleUserCheckbox(status, lawsuitStatusesFilter, setLawsuitStatusesFilter)
                      }
                      className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                    />
                    {status}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {lawsuitAreas.map(area => (
                  <label
                    key={`lawsuit-area-${area}`}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5',
                      lawsuitAreasFilter.includes(area)
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={lawsuitAreasFilter.includes(area)}
                      onChange={() =>
                        handleUserCheckbox(area, lawsuitAreasFilter, setLawsuitAreasFilter)
                      }
                      className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                    />
                    {area}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                  Responsáveis
                </p>
                <div className="flex flex-wrap gap-2">
                  {users.map(user => (
                    <label
                      key={`lawsuit-resp-${user.id}`}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5',
                        lawsuitResponsibleIds.includes(String(user.id))
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={lawsuitResponsibleIds.includes(String(user.id))}
                        onChange={() =>
                          handleUserCheckbox(
                            String(user.id),
                            lawsuitResponsibleIds,
                            setLawsuitResponsibleIds
                          )
                        }
                        className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
                      />
                      {user.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Data inicial (filtro)</label>
              <input
                type="date"
                value={metricDateFrom ?? ''}
                onChange={event => setMetricDateFrom(event.target.value || undefined)}
                className="w-full rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Data final (filtro)</label>
              <input
                type="date"
                value={metricDateTo ?? ''}
                onChange={event => setMetricDateTo(event.target.value || undefined)}
                className="w-full rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Meta verde (%)</label>
          <input
            type="number"
            min={0}
            max={200}
            value={successThreshold}
            onChange={event => setSuccessThreshold(Number(event.target.value))}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Meta amarela (%)</label>
          <input
            type="number"
            min={0}
            max={200}
            value={warningThreshold}
            onChange={event => setWarningThreshold(Number(event.target.value))}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Meta vermelha (%)</label>
          <input
            type="number"
            min={0}
            max={200}
            value={criticalThreshold}
            onChange={event => setCriticalThreshold(Number(event.target.value))}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground">Tags (separe por vírgula)</label>
        <input
          value={tagsInput}
          onChange={event => setTagsInput(event.target.value)}
          placeholder="financeiro, estratégico, q4..."
          className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground">Mensagem motivacional</label>
        <textarea
          value={motivationMessage}
          onChange={event => setMotivationMessage(event.target.value)}
          rows={2}
          placeholder="Mensagem exibida quando a meta for atingida ou estiver quase lá."
          className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-4 dark:border-dark-border/60 dark:bg-dark-card/40">
        <h4 className="text-sm font-semibold text-foreground dark:text-dark-foreground">
          Comunicação e lembretes
        </h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Frequência de lembrete
            </label>
            <select
              value={reminderFrequency ?? ''}
              onChange={event =>
                setReminderFrequency(
                  event.target.value
                    ? (event.target.value as Goal['notificationSettings']['reminderFrequency'])
                    : undefined
                )
              }
              className="w-full rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            >
              <option value="">Sem lembretes</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Dias antes do prazo
            </label>
            <input
              type="number"
              min={0}
              value={beforeDeadlineDays ?? ''}
              onChange={event =>
                setBeforeDeadlineDays(event.target.value ? Number(event.target.value) : undefined)
              }
              className="w-full rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {['inApp', 'email', 'slack'].map(channel => (
            <label
              key={channel}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5',
                notificationChannels.includes(channel)
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border/60'
              )}
            >
              <input
                type="checkbox"
                checked={notificationChannels.includes(channel)}
                onChange={() =>
                  handleUserCheckbox(channel, notificationChannels, setNotificationChannels)
                }
                className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
              />
              {channel === 'inApp' ? 'In-app' : channel.charAt(0).toUpperCase() + channel.slice(1)}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <input
            type="checkbox"
            checked={mentionAssignees}
            onChange={event => setMentionAssignees(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
          />
          Mencionar responsáveis automaticamente
        </label>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white/60 px-4 py-4 dark:border-dark-border/60 dark:bg-dark-card/40">
        <h4 className="text-sm font-semibold text-foreground dark:text-dark-foreground mb-2">
          Colaboradores envolvidos
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Além do responsável principal, selecione pessoas que apoiarão esta meta.
        </p>
        <div className="flex flex-wrap gap-2">
          {users.map(user => (
            <label
              key={`collaborator-${user.id}`}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5',
                collaboratorIds.includes(String(user.id))
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border/60'
              )}
            >
              <input
                type="checkbox"
                checked={collaboratorIds.includes(String(user.id))}
                onChange={() =>
                  handleUserCheckbox(String(user.id), collaboratorIds, setCollaboratorIds)
                }
                className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary"
              />
              {user.name}
            </label>
          ))}
        </div>
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Salvar meta'}
        </Button>
      </div>
    </form>
  );
};

interface CheckpointFormProps {
  goal: Goal;
  initial?: GoalCheckpoint;
  onSubmit: (payload: Omit<GoalCheckpoint, 'id' | 'goalId'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

const CheckpointForm: React.FC<CheckpointFormProps> = ({ goal, initial, onSubmit, onClose }) => {
  const [periodStart, setPeriodStart] = useState(
    initial?.periodStart ?? dayjs().startOf('month').format('YYYY-MM-DD')
  );
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? '');
  const [value, setValue] = useState(initial?.value ?? goal.currentValue);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [recordedAt, setRecordedAt] = useState(
    initial?.recordedAt ?? new Date().toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initial?.id,
        periodStart,
        periodEnd: periodEnd || undefined,
        value,
        notes: notes || undefined,
        recordedAt: recordedAt ? dayjs(recordedAt).toISOString() : new Date().toISOString(),
        authorId: initial?.authorId,
        delta: initial?.delta,
      });
      onClose();
    } catch (error) {
      console.error(error);
      setFormError('Falha ao registrar checkpoint. Verifique os campos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Período inicial</label>
          <input
            type="date"
            value={periodStart}
            onChange={event => setPeriodStart(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Período final</label>
          <input
            type="date"
            value={periodEnd}
            onChange={event => setPeriodEnd(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Valor apurado</label>
        <input
          type="number"
          step="0.01"
          required
          value={value}
          onChange={event => setValue(Number(event.target.value))}
          className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Data de registro</label>
        <input
          type="datetime-local"
          value={recordedAt}
          onChange={event => setRecordedAt(event.target.value)}
          className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Notas</label>
        <textarea
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={3}
          placeholder="Observações importantes, vitórias, aprendizados..."
          className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background dark:text-dark-foreground"
        />
      </div>
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {formError}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Registrar checkpoint'}
        </Button>
      </div>
    </form>
  );
};

const GoalStatusBadge: React.FC<{ status: GoalStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        config.bg,
        config.text
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

const GoalProgressInfo: React.FC<{ goal: Goal }> = ({ goal }) => {
  const progress = getGoalProgressPercentage(goal);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatPercentage(progress)}</span>
        <span>
          {goal.currentValue.toLocaleString(undefined, {
            minimumFractionDigits: goal.unit === 'currency' ? 2 : 0,
            maximumFractionDigits: 2,
          })}{' '}
          /{' '}
          {goal.targetValue.toLocaleString(undefined, {
            minimumFractionDigits: goal.unit === 'currency' ? 2 : 0,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
      <AnimatedProgressBar value={progress} />
    </div>
  );
};

const GoalsManager: React.FC = () => {
  const {
    users,
    contacts,
    lawsuits,
    goalPrograms,
    goals,
    goalAssignments,
    goalCheckpoints,
    categoryGroups,
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
    removeGoalAssignment,
  } = useApp();

  const taskCategories = useMemo<CategoryItem[]>(
    () => categoryGroups.find(group => group.id === 'tasks')?.items ?? [],
    [categoryGroups]
  );
  const financialCategories = useMemo<CategoryItem[]>(
    () => categoryGroups.find(group => group.id === 'financial')?.items ?? [],
    [categoryGroups]
  );
  const contactStatusOptions = useMemo(() => {
    const statuses = new Set<string>();
    contacts.forEach(contact => statuses.add(contact.status));
    goals.forEach(goal => {
      if (goal.metric.source === 'contacts' && goal.metric.filters?.contactStatus) {
        goal.metric.filters.contactStatus.forEach(status => statuses.add(status));
      }
    });
    return statuses.size > 0 ? Array.from(statuses).sort() : ['Lead', 'Prospect', 'Cliente'];
  }, [contacts, goals]);

  const lawsuitAreasOptions = useMemo(() => {
    const areas = new Set<string>();
    lawsuits.forEach(lawsuit => areas.add(lawsuit.area));
    goals.forEach(goal => {
      if (goal.metric.source === 'lawsuits' && goal.metric.filters?.areas) {
        goal.metric.filters.areas.forEach(area => areas.add(area));
      }
    });
    return Array.from(areas);
  }, [lawsuits, goals]);

  const lawsuitStatusOptions = useMemo(() => {
    const statuses = new Set<string>();
    lawsuits.forEach(lawsuit => statuses.add(lawsuit.status));
    goals.forEach(goal => {
      if (goal.metric.source === 'lawsuits' && goal.metric.filters?.lawsuitStatus) {
        goal.metric.filters.lawsuitStatus.forEach(status => statuses.add(status));
      }
    });
    return Array.from(statuses);
  }, [lawsuits, goals]);

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    goalPrograms[0]?.id ?? null
  );
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<GoalProgram | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [checkpointModalOpen, setCheckpointModalOpen] = useState(false);
  const [checkpointGoal, setCheckpointGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!selectedProgramId && goalPrograms.length > 0) {
      setSelectedProgramId(goalPrograms[0].id);
      return;
    }
    if (selectedProgramId && !goalPrograms.some(program => program.id === selectedProgramId)) {
      setSelectedProgramId(goalPrograms[0]?.id ?? null);
    }
  }, [goalPrograms, selectedProgramId]);

  const selectedProgram = useMemo(
    () => goalPrograms.find(program => program.id === selectedProgramId) ?? null,
    [goalPrograms, selectedProgramId]
  );

  const programGoals = useMemo(
    () =>
      selectedProgram
        ? goals
            .filter(goal => goal.programId === selectedProgram.id)
            .sort((a, b) => statusSortValue(a.status) - statusSortValue(b.status))
        : [],
    [goals, selectedProgram]
  );

  const checkpointsByGoal = useMemo(
    () => groupGoalCheckpoints(goalCheckpoints),
    [goalCheckpoints]
  );

  const latestCheckpoints = useMemo(() => {
    const map = new Map<string, GoalCheckpoint>();
    programGoals.forEach(goal => {
        const latest = getLatestGoalCheckpoint(checkpointsByGoal.get(goal.id));
      if (latest) {
        map.set(goal.id, latest);
      }
    });
    return map;
  }, [programGoals, checkpointsByGoal]);

  const assignmentsByGoal = useMemo(
    () => getGoalAssignmentsMap(goalAssignments),
    [goalAssignments]
  );

  const programSummary = useMemo(() => {
    if (!programGoals.length) {
      return {
        averageProgress: 0,
        totalGoals: 0,
        achieved: 0,
        onTrack: 0,
        attention: 0,
        critical: 0,
        autoGoals: 0,
      };
    }
    const totals = programGoals.reduce(
      (acc, goal) => {
        const ratio =
          goal.targetValue > 0 ? Math.min(1, Math.max(0, goal.currentValue / goal.targetValue)) : 0;
        acc.sumRatio += ratio;
        acc[goal.status] += 1;
        if (goal.autoUpdate) acc.autoGoals += 1;
        return acc;
      },
      {
        sumRatio: 0,
        achieved: 0,
        onTrack: 0,
        attention: 0,
        critical: 0,
        autoGoals: 0,
      }
    );
    return {
      averageProgress: (totals.sumRatio / programGoals.length) * 100,
      totalGoals: programGoals.length,
      achieved: totals.achieved,
      onTrack: totals.onTrack,
      attention: totals.attention,
      critical: totals.critical,
      autoGoals: totals.autoGoals,
    };
  }, [programGoals]);

  const criticalGoals = useMemo(
    () =>
      programGoals
        .filter(goal => goal.status === 'critical' || goal.status === 'attention')
        .sort((a, b) => getGoalProgressPercentage(a) - getGoalProgressPercentage(b))
        .slice(0, 3),
    [programGoals]
  );

  const programCheckpoints = useMemo(() => {
    if (!programGoals.length) return [];
    const goalIds = new Set(programGoals.map(goal => goal.id));
    return goalCheckpoints
      .filter(checkpoint => goalIds.has(checkpoint.goalId))
      .sort((a, b) => dayjs(b.recordedAt).valueOf() - dayjs(a.recordedAt).valueOf())
      .slice(0, 6);
  }, [programGoals, goalCheckpoints]);

  const handleCreateProgram = async (payload: Omit<GoalProgram, 'id'> & { id?: string }) => {
    const created = await createGoalProgram(payload);
    setSelectedProgramId(created.id);
  };

  const handleUpdateProgram = async (payload: Omit<GoalProgram, 'id'> & { id?: string }) => {
    if (!editingProgram) return;
    await updateGoalProgram(editingProgram.id, payload);
  };

  const handleRemoveProgram = (program: GoalProgram) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o programa "${program.name}"? As metas associadas serão removidas.`
      )
    ) {
      removeGoalProgram(program.id);
    }
  };

  const handleCreateGoal = async (
    payload: GoalFormPayload,
    collaboratorIds: number[]
  ) => {
    const created = createGoal(payload);
    collaboratorIds.forEach(userId => {
      addGoalAssignment({
        goalId: created.id,
        assigneeType: 'user',
        assigneeId: userId,
        scope: 'collaborator',
      });
    });
  };

  const handleUpdateGoal = async (
    payload: GoalFormPayload,
    collaboratorIds: number[]
  ) => {
    if (!editingGoal) return;
    updateGoal(editingGoal.id, payload);
    const existingAssignments =
      assignmentsByGoal.get(editingGoal.id)?.filter(a => a.scope === 'collaborator') ?? [];
    const existingIds = new Set(existingAssignments.map(assignment => Number(assignment.assigneeId)));

    collaboratorIds.forEach(id => {
      if (!existingIds.has(id)) {
        addGoalAssignment({
          goalId: editingGoal.id,
          assigneeType: 'user',
          assigneeId: id,
          scope: 'collaborator',
        });
      }
    });

    existingAssignments.forEach(assignment => {
      const numericId = Number(assignment.assigneeId);
      if (!collaboratorIds.includes(numericId)) {
        removeGoalAssignment(assignment.id);
      }
    });
  };

  const handleDuplicateGoal = (goal: Goal) => {
    const duplicated = duplicateGoal(goal.id, {
      title: `${goal.title} (próximo ciclo)`,
      startDate: dayjs(goal.startDate).add(3, 'month').format('YYYY-MM-DD'),
      endDate: dayjs(goal.endDate).add(3, 'month').format('YYYY-MM-DD'),
      currentValue: goal.autoUpdate ? 0 : goal.currentValue,
      status: 'attention',
    });
    if (duplicated) {
      setEditingGoal(duplicated);
      setGoalModalOpen(true);
    }
  };

  const handleRemoveGoal = (goal: Goal) => {
    if (
      window.confirm(
        `Confirma a exclusão da meta "${goal.title}"? Esta ação não pode ser desfeita.`
      )
    ) {
      removeGoal(goal.id);
    }
  };

  const handleCheckpointSubmit = async (
    payload: Omit<GoalCheckpoint, 'id' | 'goalId'> & { id?: string }
  ) => {
    if (!checkpointGoal) return;
    if (payload.id) {
      updateGoalCheckpoint(payload.id, payload);
    } else {
      recordGoalCheckpoint(checkpointGoal.id, payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-foreground dark:text-dark-foreground">
            Programas e Metas
          </h2>
          <p className="text-sm text-muted-foreground dark:text-dark-muted">
            Estruture metas por programas, acompanhe checkpoints e acelere conquistas da equipe.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setEditingProgram(null);
              setProgramModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo programa
          </Button>
          {selectedProgram && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setEditingGoal(null);
                setGoalModalOpen(true);
              }}
            >
              <Target className="h-4 w-4" />
              Nova meta
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-5 w-5 text-primary" />
              Programas
            </CardTitle>
            <CardDescription className="text-xs">
              Selecione um programa para visualizar e editar suas metas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalPrograms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/40">
                Nenhum programa cadastrado ainda. Comece criando um programa estratégico.
              </div>
            ) : (
              goalPrograms.map(program => {
                const isActive = program.id === selectedProgramId;
                const programGoalList = goals.filter(goal => goal.programId === program.id);
                const achieved = programGoalList.filter(goal => goal.status === 'achieved').length;
                const progressAverage =
                  programGoalList.length > 0
                    ? programGoalList.reduce((acc, goal) => acc + getGoalProgressPercentage(goal), 0) /
                      programGoalList.length
                    : 0;

                return (
                  <button
                    key={program.id}
                    onClick={() => setSelectedProgramId(program.id)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left transition hover:border-primary/60',
                      isActive
                        ? 'border-primary/70 bg-primary/5'
                        : 'border-border/60 dark:border-dark-border/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                          {program.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {programGoalList.length} metas · {achieved} alcançadas
                        </span>
                      </div>
                      <span
                        className="h-2 w-8 rounded-full"
                        style={{ backgroundColor: program.color ?? '#0EA5E9' }}
                      />
                    </div>
                    <div className="mt-3">
                      <AnimatedProgressBar value={progressAverage} />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {dayjs(program.startDate).format('DD/MM/YY')} -{' '}
                          {dayjs(program.endDate).format('DD/MM/YY')}
                        </span>
                        <span>{formatPercentage(progressAverage)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5">
                        <UsersIcon className="h-3 w-3" />
                        {program.visibility === 'global'
                          ? 'Organização'
                          : program.visibility === 'team'
                            ? `Equipe ${program.ownerTeamId ?? ''}`
                            : 'Individual'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5">
                        <Sparkles className="h-3 w-3" />
                        {program.type}
                      </span>
                    </div>
                    {isActive && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={event => {
                            event.stopPropagation();
                            setEditingProgram(program);
                            setProgramModalOpen(true);
                          }}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                          onClick={event => {
                            event.stopPropagation();
                            handleRemoveProgram(program);
                          }}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedProgram ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-primary/20 bg-primary/5 shadow-sm dark:border-primary/40 dark:bg-primary/10">
                  <CardContent className="flex flex-col gap-2 py-4">
                    <div className="flex items-center justify-between text-xs text-primary">
                      <div className="flex items-center gap-2 font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        Progresso médio
                      </div>
                      <span>{programGoals.length} metas</span>
                    </div>
                    <div className="text-2xl font-semibold text-primary">
                      {formatPercentage(programSummary.averageProgress)}
                    </div>
                    <AnimatedProgressBar value={programSummary.averageProgress} />
                  </CardContent>
                </Card>
                <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                        Alcançadas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {programSummary.achieved} de {programSummary.totalGoals}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                        Em atenção
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {programSummary.attention + programSummary.critical} metas precisam de atenção
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-primary" />
                      Metas do programa
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ordenadas por status para priorizar atenção.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      setEditingGoal(null);
                      setGoalModalOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar meta
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {programGoals.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/40">
                      Nenhuma meta cadastrada ainda. Adicione metas para acompanhar o desempenho.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {programGoals.map(goal => {
                                const progress = getGoalProgressPercentage(goal);
                        const checkpoint = latestCheckpoints.get(goal.id);
                        const assignments = assignmentsByGoal.get(goal.id) ?? [];
                        const collaborators = assignments.filter(
                          assignment => assignment.scope === 'collaborator'
                        );
                        const dueInDays = dayjs(goal.endDate).diff(dayjs(), 'day');

                        return (
                          <div
                            key={goal.id}
                            className="rounded-xl border border-border/60 bg-white px-4 py-4 shadow-sm transition hover:border-primary/50 dark:border-dark-border/60 dark:bg-dark-card/60"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                                    {goal.title}
                                  </h3>
                                  <GoalStatusBadge status={goal.status} />
                                  {goal.autoUpdate && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                      <Activity className="h-3 w-3" />
                                      Automática
                                    </span>
                                  )}
                                </div>
                                {goal.description && (
                                  <p className="text-xs text-muted-foreground dark:text-dark-muted">
                                    {goal.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {dayjs(goal.startDate).format('DD/MM/YY')} -{' '}
                                    {dayjs(goal.endDate).format('DD/MM/YY')}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />
                                    {goal.ownerType === 'user'
                                      ? users.find(user => user.id === goal.ownerId)?.name ??
                                        `Usuário #${goal.ownerId}`
                                      : String(goal.ownerId)}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Gauge className="h-3 w-3" />
                                    {UNIT_LABELS[goal.unit]}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {dueInDays >= 0
                                      ? `Restam ${dueInDays} dias`
                                      : `Vencida há ${Math.abs(dueInDays)} dias`}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => {
                                    setEditingGoal(goal);
                                    setGoalModalOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-1 h-3.5 w-3.5" />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handleDuplicateGoal(goal)}
                                >
                                  <Copy className="mr-1 h-3.5 w-3.5" />
                                  Duplicar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => {
                                    setCheckpointGoal(goal);
                                    setCheckpointModalOpen(true);
                                  }}
                                >
                                  <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                                  Checkpoint
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs text-red-500 hover:text-red-600"
                                  onClick={() => handleRemoveGoal(goal)}
                                >
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  Remover
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <GoalProgressInfo goal={goal} />
                              <div className="flex flex-col gap-2 text-[11px] text-muted-foreground md:items-end">
                                <div className="flex items-center gap-2">
                                  <Circle className="h-3 w-3 text-primary" />
                                  {METRIC_SOURCE_LABELS[goal.metric.source]}
                                  <span className="h-1 w-16 rounded-full bg-border/60" />
                                  {goal.metric.aggregation === 'count'
                                    ? 'Contagem'
                                    : goal.metric.aggregation === 'sum'
                                      ? 'Somatório'
                                      : goal.metric.aggregation === 'average'
                                        ? 'Média'
                                        : '% relativo'}
                                </div>
                                {checkpoint ? (
                                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Último checkpoint em{' '}
                                    {dayjs(checkpoint.recordedAt).format('DD/MM')} ·{' '}
                                    {checkpoint.value.toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Nenhum checkpoint registrado.
                                  </div>
                                )}
                                {collaborators.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      Colaboradores:
                                    </span>
                                    {collaborators.map(collaborator => {
                                      const user =
                                        collaborator.assigneeType === 'user'
                                          ? users.find(u => u.id === collaborator.assigneeId)
                                          : null;
                                      return (
                                        <span
                                          key={collaborator.id}
                                          className="rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground dark:bg-dark-border/40"
                                        >
                                          {user ? user.name : collaborator.assigneeId}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LineChart className="h-4 w-4 text-primary" />
                    Checkpoints recentes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Acompanhe evoluções registradas nas metas deste programa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {programCheckpoints.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/5 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/40">
                      Nenhum checkpoint registrado ainda. Incentive os responsáveis a atualizar o andamento regularmente.
                    </div>
                  ) : (
                    programCheckpoints.map(checkpoint => {
                      const goal = programGoals.find(item => item.id === checkpoint.goalId);
                      if (!goal) return null;
                      return (
                        <div
                          key={checkpoint.id}
                          className="flex flex-col gap-1 rounded-lg border border-border/40 bg-white px-3 py-3 text-xs shadow-sm md:flex-row md:items-center md:justify-between dark:border-dark-border/40 dark:bg-dark-card/60"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground dark:text-dark-foreground">
                              {goal.title}
                            </span>
                            <span className="text-muted-foreground">
                              {dayjs(checkpoint.periodStart).format('DD/MM')} →
                              {checkpoint.periodEnd ? ` ${dayjs(checkpoint.periodEnd).format('DD/MM')}` : ' atual'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              <Sparkles className="h-3 w-3" />
                              {checkpoint.value.toLocaleString()}
                            </span>
                            {checkpoint.notes && (
                              <span className="max-w-[240px] truncate text-muted-foreground">
                                “{checkpoint.notes}”
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Metas em atenção
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Priorize ajustes nas metas com menor desempenho relativo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criticalGoals.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/5 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/40">
                      Nenhuma meta crítica no momento. Mantenha o ritmo!
                    </div>
                  ) : (
                    criticalGoals.map(goal => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs shadow-sm dark:border-red-500/30 dark:bg-red-500/10"
                      >
                        <div>
                          <p className="font-semibold text-red-600 dark:text-red-300">{goal.title}</p>
                          <p className="text-[11px] text-red-500 dark:text-red-200">
                        {formatPercentage(getGoalProgressPercentage(goal))} atingido •{' '}
                            {dayjs(goal.endDate).fromNow()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                          onClick={() => {
                            setEditingGoal(goal);
                            setGoalModalOpen(true);
                          }}
                        >
                          Plano de ação
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/40">
              Nenhum programa selecionado. Crie um novo programa para começar a estruturar suas metas.
            </div>
          )}
        </div>
      </div>

      <SimpleModal
        open={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        title={editingProgram ? 'Editar programa de metas' : 'Novo programa de metas'}
        description="Defina período, visibilidade e tags estratégicas para agrupar suas metas."
      >
        <GoalProgramForm
          initial={editingProgram ?? undefined}
          onSubmit={async payload => {
            if (editingProgram) {
              await handleUpdateProgram(payload);
            } else {
              await handleCreateProgram(payload);
            }
          }}
          onClose={() => setProgramModalOpen(false)}
        />
      </SimpleModal>

      <SimpleModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={editingGoal ? 'Editar meta' : 'Nova meta'}
        description="Configure indicadores, responsáveis e thresholds para acompanhar o progresso."
        widthClass="max-w-4xl"
      >
        {selectedProgram && (
          <GoalForm
            programId={selectedProgram.id}
            initial={editingGoal ?? undefined}
            initialAssignments={
              editingGoal ? assignmentsByGoal.get(editingGoal.id) ?? [] : undefined
            }
            onSubmit={async (payload, collaboratorIds) => {
              if (editingGoal) {
                await handleUpdateGoal(payload, collaboratorIds);
              } else {
                await handleCreateGoal(payload, collaboratorIds);
              }
            }}
            onClose={() => setGoalModalOpen(false)}
            users={users}
            taskCategories={taskCategories}
            financialCategories={financialCategories}
            contactStatuses={contactStatusOptions}
            lawsuitAreas={lawsuitAreasOptions}
            lawsuitStatuses={
              lawsuitStatusOptions.length > 0
                ? lawsuitStatusOptions
                : ['Ativo', 'Fechado', 'Arquivado']
            }
          />
        )}
      </SimpleModal>

      <SimpleModal
        open={checkpointModalOpen}
        onClose={() => setCheckpointModalOpen(false)}
        title="Registrar checkpoint"
        description="Atualize o andamento desta meta e registre aprendizados do período."
        widthClass="max-w-xl"
      >
        {checkpointGoal && (
          <CheckpointForm
            goal={checkpointGoal}
            onSubmit={handleCheckpointSubmit}
            onClose={() => setCheckpointModalOpen(false)}
          />
        )}
      </SimpleModal>
    </div>
  );
};

export default GoalsManager;
