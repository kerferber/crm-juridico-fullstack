import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { useTaskModal } from '../../hooks/useTaskModal';
import { cn } from '../../lib/utils';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutList,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import { TaskBoardView, TaskListView, buildTaskSections, TaskSection } from '../tasks/TaskViews';

const TaskWorkspace: React.FC = () => {
  const { tasks } = useApp();
  const { user: authUser, loading: authLoading } = useAuth();
  const { open: openTaskModal, openForEdit } = useTaskModal();
  const [view, setView] = useState<'list' | 'board'>('list');

  const currentUserId = authUser?.id;
  const myTasks = useMemo(() => {
    if (authLoading) {
      return [];
    }
    if (!currentUserId) {
      return tasks;
    }
    return tasks.filter(task => task.responsibleId === currentUserId);
  }, [tasks, currentUserId, authLoading]);

  const today = dayjs().startOf('day');

  const { sections, metrics } = useMemo(() => {
    const groupedSections = buildTaskSections(myTasks, { today });

    const sectionMap = Object.fromEntries(
      groupedSections.map(section => [section.key, section] as const)
    ) as Record<TaskSection['key'], TaskSection>;

    const overdueCount = sectionMap.overdue?.tasks.length ?? 0;
    const todayCount = sectionMap.today?.tasks.length ?? 0;
    const upcomingCount = sectionMap.upcoming?.tasks.length ?? 0;
    const completedTodayCount = sectionMap.completed?.tasks.length ?? 0;

    const metrics = [
      {
        label: 'Atrasadas',
        value: overdueCount,
        icon: AlertTriangle,
        iconClass: 'text-rose-500',
        valueClass: 'text-rose-600 dark:text-rose-200',
      },
      {
        label: 'Para hoje',
        value: todayCount,
        icon: CalendarDays,
        iconClass: 'text-amber-500',
        valueClass: 'text-amber-500 dark:text-amber-200',
      },
      {
        label: 'Próximos dias',
        value: upcomingCount,
        icon: Clock3,
        iconClass: 'text-sky-500',
        valueClass: 'text-sky-600 dark:text-sky-200',
      },
      {
        label: 'Concluídas hoje',
        value: completedTodayCount,
        icon: CheckCircle2,
        iconClass: 'text-emerald-500',
        valueClass: 'text-emerald-600 dark:text-emerald-200',
      },
    ];

    return { sections: groupedSections, metrics };
  }, [myTasks, today]);

  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-[0_18px_48px_-40px_rgba(15,23,42,0.32)] dark:border-dark-border/60 dark:bg-dark-card/80">
      <CardHeader className="space-y-4 border-b border-slate-200 pb-5 dark:border-dark-border/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-dark-foreground">
              Painel de Tarefas
            </CardTitle>
            <p className="text-xs text-slate-500">
              Tenha visibilidade imediata das entregas críticas do time.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 text-slate-500 shadow-sm dark:border-dark-border/60 dark:bg-dark-background/70">
              <Button
                size="sm"
                variant={view === 'list' ? 'secondary' : 'ghost'}
                className={cn(
                  'flex items-center gap-1 px-3 text-xs',
                  view === 'list'
                    ? 'bg-white text-slate-700 shadow-sm dark:text-dark-foreground'
                    : 'text-slate-500 hover:text-sky-600'
                )}
                onClick={() => setView('list')}
              >
                <LayoutList className="h-4 w-4" />
                Lista
              </Button>
              <Button
                size="sm"
                variant={view === 'board' ? 'secondary' : 'ghost'}
                className={cn(
                  'flex items-center gap-1 px-3 text-xs',
                  view === 'board'
                    ? 'bg-white text-slate-700 shadow-sm dark:text-dark-foreground'
                    : 'text-slate-500 hover:text-sky-600'
                )}
                onClick={() => setView('board')}
              >
                <LayoutGrid className="h-4 w-4" />
                Quadro
              </Button>
            </div>
            <Button
              size="sm"
              className="rounded-md bg-sky-500 px-4 text-xs font-semibold text-white shadow-[0_18px_40px_-28px_rgba(56,189,248,0.55)] hover:bg-sky-600"
              onClick={openTaskModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-dark-border/50 dark:bg-dark-card/70"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <metric.icon className={cn('h-4 w-4', metric.iconClass)} />
                <span>{metric.label}</span>
              </div>
              <span className={cn('text-sm font-semibold', metric.valueClass)}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {view === 'list' ? (
          <TaskListView sections={sections} onSelect={openForEdit} />
        ) : (
          <TaskBoardView sections={sections} onSelect={openForEdit} />
        )}
        {view === 'list' && sections.every(section => section.tasks.length === 0) && (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhuma tarefa por aqui — aproveite para planejar o próximo passo!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskWorkspace;
