import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LayoutGrid, LayoutList, Plus } from 'lucide-react';
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

  const noTasks = sections.every(section => section.tasks.length === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Organize prioridades e alterne entre visão em lista ou quadro.
          </p>
        </div>
        <Button
          size="lg"
          className="shadow-[0_18px_35px_-24px_rgba(79,70,229,0.45)]"
          onClick={openTaskModal}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova tarefa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Minha lista de tarefas</CardTitle>
              <CardDescription>Filtre por período e escolha como deseja visualizar.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="inline-flex rounded-full border border-border/60 bg-white/70 p-1 text-muted-foreground dark:border-dark-border/60 dark:bg-dark-background/60">
                <Button
                  variant={activeTab === 'today' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('today')}
                >
                  Hoje
                </Button>
                <Button
                  variant={activeTab === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('week')}
                >
                  Semana
                </Button>
                <Button
                  variant={activeTab === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('all')}
                >
                  Todas
                </Button>
              </div>
              <div className="inline-flex rounded-full border border-border/60 bg-white/70 p-1 text-muted-foreground dark:border-dark-border/60 dark:bg-dark-background/60">
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {view === 'list' ? (
            <TaskListView sections={sections} onSelect={openForEdit} />
          ) : (
            <TaskBoardView sections={sections} onSelect={openForEdit} />
          )}
          {noTasks && (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nenhuma tarefa para esta combinação de filtros.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
