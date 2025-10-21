import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { TaskStatus } from '../types/types';
import { useTaskModal } from '../hooks/useTaskModal';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { TaskBoardView, TaskListView, buildTaskSections } from '../components/tasks/TaskViews';

dayjs.extend(isBetween);

const Tasks: React.FC = () => {
  const { tasks, users } = useApp();
  const { open: openTaskModal, openForEdit } = useTaskModal();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
  const [view, setView] = useState<'list' | 'board'>('list');

  const currentUserId = users[0]?.id;
  const myTasks = useMemo(
    () => (currentUserId ? tasks.filter(task => task.responsibleId === currentUserId) : tasks),
    [tasks, currentUserId]
  );

  const today = dayjs().startOf('day');

  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return myTasks.filter(task => {
          const due = dayjs(task.dueDate);
          const deadline = dayjs(task.deadline);
          const isOverdue = task.status !== TaskStatus.Concluida && deadline.isBefore(today, 'day');
          const isDueToday = due.isSame(today, 'day');
          const completedToday = task.status === TaskStatus.Concluida && due.isSame(today, 'day');
          return isOverdue || isDueToday || completedToday;
        });
      case 'week': {
        const windowStart = today.startOf('week');
        const windowEnd = today.endOf('week');
        return myTasks.filter(task => {
          const due = dayjs(task.dueDate);
          const inWindow = due.isBetween(windowStart, windowEnd, 'day', '[]');
          const isOverdue = task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(today, 'day');
          return inWindow || isOverdue;
        });
      }
      case 'all':
      default:
        return myTasks;
    }
  }, [myTasks, activeTab, today]);

  const sections = useMemo(
    () => buildTaskSections(filteredTasks, { today }),
    [filteredTasks, today]
  );

  const metrics = useMemo(() => {
    const dueToday = myTasks.filter(task => dayjs(task.dueDate).isSame(today, 'day')).length;
    const overdue = myTasks.filter(
      task => task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(today, 'day')
    ).length;
    const completedLastWeek = myTasks.filter(task => {
      if (task.status !== TaskStatus.Concluida) return false;
      const due = dayjs(task.dueDate);
      const start = today.subtract(6, 'day');
      return due.isBetween(start, today, 'day', '[]');
    }).length;

    return {
      dueToday,
      overdue,
      completedLastWeek,
    };
  }, [myTasks, today]);

  const noTasks = sections.every(section => section.tasks.length === 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F4F7FF] via-[#E9F2FF] to-white px-6 py-7 text-slate-800 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.4)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.4]">
          <div className="absolute -left-28 top-6 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-indigo-200/70 blur-3xl" />
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-600 shadow-sm dark:border-white/40 dark:bg-white/10 dark:text-white/80">
              <Sparkles className="h-4 w-4 text-sky-500 dark:text-white" />
              Minhas tarefas
            </span>
            <div className="space-y-3">
              <h1 className="text-[26px] font-semibold leading-tight text-slate-900 lg:text-[32px] dark:text-white">
                Domine seu fluxo com uma experiência premium.
              </h1>
              <p className="max-w-2xl text-[13px] text-slate-500 lg:text-sm dark:text-white/75">
                Combine filtros inteligentes, escolha a visualização ideal e mantenha prazos críticos sob controle em um ambiente elegante e responsivo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button className="rounded-md bg-sky-500 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(56,189,248,0.5)] transition hover:bg-sky-600" onClick={openTaskModal}>
                <Plus className="mr-2 h-4 w-4" />
                Nova tarefa
              </Button>
              <Button
                variant="ghost"
                className="rounded-md border border-slate-200 bg-white/80 px-5 text-sm font-semibold text-slate-600 shadow-inner transition hover:border-sky-300 hover:text-sky-600 dark:border-white/30 dark:bg-white/10 dark:text-white"
                onClick={() => setActiveTab('week')}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Resumo semanal
              </Button>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-700 shadow-[0_20px_56px_-40px_rgba(15,23,42,0.32)] backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
            <div className="rounded-lg border border-slate-200 bg-white/90 px-4 py-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.28)] dark:border-white/25 dark:bg-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-white/65">Hoje</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{today.format('DD MMMM')}</p>
              <p className="text-xs text-slate-500 dark:text-white/75">
                {metrics.dueToday === 0
                  ? 'Sem entregas para hoje — aproveite para antecipar próximos passos.'
                  : `${metrics.dueToday} tarefa(s) com prazo hoje. Faça acontecer!`}
              </p>
            </div>
            <div className="grid gap-3 text-xs text-slate-600 dark:text-white">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.26)] dark:border-white/25 dark:bg-white/10">
                <span className="inline-flex items-center gap-2 font-semibold text-amber-500 dark:text-amber-100">
                  <AlertTriangle className="h-4 w-4" />
                  Atrasadas
                </span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{metrics.overdue}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.26)] dark:border-white/25 dark:bg-white/10">
                <span className="inline-flex items-center gap-2 font-semibold text-emerald-500 dark:text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Concluídas (7 dias)
                </span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">
                  {metrics.completedLastWeek}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <Card className="w-full border border-slate-200 bg-white shadow-[0_18px_48px_-38px_rgba(15,23,42,0.3)] dark:border-dark-border/60 dark:bg-dark-card/80">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base text-slate-900 dark:text-dark-foreground">Minha lista de tarefas</CardTitle>
              <CardDescription className="text-[12px]">
                Filtre por período e escolha como deseja visualizar.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 text-slate-500 shadow-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                <Button
                  variant={activeTab === 'today' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-3 text-xs"
                  onClick={() => setActiveTab('today')}
                >
                  Hoje
                </Button>
                <Button
                  variant={activeTab === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-3 text-xs"
                  onClick={() => setActiveTab('week')}
                >
                  Semana
                </Button>
                <Button
                  variant={activeTab === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-3 text-xs"
                  onClick={() => setActiveTab('all')}
                >
                  Todas
                </Button>
              </div>
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 text-slate-500 shadow-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                <Button
                  size="sm"
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  className="flex items-center gap-1 px-3 text-xs"
                  onClick={() => setView('list')}
                >
                  <LayoutList className="h-4 w-4" />
                  Lista
                </Button>
                <Button
                  size="sm"
                  variant={view === 'board' ? 'secondary' : 'ghost'}
                  className="flex items-center gap-1 px-3 text-xs"
                  onClick={() => setView('board')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Quadro
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {view === 'list' ? (
            <TaskListView sections={sections} onSelect={openForEdit} />
          ) : (
            <TaskBoardView sections={sections} onSelect={openForEdit} />
          )}
          {noTasks && (
            <p className="px-4 py-10 text-center text-xs text-slate-500 dark:text-dark-muted">
              Nenhuma tarefa para esta combinação de filtros.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);
};

export default Tasks;
