import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ChevronDown,
  ChevronRight,
  CalendarDays,
  ExternalLink,
  AlertTriangle,
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import { Task, TaskStatus } from '../../types/types';
import { Tag } from '../ui/Tag';
import { cn } from '../../lib/utils';

dayjs.extend(relativeTime);

export type TaskBuckets = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  done: Task[];
};

type BucketKey = keyof TaskBuckets;

interface UnifiedTaskListProps {
  data: TaskBuckets;
  loading?: boolean;
  emptyMessage?: string;
  resolveAssignee?: (task: Task) => string;
  visibleSections?: BucketKey[];
  onOpenTask?: (task: Task) => void;
  onRegisterTime?: (task: Task) => void;
  onCompleteTask?: (task: Task) => void;
}

const SECTION_CONFIG: Array<{ key: BucketKey; label: string; tone: 'overdue' | 'today' | 'upcoming' | 'done' }> = [
  { key: 'overdue', label: 'Atrasadas', tone: 'overdue' },
  { key: 'today', label: 'Hoje', tone: 'today' },
  { key: 'upcoming', label: 'Próximos 7 dias', tone: 'upcoming' },
  { key: 'done', label: 'Concluídas', tone: 'done' },
];

const STATUS_ICON: Record<BucketKey, React.ComponentType<{ className?: string }>> = {
  overdue: AlertTriangle,
  today: CalendarClock,
  upcoming: CalendarCheck,
  done: CheckCircle2,
};

const defaultExpanded: Record<BucketKey, boolean> = {
  overdue: true,
  today: true,
  upcoming: true,
  done: false,
};

const formatDeadline = (task: Task): string => {
  const dueDate = dayjs(task.dueDate || task.deadline);
  return dueDate.isValid() ? dueDate.format('DD MMM YYYY') : 'Sem data';
};

export const UnifiedTaskList: React.FC<UnifiedTaskListProps> = ({
  data,
  loading = false,
  emptyMessage,
  resolveAssignee,
  visibleSections,
  onOpenTask,
  onRegisterTime,
  onCompleteTask,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<BucketKey, boolean>>(defaultExpanded);

  const counts = useMemo(() => {
    return SECTION_CONFIG.reduce((acc, section) => {
      acc[section.key] = data[section.key]?.length ?? 0;
      return acc;
    }, {} as Record<BucketKey, number>);
  }, [data]);

  const visibleSet = useMemo(() => (visibleSections ? new Set<BucketKey>(visibleSections) : null), [visibleSections]);

  const toggleSection = (section: BucketKey) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-2 rounded-2xl border border-[var(--border-muted)] bg-white/80 p-4 shadow-sm"
          >
            <div className="skeleton h-4 w-40 rounded" />
            <div className="space-y-2">
              <div className="skeleton h-12 rounded-lg" />
              <div className="skeleton h-12 rounded-lg" />
              <div className="skeleton h-12 rounded-lg" />
            </div>
          </div>
        ))}
        <span className="sr-only">Carregando tarefas</span>
      </div>
    );
  }

  const totalTasks = SECTION_CONFIG.reduce((acc, section) => acc + counts[section.key], 0);

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-muted)] bg-white/80 px-6 py-16 text-center shadow-sm">
        <CalendarDays className="h-8 w-8 text-[var(--color-info)]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">
          {emptyMessage ?? 'Sem prazos por aqui — excelente trabalho!'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Toque em “Adicionar tarefa” para registrar um novo compromisso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {SECTION_CONFIG.map(section => {
        if (visibleSet && !visibleSet.has(section.key)) {
          return null;
        }

        const tasks = data[section.key] ?? [];
        const expanded = expandedSections[section.key];
        const Icon = STATUS_ICON[section.key];

        return (
          <section
            key={section.key}
            className="rounded-2xl border border-[var(--border-muted)] bg-white/95 shadow-sm dark:border-white/15 dark:bg-white/5"
            aria-label={`${section.label} (${counts[section.key]})`}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              onClick={() => toggleSection(section.key)}
              aria-expanded={expanded}
            >
              <div className="flex items-center gap-3">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  {section.label} ({counts[section.key]})
                </h3>
              </div>
              <Tag tone={section.tone} aria-hidden="true">
                {section.key === 'overdue' && 'Urgente'}
                {section.key === 'today' && 'Hoje'}
                {section.key === 'upcoming' && 'Planeje'}
                {section.key === 'done' && 'Registro'}
              </Tag>
            </button>

            {expanded && (
              <div role="list" className="space-y-2 border-t border-[var(--border-muted)] px-4 py-3 dark:border-white/10">
                {tasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--border-muted)] bg-[var(--color-secondary)]/60 px-4 py-4 text-center text-xs text-slate-600">
                    Nenhuma tarefa nesta seção.{' '}
                    <a href="/#/tarefas" className="font-semibold text-[var(--color-primary)]">
                      Adicionar tarefa
                    </a>
                  </p>
                ) : (
                  tasks.map(task => {
                    const assignee = resolveAssignee ? resolveAssignee(task) : task.responsibleId ? `#${task.responsibleId}` : 'Equipe';
                    const dueReference = dayjs(task.deadline || task.dueDate);
                    const relativeDeadline = dueReference.isValid() ? dueReference.fromNow() : 'Sem prazo definido';

                    const handleOpen = () => onOpenTask?.(task);
                    const handleRegister = (event: React.MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                      onRegisterTime?.(task);
                    };
                    const handleComplete = (event: React.MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                      onCompleteTask?.(task);
                    };

                    return (
                      <article
                        key={task.id}
                        role="listitem"
                        tabIndex={0}
                        className={cn('task-card', {
                          'task-card--overdue': section.key === 'overdue',
                          'task-card--today': section.key === 'today',
                          'task-card--upcoming': section.key === 'upcoming',
                          'task-card--done': section.key === 'done',
                        })}
                        onClick={handleOpen}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpen();
                          }
                        }}
                        aria-label={`${task.title} - ${section.label}`}
                      >
                        <span className="task-card__status-bar" aria-hidden="true" />
                        <div className="task-card__header">
                          <div className="flex-1 space-y-1">
                            <p className="task-card__title">{task.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>Prazo: {formatDeadline(task)}</span>
                            </div>
                          </div>
                          <Tag tone={section.tone} aria-label={`Status ${task.status}`}>
                            {section.key === 'done' ? 'Finalizada' : task.status}
                          </Tag>
                        </div>
                        <div className="task-card__meta">
                          <span>Responsável: {assignee}</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" aria-hidden="true" />
                            {relativeDeadline}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                            Detalhes <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="task-card__actions">
                          {onRegisterTime && (
                            <button
                              type="button"
                              className="task-card__action-btn"
                              onClick={handleRegister}
                              title="Registrar tempo"
                              aria-label="Registrar tempo"
                            >
                              <PlayCircle className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                          {onCompleteTask && task.status !== TaskStatus.Concluida && (
                            <button
                              type="button"
                              className="task-card__action-btn"
                              onClick={handleComplete}
                              title="Marcar como concluída"
                              aria-label="Marcar como concluída"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
