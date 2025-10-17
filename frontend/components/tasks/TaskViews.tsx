import React from 'react';
import dayjs from 'dayjs';
import { Task, TaskStatus } from '../../types/types';
import { cn } from '../../lib/utils';
import { CalendarDays, Clock3 } from 'lucide-react';

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
  onSelect: (task: Task) => void;
}

const TaskListRow: React.FC<{ task: Task; onSelect: (task: Task) => void }> = ({
  task,
  onSelect,
}) => {
  const isOverdue =
    task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(dayjs(), 'day');

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className="flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:hover:bg-dark-border/30"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
          {task.title}
        </span>
        <span className="text-xs text-muted-foreground">
          Prazo: {task.deadline ? dayjs(task.deadline).format('DD/MM/YYYY') : '—'} · Previsto:{' '}
          {dayjs(task.dueDate).format('DD/MM/YYYY')}
        </span>
      </div>
      <span
        className={cn(
          'rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
          task.status === TaskStatus.Concluida
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200'
            : isOverdue
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200'
        )}
      >
        {task.status}
      </span>
    </button>
  );
};

export const TaskListView: React.FC<TaskListViewProps> = ({ sections, onSelect }) => {
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
          <header className="flex items-center justify-between border-b border-border/60 px-4 py-3 dark:border-dark-border/50">
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
              <TaskListRow key={task.id} task={task} onSelect={onSelect} />
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
}

const TaskBoardCard: React.FC<{ task: Task; onSelect: (task: Task) => void }> = ({
  task,
  onSelect,
}) => {
  const isOverdue =
    task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(dayjs(), 'day');
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className="flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-white px-4 pb-4 text-left shadow-[0_14px_24px_-22px_rgba(15,23,42,0.38)] transition hover:-translate-y-[2px] hover:border-primary/50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/70"
    >
      <span className="text-sm font-semibold text-foreground dark:text-dark-foreground">
        {task.title}
      </span>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-muted-foreground/80" />
        <span>Prevista: {dayjs(task.dueDate).format('DD/MM/YYYY')}</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium',
            task.status === TaskStatus.Concluida
              ? 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
              : isOverdue
              ? 'bg-rose-100/60 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200'
              : 'bg-slate-100/60 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200'
          )}
        >
          {task.status}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-4 w-4 text-muted-foreground/70" />
          {task.deadline ? dayjs(task.deadline).format('DD/MM/YYYY') : '—'}
        </div>
      </div>
    </button>
  );
};

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({ sections, onSelect }) => (
  <div className="grid gap-5 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
    {sections.map(section => (
      <div
        key={section.key}
        className="flex min-h-[260px] flex-col rounded-3xl border border-border/50 bg-white/80 p-4 shadow-sm dark:border-dark-border/50 dark:bg-dark-card/60"
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
              <TaskBoardCard key={task.id} task={task} onSelect={onSelect} />
            ))
          )}
        </div>
      </div>
    ))}
  </div>
);
