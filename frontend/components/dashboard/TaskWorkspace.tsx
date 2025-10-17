import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
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
  const { tasks, users } = useApp();
  const { open: openTaskModal, openForEdit } = useTaskModal();
  const [view, setView] = useState<'list' | 'board'>('list');

  const currentUserId = users[0]?.id;
  const myTasks = useMemo(
    () => (currentUserId ? tasks.filter(task => task.responsibleId === currentUserId) : tasks),
    [tasks, currentUserId]
  );

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
    <Card className="border-border/60 shadow-[0_18px_45px_-28px_rgba(79,70,229,0.35)] dark:border-dark-border/60">
      <CardHeader className="space-y-4 border-b border-border/40 pb-6 dark:border-dark-border/40">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground dark:text-dark-foreground">
              Painel de Tarefas
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tenha visibilidade imediata das entregas críticas do time.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="inline-flex rounded-full border border-border/60 bg-white/80 p-1 text-muted-foreground shadow-sm dark:border-dark-border/60 dark:bg-dark-background/70">
              <Button
                size="sm"
                variant={view === 'list' ? 'secondary' : 'ghost'}
                className="flex items-center gap-1 px-3"
                onClick={() => setView('list')}
              >
                <LayoutList className="h-4 w-4" />
                Lista
              </Button>
              <Button
                size="sm"
                variant={view === 'board' ? 'secondary' : 'ghost'}
                className="flex items-center gap-1 px-3"
                onClick={() => setView('board')}
              >
                <LayoutGrid className="h-4 w-4" />
                Quadro
              </Button>
            </div>
            <Button
              size="sm"
              className="shadow-[0_18px_35px_-24px_rgba(79,70,229,0.45)]"
              onClick={openTaskModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-2xl border border-border/40 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-dark-border/40 dark:bg-dark-card/60"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <metric.icon className={cn('h-4 w-4', metric.iconClass)} />
                <span>{metric.label}</span>
              </div>
              <span className={cn('text-base font-semibold', metric.valueClass)}>
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
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhuma tarefa por aqui — aproveite para planejar o próximo passo!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskWorkspace;
