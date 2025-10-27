import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  SlidersHorizontal,
  BookmarkPlus,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { TaskStatus } from '../types/types';
import { useTaskModal } from '../hooks/useTaskModal';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { TaskBoardView, TaskListView, buildTaskSections, TaskSectionKey } from '../components/tasks/TaskViews';
import { cn } from '../lib/utils';

dayjs.extend(isBetween);

const TASK_VIEWS_STORAGE_KEY = 'workflow-studio:task-views:v1';

type SavedTaskView = {
  id: string;
  name: string;
  payload: {
    scope: 'mine' | 'team';
    tab: 'today' | 'week' | 'all';
    text: string;
    responsible: string;
    status: TaskStatus | 'all';
    lawsuit: string;
    client: string;
  };
};

const loadSavedTaskViews = (): SavedTaskView[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = window.localStorage.getItem(TASK_VIEWS_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as SavedTaskView[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const Tasks: React.FC = () => {
  const { tasks, users, contacts, lawsuits } = useApp();
  const { user: authUser, loading: authLoading } = useAuth();
  const { open: openTaskModal, openForEdit } = useTaskModal();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [taskScope, setTaskScope] = useState<'mine' | 'team'>('mine');
  const [textFilter, setTextFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [lawsuitFilter, setLawsuitFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [savedViews, setSavedViews] = useState<SavedTaskView[]>(() => loadSavedTaskViews());
  const [selectedViewId, setSelectedViewId] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TASK_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

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
  const scopedTasks = useMemo(
    () => (taskScope === 'mine' ? myTasks : tasks),
    [taskScope, myTasks, tasks]
  );
  const lawsuitAreaMap = useMemo(() => {
    const map = new Map<number, string>();
    lawsuits.forEach(lawsuit => {
      map.set(lawsuit.id, lawsuit.area ?? 'Sem área');
    });
    return map;
  }, [lawsuits]);

  const filteredByControls = useMemo(() => {
    const search = textFilter.trim().toLowerCase();
    return scopedTasks.filter(task => {
      if (search) {
        const fields = [task.title, task.notes]
          .filter((value): value is string => Boolean(value))
          .join(' ')
          .toLowerCase();
        if (!fields.includes(search)) {
          return false;
        }
      }

      if (responsibleFilter !== 'all') {
        const target = Number(responsibleFilter);
        if (!Number.isNaN(target) && task.responsibleId !== target) {
          return false;
        }
      }

      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      if (lawsuitFilter === 'none') {
        if (task.lawsuitId) return false;
      } else if (lawsuitFilter !== 'all') {
        const target = Number(lawsuitFilter);
        if (!Number.isNaN(target) && task.lawsuitId !== target) {
          return false;
        }
      }

      if (clientFilter === 'none') {
        if (task.clientId) return false;
      } else if (clientFilter !== 'all') {
        const target = Number(clientFilter);
        if (!Number.isNaN(target) && task.clientId !== target) {
          return false;
        }
      }

      return true;
    });
  }, [
    scopedTasks,
    textFilter,
    responsibleFilter,
    statusFilter,
    lawsuitFilter,
    clientFilter,
  ]);

  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return filteredByControls.filter(task => {
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
        return filteredByControls.filter(task => {
          const due = dayjs(task.dueDate);
          const inWindow = due.isBetween(windowStart, windowEnd, 'day', '[]');
          const isOverdue =
            task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(today, 'day');
          return inWindow || isOverdue;
        });
      }
      case 'all':
      default:
        return filteredByControls;
    }
  }, [filteredByControls, activeTab, today]);

  const sections = useMemo(
    () => buildTaskSections(filteredTasks, { today }),
    [filteredTasks, today]
  );

  const metrics = useMemo(() => {
    const dueToday = scopedTasks.filter(task => dayjs(task.dueDate).isSame(today, 'day')).length;
    const overdue = scopedTasks.filter(
      task => task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(today, 'day')
    ).length;
    const completedLastWeek = scopedTasks.filter(task => {
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
  }, [scopedTasks, today]);

  const upcomingSevenDays = useMemo(() => {
    const windowEnd = today.add(7, 'day').endOf('day');
    return scopedTasks.filter(task => {
      if (task.status === TaskStatus.Concluida) return false;
      const due = dayjs(task.dueDate);
      return due.isAfter(today, 'day') && due.isSameOrBefore(windowEnd, 'day');
    }).length;
  }, [scopedTasks, today]);
  const heroMetrics = [
    {
      label: 'Prazo hoje',
      value: metrics.dueToday,
      description: metrics.dueToday === 0 ? 'Nenhum prazo para hoje' : 'Com entrega prevista para hoje',
      action: () => setActiveTab('today'),
    },
    {
      label: 'Atrasadas',
      value: metrics.overdue,
      description: metrics.overdue === 0 ? 'Tudo em dia' : 'Precisa de replanejamento urgente',
      action: () => setActiveTab('all'),
    },
    {
      label: 'Próximos 7 dias',
      value: upcomingSevenDays,
      description: upcomingSevenDays === 0 ? 'Sem entregas na próxima semana' : 'Antecipe o que vem por aí',
      action: () => setActiveTab('week'),
    },
  ];

  const tasksWithoutResponsible = useMemo(
    () => scopedTasks.filter(task => !task.responsibleId).length,
    [scopedTasks]
  );
  const tasksLinkedToProcess = useMemo(
    () => scopedTasks.filter(task => Boolean(task.lawsuitId)).length,
    [scopedTasks]
  );
  const tasksLinkedToClients = useMemo(
    () => scopedTasks.filter(task => Boolean(task.clientId)).length,
    [scopedTasks]
  );
  const slaByArea = useMemo(() => {
    const aggregates = new Map<string, { total: number; count: number }>();
    scopedTasks.forEach(task => {
      if (task.status === TaskStatus.Concluida) return;
      if (!task.deadline || !task.lawsuitId) return;
      const area = lawsuitAreaMap.get(task.lawsuitId) ?? 'Sem área';
      const remainingDays = dayjs(task.deadline).diff(today, 'day');
      const current = aggregates.get(area) ?? { total: 0, count: 0 };
      aggregates.set(area, { total: current.total + remainingDays, count: current.count + 1 });
    });
    return Array.from(aggregates.entries())
      .map(([area, data]) => ({
        area,
        avgDays: Math.round(data.total / data.count),
      }))
      .sort((a, b) => a.avgDays - b.avgDays)
      .slice(0, 3);
  }, [scopedTasks, lawsuitAreaMap, today]);

  const statusOptions = useMemo(() => Object.values(TaskStatus), []);

  const handleClearFilters = useCallback(() => {
    setTextFilter('');
    setResponsibleFilter('all');
    setStatusFilter('all');
    setLawsuitFilter('all');
    setClientFilter('all');
    setSelectedViewId('');
  }, []);

  const handleSaveCurrentView = useCallback(() => {
    const name = window.prompt('Nome da visão salva');
    if (!name) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const preset: SavedTaskView = {
      id: `${Date.now()}`,
      name: trimmed,
      payload: {
        scope: taskScope,
        tab: activeTab,
        text: textFilter,
        responsible: responsibleFilter,
        status: statusFilter,
        lawsuit: lawsuitFilter,
        client: clientFilter,
      },
    };
    setSavedViews(prev => [...prev, preset]);
    setSelectedViewId(preset.id);
  }, [
    taskScope,
    activeTab,
    textFilter,
    responsibleFilter,
    statusFilter,
    lawsuitFilter,
    clientFilter,
  ]);

  const handleApplySavedView = useCallback(
    (viewId: string) => {
      setSelectedViewId(viewId);
      const preset = savedViews.find(view => view.id === viewId);
      if (!preset) return;
      setTaskScope(preset.payload.scope);
      setActiveTab(preset.payload.tab);
      setTextFilter(preset.payload.text);
      setResponsibleFilter(preset.payload.responsible);
      setStatusFilter(preset.payload.status);
      setLawsuitFilter(preset.payload.lawsuit);
      setClientFilter(preset.payload.client);
    },
    [savedViews]
  );

  const handleBoardDrop = useCallback((taskId: number, targetSection: TaskSectionKey) => {
    console.info('Arraste em preparação', { taskId, targetSection });
  }, []);

  const noTasks = sections.every(section => section.tasks.length === 0);

  return (
    <div className="space-y-6">
      <section className="premium-hero workflow-hero workflow-hero--tasks">
        <div className="premium-hero__overlay" />
        <div className="premium-hero__content">
          <div className="premium-hero__main">
            <span className="premium-badge">Execução diária</span>
            <h1 className="premium-hero__title">Priorize o que move os processos hoje.</h1>
            <p className="premium-hero__subtitle">
              Combine filtros, salve visões e acompanhe métricas essenciais da equipe.
            </p>
            <div className="hero-actions hero-actions--compact">
              <Button className="hero-actions__primary gap-2 rounded-full" onClick={openTaskModal}>
                <Plus className="h-4 w-4" />
                Nova tarefa
              </Button>
              <Button
                variant="ghost"
                className="hero-actions__secondary gap-2 rounded-full"
                onClick={() => setActiveTab('week')}
              >
                <CalendarDays className="h-4 w-4" />
                Semana atual
              </Button>
              <div className="hero-actions__tools crm-premium__tools">
                <span>{scopedTasks.length} tarefas</span>
                <span className="crm-premium__dot" />
                <span>{tasksWithoutResponsible} sem dono</span>
              </div>
            </div>
            <div className="premium-metrics">
              {heroMetrics.map(metric => (
                <button
                  key={metric.label}
                  type="button"
                  className="premium-metric-card text-left"
                  onClick={metric.action}
                >
                  <p className="premium-metric-card__label">{metric.label}</p>
                  <p className="premium-metric-card__value">{metric.value}</p>
                  <p className="premium-metric-card__description">{metric.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="premium-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Sem responsável
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground">
            {tasksWithoutResponsible}
          </p>
          <p className="text-xs text-muted-foreground">
            {tasksWithoutResponsible === 0
              ? 'Todas as tarefas possuem dono.'
              : 'Defina responsáveis para destravar tarefas críticas.'}
          </p>
        </div>
        <div className="premium-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Produção concluída (7 dias)
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground">
            {metrics.completedLastWeek}
          </p>
          <p className="text-xs text-muted-foreground">Entregas finalizadas na última semana.</p>
        </div>
        <div className="premium-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Contexto
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tasksLinkedToProcess} vinculadas a processos · {tasksLinkedToClients} a clientes
          </p>
          <p className="text-xs text-muted-foreground">
            Use esta informação para priorizar follow-ups críticos.
          </p>
        </div>
        <div className="premium-panel md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            SLA por área
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground dark:text-dark-foreground">
            {slaByArea.length === 0 && <li className="text-xs text-muted-foreground">Sem dados suficientes.</li>}
            {slaByArea.map(item => (
              <li key={item.area} className="flex items-center justify-between text-xs">
                <span>{item.area}</span>
                <span className="font-semibold">{item.avgDays}d</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Média de dias restantes para as áreas com maior volume.
          </p>
        </div>
      </div>

      <section className="premium-panel space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros avançados
          </span>
          <div className="inline-flex rounded-full border border-border/60 bg-white p-1 text-xs font-semibold dark:border-dark-border/60 dark:bg-dark-card/60">
            <Button
              size="sm"
              variant={taskScope === 'mine' ? 'secondary' : 'ghost'}
              className="rounded-full px-3"
              onClick={() => setTaskScope('mine')}
            >
              Minhas
            </Button>
            <Button
              size="sm"
              variant={taskScope === 'team' ? 'secondary' : 'ghost'}
              className="rounded-full px-3"
              onClick={() => setTaskScope('team')}
            >
              Equipe
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedViewId}
              onChange={event => handleApplySavedView(event.target.value)}
              className="h-9 rounded-full border border-border/60 bg-white px-3 text-xs font-semibold text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
            >
              <option value="">Visões salvas</option>
              {savedViews.map(view => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="gap-1 rounded-full text-xs" onClick={handleSaveCurrentView}>
              <BookmarkPlus className="h-3.5 w-3.5" />
              Salvar visão
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs text-muted-foreground shadow-inner dark:border-dark-border/60 dark:bg-dark-card/70">
            <Search className="h-3.5 w-3.5" />
            <input
              value={textFilter}
              onChange={event => setTextFilter(event.target.value)}
              placeholder="Buscar por título, anotação ou palavra-chave"
              className="w-full border-none bg-transparent text-sm text-foreground focus:outline-none dark:text-dark-foreground"
            />
          </label>
          <select
            value={responsibleFilter}
            onChange={event => setResponsibleFilter(event.target.value)}
            className="h-11 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
          >
            <option value="all">Todos os responsáveis</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as TaskStatus | 'all')}
            className="h-11 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
          >
            <option value="all">Todos os status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={lawsuitFilter}
            onChange={event => setLawsuitFilter(event.target.value)}
            className="h-11 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
          >
            <option value="all">Todos os processos</option>
            <option value="none">Sem processo vinculado</option>
            {lawsuits.map(lawsuit => (
              <option key={lawsuit.id} value={lawsuit.id}>
                {lawsuit.internalNumber}
              </option>
            ))}
          </select>
          <select
            value={clientFilter}
            onChange={event => setClientFilter(event.target.value)}
            className="h-11 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
          >
            <option value="all">Todos os clientes</option>
            <option value="none">Sem cliente vinculado</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <Card className="premium-shell bg-white dark:bg-dark-card/80">
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
            <TaskBoardView
              sections={sections}
              onSelect={openForEdit}
              onStatusDrop={handleBoardDrop}
            />
          )}
          {noTasks && (
            <p className="px-4 py-10 text-center text-xs text-slate-500 dark:text-dark-muted">
              Nenhuma tarefa para esta combinação de filtros.
            </p>
          )}
          {view === 'board' && (
            <p className="px-4 pb-4 text-[11px] text-muted-foreground">
              Arraste e solte para mapear futuras mudanças de status. Em breve, essa ação atualizará os dados automaticamente.
            </p>
          )}
        </CardContent>
      </Card>
  </div>
);
};

export default Tasks;
