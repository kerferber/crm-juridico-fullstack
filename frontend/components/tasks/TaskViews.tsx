import React, { useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Task, TaskStatus, CategoryItem } from '../../types/types';
import { cn } from '../../lib/utils';
import { CalendarDays, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';

export type TaskSectionKey = 'overdue' | 'today' | 'upcoming' | 'completed';

export interface TaskSection {
  key: TaskSectionKey;
  title: string;
  subtitle: string;
  accentClass: string;
  counterClass: string;
  tasks: Task[];
}

interface BuildSectionsOptions {
  today?: dayjs.Dayjs;
  upcomingDays?: number;
}

const defaultSectionMeta: Record<TaskSectionKey, Omit<TaskSection, 'tasks'>> = {
  overdue: {
    key: 'overdue',
    title: 'Atrasadas',
    subtitle: 'Itens com prazo vencido exigem atenção imediata.',
    accentClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200',
    counterClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200',
  },
  today: {
    key: 'today',
    title: 'Hoje',
    subtitle: 'Prioridades do dia para manter o ritmo.',
    accentClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200',
    counterClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200',
  },
  upcoming: {
    key: 'upcoming',
    title: 'Próximos dias',
    subtitle: 'Prepare-se para os compromissos em seguida.',
    accentClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-200',
    counterClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-200',
  },
  completed: {
    key: 'completed',
    title: 'Concluídas hoje',
    subtitle: 'Resultados registrados nas últimas horas.',
    accentClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
    counterClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
};

export const buildTaskSections = (
  tasks: Task[],
  options?: BuildSectionsOptions
): TaskSection[] => {
  const referenceDay = options?.today ?? dayjs().startOf('day');
  const upcomingDays = options?.upcomingDays ?? 7;
  const upcomingLimit = referenceDay.add(upcomingDays, 'day').endOf('day');

  const base: Record<TaskSectionKey, Task[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  };

  tasks.forEach(task => {
    const due = dayjs(task.dueDate).startOf('day');
    const deadline = dayjs(task.deadline).startOf('day');

    if (task.status === TaskStatus.Concluida) {
      if (due.isSame(referenceDay, 'day')) {
        base.completed.push(task);
      }
      return;
    }

    if (deadline.isBefore(referenceDay, 'day')) {
      base.overdue.push(task);
      return;
    }

    if (due.isSame(referenceDay, 'day')) {
      base.today.push(task);
      return;
    }

    if (due.isAfter(referenceDay, 'day') && due.isSameOrBefore(upcomingLimit, 'day')) {
      base.upcoming.push(task);
    }
  });

  base.overdue.sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)));
  base.today.sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)));
  base.upcoming.sort((a, b) => dayjs(a.dueDate).diff(dayjs(b.dueDate)));
  base.completed.sort((a, b) => dayjs(b.deadline).diff(dayjs(a.deadline)));

  return (Object.keys(base) as TaskSectionKey[]).map(key => ({
    ...defaultSectionMeta[key],
    tasks: base[key],
  }));
};

interface TaskListViewProps {
  sections: TaskSection[];
  onSelect?: (task: Task) => void;
}

const TaskListRow: React.FC<{
  task: Task;
  onSelect?: (task: Task) => void;
  categoryMap: Map<string, CategoryItem>;
  lawsuitMap: Map<number, { internalNumber: string }>;
  contactMap: Map<number, { name: string }>;
}> = ({ task, onSelect, categoryMap, lawsuitMap, contactMap }) => {
  const isOverdue =
    task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(dayjs(), 'day');
  const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
  const categoryLabel = category?.name ?? (task.categoryId ? 'Categoria removida' : undefined);
  const linkedLawsuit = task.lawsuitId ? lawsuitMap.get(task.lawsuitId) : undefined;
  const linkedContact = task.clientId ? contactMap.get(task.clientId) : undefined;

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 text-sm transition hover:bg-muted/40 dark:hover:bg-dark-border/30 lg:flex-row lg:items-center lg:gap-4">
      <Link
        to={`/tarefas/${task.id}`}
        className="flex flex-1 items-center justify-between gap-6 rounded-lg border border-transparent px-2 py-1 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-dark-border/40"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
            {task.title}
          </span>
          <span className="text-xs text-muted-foreground">
            Prazo: {task.deadline ? dayjs(task.deadline).format('DD/MM/YYYY') : '—'} · Previsto:{' '}
            {dayjs(task.dueDate).format('DD/MM/YYYY')}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category?.color || '#CBD5F5' }}
              />
              {categoryLabel}
            </span>
          )}
          {(linkedLawsuit || linkedContact) && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {linkedLawsuit && (
                <Link
                  to={`/processos/${task.lawsuitId}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-primary hover:border-primary/60 dark:border-dark-border/60 dark:text-dark-primary"
                >
                  Processo {linkedLawsuit.internalNumber}
                </Link>
              )}
              {linkedContact && (
                <Link
                  to={`/contatos/${task.clientId}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-primary hover:border-primary/60 dark:border-dark-border/60 dark:text-dark-primary"
                >
                  Cliente {linkedContact.name}
                </Link>
              )}
            </div>
          )}
        </div>
        <span
          className={cn(
            'rounded-lg px-2.5 py-1 text-[11px] font-semibold-uppercase tracking-wide',
            task.status === TaskStatus.Concluida
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200'
              : isOverdue
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200'
          )}
        >
          {task.status}
        </span>
      </Link>
      {onSelect && (
        <Button
          variant="ghost"
          size="icon"
          className="self-start text-muted-foreground hover:text-primary"
          onClick={() => onSelect(task)}
        >
          <Edit3 className="h-4 w-4" />
          <span className="sr-only">Editar tarefa</span>
        </Button>
      )}
    </div>
  );
};

export const TaskListView: React.FC<TaskListViewProps> = ({ sections, onSelect }) => {
  const { categoryGroups, lawsuits, contacts } = useApp();
  const taskCategoryMap = useMemo(() => {
    const group = categoryGroups.find(categoryGroup => categoryGroup.id === 'tasks');
    const map = new Map<string, CategoryItem>();
    if (group) {
      group.items.forEach(item => {
        map.set(item.id, item);
      });
    }
    return map;
  }, [categoryGroups]);
  const lawsuitMap = useMemo(() => {
    const map = new Map<number, { internalNumber: string }>();
    lawsuits.forEach(lawsuit => {
      map.set(lawsuit.id, { internalNumber: lawsuit.internalNumber });
    });
    return map;
  }, [lawsuits]);
  const contactMap = useMemo(() => {
    const map = new Map<number, { name: string }>();
    contacts.forEach(contact => {
      map.set(contact.id, { name: contact.name });
    });
    return map;
  }, [contacts]);

  const sectionsWithContent = sections.filter(section => section.tasks.length > 0);
  if (sectionsWithContent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 px-5 py-5">
      {sectionsWithContent.map(section => (
        <div
          key={section.key}
          className="rounded-xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70"
        >
          <header className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 dark:border-dark-border/50">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                {section.title}
              </h3>
              <p className="text-[11px] text-muted-foreground">{section.subtitle}</p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', section.accentClass)}>
              {section.tasks.length}
            </span>
          </header>
          <div className="divide-y divide-border/60 dark:divide-dark-border/50">
            {section.tasks.map(task => (
              <TaskListRow
                key={task.id}
                task={task}
                onSelect={onSelect}
                categoryMap={taskCategoryMap}
                lawsuitMap={lawsuitMap}
                contactMap={contactMap}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface TaskBoardViewProps {
  sections: TaskSection[];
  onSelect: (task: Task) => void;
  onStatusDrop?: (taskId: number, targetSection: TaskSectionKey) => void;
}

const TaskBoardCard: React.FC<{
  task: Task;
  onSelect?: (task: Task) => void;
  categoryMap: Map<string, CategoryItem>;
  lawsuitMap: Map<number, { internalNumber: string }>;
  contactMap: Map<number, { name: string }>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}> = ({ task, onSelect, categoryMap, lawsuitMap, contactMap, onDragStart, onDragEnd }) => {
  const isOverdue =
    task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(dayjs(), 'day');
  const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
  const categoryLabel = category?.name ?? (task.categoryId ? 'Categoria removida' : undefined);
  const linkedLawsuit = task.lawsuitId ? lawsuitMap.get(task.lawsuitId) : undefined;
  const linkedContact = task.clientId ? contactMap.get(task.clientId) : undefined;
  return (
    <div
      className="flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-white px-4 pb-4 text-left shadow-[0_14px_24px_-22px_rgba(15,23,42,0.38)] transition hover:-translate-y-[2px] hover:border-primary/50 hover:shadow-lg dark:border-dark-border/60 dark:bg-dark-card/70"
      draggable
      onDragStart={event => {
        event.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
    >
      <Link
        to={`/tarefas/${task.id}`}
        className="space-y-2 pt-4 transition hover:text-primary"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            {task.title}
          </span>
          <span
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]',
              task.status === TaskStatus.Concluida
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200'
                : isOverdue
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200'
            )}
          >
            {task.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {task.deadline ? dayjs(task.deadline).format('DD/MM/YYYY') : 'Sem prazo definido'}
        </div>
        {categoryLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-dark-border/40">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: category?.color || '#CBD5F5' }}
            />
            {categoryLabel}
          </span>
        )}
        {(linkedLawsuit || linkedContact) && (
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {linkedLawsuit && (
              <Link
                to={`/processos/${task.lawsuitId}`}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-primary hover:border-primary/60 dark:border-dark-border/60 dark:text-dark-primary"
              >
                Processo {linkedLawsuit.internalNumber}
              </Link>
            )}
            {linkedContact && (
              <Link
                to={`/contatos/${task.clientId}`}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-primary hover:border-primary/60 dark:border-dark-border/60 dark:text-dark-primary"
              >
                Cliente {linkedContact.name}
              </Link>
            )}
          </div>
        )}
      </Link>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Previsto para {dayjs(task.dueDate).format('DD/MM/YYYY')}</span>
        {onSelect && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={() => onSelect(task)}
          >
            <Edit3 className="h-4 w-4" />
            <span className="sr-only">Editar tarefa</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({ sections, onSelect, onStatusDrop }) => {
  const { categoryGroups, lawsuits, contacts } = useApp();
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const taskCategoryMap = useMemo(() => {
    const group = categoryGroups.find(categoryGroup => categoryGroup.id === 'tasks');
    const map = new Map<string, CategoryItem>();
    if (group) {
      group.items.forEach(item => {
        map.set(item.id, item);
      });
    }
    return map;
  }, [categoryGroups]);
  const lawsuitMap = useMemo(() => {
    const map = new Map<number, { internalNumber: string }>();
    lawsuits.forEach(lawsuit => {
      map.set(lawsuit.id, { internalNumber: lawsuit.internalNumber });
    });
    return map;
  }, [lawsuits]);
  const contactMap = useMemo(() => {
    const map = new Map<number, { name: string }>();
    contacts.forEach(contact => {
      map.set(contact.id, { name: contact.name });
    });
    return map;
  }, [contacts]);

  const handleDragStart = useCallback((taskId: number) => {
    setDraggedTaskId(taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
  }, []);

  return (
    <div className="grid gap-5 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
      {sections.map(section => (
        <div
          key={section.key}
          className={cn(
            'flex min-h-[260px] flex-col rounded-3xl border border-border/50 bg-white/80 p-4 shadow-sm transition dark:border-dark-border/50 dark:bg-dark-card/60',
            draggedTaskId ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.12)]' : ''
          )}
          onDragOver={event => {
            if (draggedTaskId) {
              event.preventDefault();
            }
          }}
          onDrop={event => {
            event.preventDefault();
            if (draggedTaskId) {
              onStatusDrop?.(draggedTaskId, section.key);
              setDraggedTaskId(null);
            }
          }}
        >
          <header className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                {section.title}
              </span>
              <span className="text-[11px] text-muted-foreground/80">{section.subtitle}</span>
            </div>
            <span
              className={cn('rounded-full px-3 py-1 text-xs font-semibold', section.counterClass)}
            >
              {section.tasks.length}
            </span>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {section.tasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/60 bg-white/70 px-3 py-4 text-xs text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
                Nada por aqui. {section.key === 'completed' ? 'Sem tarefas concluídas hoje.' : 'Tudo em dia!'}
              </p>
            ) : (
              section.tasks.map(task => (
                <TaskBoardCard
                  key={task.id}
                  task={task}
                  onSelect={onSelect}
                  categoryMap={taskCategoryMap}
                  lawsuitMap={lawsuitMap}
                  contactMap={contactMap}
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
