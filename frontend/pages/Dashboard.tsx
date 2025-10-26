import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  Gavel,
  Scale,
  ScrollText,
  Landmark,
  Briefcase,
  LayoutDashboard,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Task, TaskStatus } from '../types/types';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { AlertBell } from '../components/dashboard/AlertBell';
import { DashboardDonut } from '../components/dashboard/DashboardDonut';
import { DashboardBar } from '../components/dashboard/DashboardBar';
import { DashboardArea } from '../components/dashboard/DashboardArea';
import { ThemeToggle } from '../components/global/ThemeToggle';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

const WIDGET_ORDER_STORAGE = 'dashboard-widget-order-v2';
const HIDDEN_WIDGETS_STORAGE = 'dashboard-hidden-widgets-v2';
const DEFAULT_WIDGETS = ['distribution', 'activity', 'process'] as const;

const tonePalette = {
  overdue: {
    border: '#DC2626',
    text: '#B91C1C',
    bg: 'rgba(220,38,38,0.12)',
    glow: 'rgba(220,38,38,0.18)',
    iconBg: 'linear-gradient(135deg, #F87171, #EF4444)',
    iconColor: '#fff',
  },
  today: {
    border: '#F97316',
    text: '#C2410C',
    bg: 'rgba(249,115,22,0.12)',
    glow: 'rgba(249,115,22,0.18)',
    iconBg: 'linear-gradient(135deg, #FDBA74, #F97316)',
    iconColor: '#fff',
  },
  upcoming: {
    border: '#16A34A',
    text: '#166534',
    bg: 'rgba(22,163,74,0.12)',
    glow: 'rgba(22,163,74,0.18)',
    iconBg: 'linear-gradient(135deg, #6EE7B7, #16A34A)',
    iconColor: '#0B4F3A',
  },
};

type WidgetId = typeof DEFAULT_WIDGETS[number];

const readLocalArray = (key: string, fallback: string[]): string[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed as string[];
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

const SummaryCard: React.FC<{
  title: string;
  value: number;
  variation: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'overdue' | 'today' | 'upcoming';
  onClick: () => void;
}> = ({ title, value, variation, icon: Icon, tone, onClick }) => {
  const palette = tonePalette[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="summary-card group flex flex-col gap-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
    >
      <span className="summary-card__halo" style={{ background: palette.glow }} />
      <div className="flex items-center justify-between">
        <span
          className="summary-card__badge"
          style={{ backgroundColor: palette.bg, color: palette.text }}
        >
          {title}
        </span>
        <div
          className="summary-card__icon"
          style={{ background: palette.iconBg, color: palette.iconColor }}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <AnimatedNumber
        value={value}
        className="text-4xl font-semibold leading-none text-[var(--text-primary)] md:text-5xl"
      />
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span className="font-semibold" style={{ color: palette.text }}>
          {variation}
        </span>
        <span className="summary-card__cta">
          Priorizar →
        </span>
      </div>
    </button>
  );
};

const heroMetricPalette = {
  critical: tonePalette.overdue,
  warning: tonePalette.today,
  positive: tonePalette.upcoming,
};

const HeroMetric: React.FC<{
  label: string;
  value: string;
  helper: string;
  tone: keyof typeof heroMetricPalette;
  onClick?: () => void;
}> = ({ label, value, helper, tone, onClick }) => {
  const palette = heroMetricPalette[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'metric-chip',
        !onClick && 'cursor-default opacity-95'
      )}
      style={{
        borderColor: palette.border,
        backgroundColor: palette.bg,
        boxShadow: `0 12px 30px -20px ${palette.glow}`,
      }}
    >
      <span className="metric-chip__label">{label}</span>
      <span className="metric-chip__value">{value}</span>
      <span className="metric-chip__helper">{helper}</span>
    </button>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
}> = ({ title, description, icon: Icon, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn('quick-action-card text-left', className)}
  >
    <div className="quick-action-card__icon">
      <Icon className="h-5 w-5" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-xs text-[var(--text-secondary)]">{description}</p>
    </div>
    <span className="quick-action-card__cta">Abrir módulo</span>
  </button>
);

const WidgetWrapper: React.FC<{
  id: WidgetId;
  title: string;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, id: WidgetId) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, targetId: WidgetId) => void;
  onDragEnd: () => void;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  onAction: (widgetId: WidgetId, action: 'remove' | 'pin' | 'configure') => void;
  dragging: string | null;
  children: React.ReactNode;
}> = ({
  id,
  title,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  menuOpen,
  setMenuOpen,
  onAction,
  dragging,
  children,
}) => {
  const isDragging = dragging === id;
  return (
    <div
      className="col-span-12 md:col-span-6 xl:col-span-4"
      draggable
      onDragStart={event => onDragStart(event, id)}
      onDragOver={onDragOver}
      onDrop={event => onDrop(event, id)}
      onDragEnd={onDragEnd}
      aria-label={`Widget ${title}`}
      role="group"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="relative">
        <button
          type="button"
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-black/5 text-sm text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100 hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] dark:bg-white/10"
          onClick={() => setMenuOpen(menuOpen === id ? null : id)}
          aria-label={`Opções do widget ${title}`}
        >
          ⋮
        </button>
        {menuOpen === id && (
          <div className="absolute right-4 top-14 z-20 w-40 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2 shadow-[var(--shadow-soft)]">
            <button
              type="button"
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
              onClick={() => {
                onAction(id, 'remove');
                setMenuOpen(null);
              }}
            >
              Remover
            </button>
            <button
              type="button"
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
              onClick={() => {
                onAction(id, 'pin');
                setMenuOpen(null);
              }}
            >
              Adicionar ao topo
            </button>
            <button
              type="button"
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
              onClick={() => {
                onAction(id, 'configure');
                setMenuOpen(null);
              }}
            >
              Configurar
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const WidgetModal: React.FC<{
  hidden: string[];
  setHidden: (next: string[]) => void;
  available: WidgetId[];
  onClose: () => void;
}> = ({ hidden, setHidden, available, onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="dashboard-card max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Personalizar widgets</h3>
            <p className="text-xs text-[var(--text-secondary)]">Escolha quais visão deseja exibir no painel.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {available.map(widgetId => {
            const isHidden = hidden.includes(widgetId);
            return (
              <label
                key={widgetId}
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2"
              >
                <span className="font-semibold text-[var(--text-primary)]">
                  {widgetId === 'distribution' && 'Distribuição de tarefas'}
                  {widgetId === 'activity' && 'Atividade semanal'}
                  {widgetId === 'process' && 'Status de processos'}
                </span>
                <input
                  type="checkbox"
                  checked={!isHidden}
                  onChange={() => {
                    setHidden(
                      isHidden ? hidden.filter(item => item !== widgetId) : [...hidden.filter(item => item !== widgetId),]
                    );
                    if (isHidden) {
                      setHidden(hidden.filter(item => item !== widgetId));
                    }
                  }}
                  aria-label={`Alternar widget ${widgetId}`}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { lawsuits, tasks, contacts, loading, error, users } = useApp();
  const today = dayjs().startOf('day');

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => readLocalArray(WIDGET_ORDER_STORAGE, [...DEFAULT_WIDGETS]));
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => readLocalArray(HIDDEN_WIDGETS_STORAGE, []));
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isWidgetModalOpen, setWidgetModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WIDGET_ORDER_STORAGE, JSON.stringify(widgetOrder));
    }
  }, [widgetOrder]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HIDDEN_WIDGETS_STORAGE, JSON.stringify(hiddenWidgets));
    }
  }, [hiddenWidgets]);

  const {
    summary,
    distribution,
    completionTrend,
    processStatus,
    kpiCards,
    quickLinks,
    monthlyStats,
  } = useMemo(() => {
    const buckets = {
      overdue: [] as Task[],
      today: [] as Task[],
      upcoming: [] as Task[],
      done: [] as Task[],
    };

    tasks.forEach(task => {
      const due = dayjs(task.deadline || task.dueDate);
      if (task.status === TaskStatus.Concluida) {
        buckets.done.push(task);
        return;
      }
      if (!due.isValid()) {
        buckets.upcoming.push(task);
        return;
      }
      if (due.isBefore(today, 'day')) {
        buckets.overdue.push(task);
      } else if (due.isSame(today, 'day')) {
        buckets.today.push(task);
      } else if (due.diff(today, 'day') <= 30) {
        buckets.upcoming.push(task);
      }
    });

    const summary = {
      overdue: buckets.overdue.length,
      today: buckets.today.length,
      upcoming: buckets.upcoming.length,
    };

    const distribution = [
      { name: 'Atrasadas', value: summary.overdue, color: '#DC2626' },
      { name: 'Hoje', value: summary.today, color: '#F97316' },
      { name: 'Próximos 30 dias', value: summary.upcoming, color: '#16A34A' },
      { name: 'Concluídas', value: buckets.done.length, color: '#475569' },
    ];

    const completionTrend = Array.from({ length: 7 }).map((_, index) => {
      const day = today.clone().subtract(6 - index, 'day');
      const label = day.format('DD/MM');
      const completed = tasks.filter(task =>
        task.status === TaskStatus.Concluida && dayjs(task.dueDate || task.deadline).isSame(day, 'day')
      ).length;
      return { label, value: completed };
    });

    const processStatusMap: Record<string, number> = {};
    lawsuits.forEach(lawsuit => {
      processStatusMap[lawsuit.status] = (processStatusMap[lawsuit.status] ?? 0) + 1;
    });
    const processStatus = Object.keys(processStatusMap).map(status => ({
      label: status,
      value: processStatusMap[status],
    }));

    const activeLawsuits = processStatusMap['Ativo'] ?? 0;
    const overdueTasks = summary.overdue;
    const concludedThisMonth = tasks.filter(task =>
      task.status === TaskStatus.Concluida && dayjs(task.dueDate).isSame(today, 'month')
    ).length;
    const newLeads = contacts.filter(contact => contact.status === 'Lead').length;

    const kpiCards = [
      {
        title: 'Processos ativos',
        value: activeLawsuits,
        icon: Scale,
      },
      {
        title: 'Pendências críticas',
        value: overdueTasks,
        icon: Gavel,
      },
      {
        title: 'Concluídas no mês',
        value: concludedThisMonth,
        icon: ScrollText,
      },
      {
        title: 'Novos leads',
        value: newLeads,
        icon: Landmark,
      },
    ];

    const quickLinks = [
      {
        title: 'Minhas tarefas',
        description: 'Gerencie prazos críticos, delegações e follow-ups do dia.',
        icon: CalendarDays,
        href: '/tarefas',
      },
      {
        title: 'Processos ativos',
        description: 'Acompanhe fases, responsáveis e próximos passos dos casos.',
        icon: Briefcase,
        href: '/processos',
      },
      {
        title: 'CRM – Pipeline',
        description: 'Visualize oportunidades, leads e negociações em andamento.',
        icon: LayoutDashboard,
        href: '/crm',
      },
      {
        title: 'Relatórios',
        description: 'Gere análises de performance e produtividade por período.',
        icon: BarChart3,
        href: '/gestao',
      },
    ];

    const monthlyTasks = tasks.filter(task =>
      dayjs(task.dueDate || task.deadline).isSame(today, 'month')
    );
    const monthlyCompleted = monthlyTasks.filter(task => task.status === TaskStatus.Concluida).length;
    const monthlyPending = Math.max(monthlyTasks.length - monthlyCompleted, 0);
    const percent = monthlyTasks.length > 0 ? Math.round((monthlyCompleted / monthlyTasks.length) * 100) : 0;

    return {
      summary,
      distribution,
      completionTrend,
      processStatus,
      kpiCards,
      quickLinks,
      monthlyStats: {
        total: monthlyTasks.length,
        completed: monthlyCompleted,
        pending: monthlyPending,
        percent,
      },
    };
  }, [tasks, lawsuits, contacts, today]);

  useEffect(() => {
    setWidgetOrder(prev => {
      const cleaned = prev.filter(id => DEFAULT_WIDGETS.includes(id as WidgetId));
      if (cleaned.length === 0) return [...DEFAULT_WIDGETS];
      return cleaned;
    });
  }, []);

  if (error) {
    return <div className="text-center text-sm text-red-500">{error}</div>;
  }

  const handleNavigate = (filter: 'overdue' | 'today' | 'upcoming') => {
    const params = new URLSearchParams();
    params.set('view', filter);
    navigate(`/tarefas?${params.toString()}`);
  };

  const heroTitle =
    summary.overdue > 0
      ? `Priorize ${summary.overdue} pendência${summary.overdue > 1 ? 's' : ''} críticas hoje.`
      : 'Tudo sob controle: antecipe o próximo movimento estratégico.';

  const heroSubtitle =
    summary.overdue > 0
      ? 'Direcione follow-ups e delegações para manter os prazos impecáveis.'
      : 'Use o momento para adiantar entregas e encantar clientes.';

  const heroMetrics = [
    {
      label: 'Pendências críticas',
      value: `${summary.overdue}`,
      helper: summary.overdue > 0 ? 'Clique para ver tarefas atrasadas' : 'Nenhuma pendência no momento',
      tone: 'critical' as const,
      onClick: summary.overdue > 0 ? () => handleNavigate('overdue') : undefined,
    },
    {
      label: 'Agenda de hoje',
      value: `${summary.today}`,
      helper: summary.today > 0 ? 'Entregas previstas nas próximas horas' : 'Sem entregas para hoje',
      tone: 'warning' as const,
      onClick: summary.today > 0 ? () => handleNavigate('today') : undefined,
    },
    {
      label: 'Produtividade do mês',
      value: `${monthlyStats.percent}%`,
      helper: `${monthlyStats.completed} de ${monthlyStats.total} tarefas concluídas`,
      tone: 'positive' as const,
      onClick: monthlyStats.total > 0 ? () => navigate('/gestao') : undefined,
    },
  ];

  const teamPreview = users.slice(0, 5);
  const extraMembers = Math.max(users.length - teamPreview.length, 0);
  const heroTeamBlock =
    teamPreview.length > 0 ? (
      <div className="hero-sidecard__team">
        <div className="hero-team hero-team--inline">
          <div className="avatar-stack">
            {teamPreview.map(user => (
              <div
                key={user.id}
                className="avatar-stack__item"
                style={{
                  backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
                }}
              >
                {!user.avatar && <span>{getInitials(user.name)}</span>}
              </div>
            ))}
            {extraMembers > 0 && (
              <span className="avatar-stack__more">+{extraMembers}</span>
            )}
          </div>
          <div className="hero-team__copy">
            Equipe conectada · {users.length} membro{users.length === 1 ? '' : 's'} ativos no painel.
          </div>
        </div>
      </div>
    ) : null;

  const monthlyCopy =
    monthlyStats.percent >= 75
      ? 'O time está entregando acima da meta programada.'
      : monthlyStats.percent >= 40
      ? 'Há espaço para acelerar entregas nos próximos dias.'
      : 'Organize forças para destravar as próximas demandas.';

  const activeWidgets = widgetOrder.filter(id => !hiddenWidgets.includes(id));

  const widgetContent: Record<WidgetId, React.ReactNode> = {
    distribution: (
      <DashboardDonut
        data={distribution}
        title="Distribuição de tarefas"
        description="Visão geral por status"
      />
    ),
    activity: (
      <DashboardArea
        data={completionTrend}
        title="Concluídas na última semana"
        description="Monitoramento das entregas diárias"
        accent="#2B6CB0"
      />
    ),
    process: (
      <DashboardBar
        data={processStatus.map(item => ({ label: item.label, value: item.value }))}
        title="Status de processos"
        description="Casos distribuídos por etapa"
        primaryColor="#2B6CB0"
      />
    ),
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: WidgetId) => {
    setDraggingWidget(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: WidgetId) => {
    event.preventDefault();
    const draggedId = (event.dataTransfer.getData('text/plain') as WidgetId) || (draggingWidget as WidgetId | null);
    if (!draggedId || draggedId === targetId) {
      setDraggingWidget(null);
      return;
    }
    setWidgetOrder(prev => {
      const filtered = prev.filter(id => DEFAULT_WIDGETS.includes(id as WidgetId));
      const fromIndex = filtered.indexOf(draggedId);
      const toIndex = filtered.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return filtered;
      const updated = [...filtered];
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, draggedId);
      return updated;
    });
    setDraggingWidget(null);
  };

  const handleWidgetAction = (widgetId: WidgetId, action: 'remove' | 'pin' | 'configure') => {
    if (action === 'remove') {
      setHiddenWidgets(prev => [...new Set([...prev, widgetId])]);
    }
    if (action === 'pin') {
      setWidgetOrder(prev => {
        const others = prev.filter(id => id !== widgetId);
        return [widgetId, ...others];
      });
    }
    if (action === 'configure') {
      alert('Personalização detalhada disponível em breve.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="premium-hero">
        <div className="premium-hero__overlay" />
        <div className="premium-hero__content">
          <div className="premium-hero__main">
            <span className="premium-badge">
              Painel executivo · {today.format('dddd, DD [de] MMMM')}
            </span>
            <h1 className="premium-hero__title">{heroTitle}</h1>
            <p className="premium-hero__subtitle">{heroSubtitle}</p>

            <div className="hero-actions hero-actions--compact">
              <Button className="hero-actions__primary" onClick={() => navigate('/tarefas')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Ir para Minhas Tarefas
              </Button>
              <Button
                variant="secondary"
                className="hero-actions__secondary"
                onClick={() => setWidgetModalOpen(true)}
              >
                Personalizar painel
              </Button>
              <div className="hero-actions__tools">
                <ThemeToggle />
                <AlertBell tasks={tasks} />
              </div>
            </div>

            <div className="premium-hero__metrics">
              {heroMetrics.map(metric => (
                <HeroMetric key={metric.label} {...metric} />
              ))}
            </div>
          </div>

          <div className="hero-sidecard">
            <div className="space-y-2">
              <p className="hero-sidecard__eyebrow">Resumo do mês</p>
              <h3 className="hero-sidecard__title">{monthlyStats.percent}% de produtividade</h3>
              <p className="hero-sidecard__subtitle">{monthlyCopy}</p>
            </div>
            <div className="hero-sidecard__grid">
              <div>
                <span className="hero-sidecard__label">Concluídas</span>
                <AnimatedNumber value={monthlyStats.completed} className="hero-sidecard__value" />
              </div>
              <div>
                <span className="hero-sidecard__label">Pendentes</span>
                <AnimatedNumber value={monthlyStats.pending} className="hero-sidecard__value" />
              </div>
              <div>
                <span className="hero-sidecard__label">Casos ativos</span>
                <AnimatedNumber value={lawsuits.length} className="hero-sidecard__value" />
              </div>
            </div>

            {heroTeamBlock}

            <div className="hero-sidecard__footer">
              <Button
                variant="ghost"
                className="hero-sidecard__cta"
                onClick={() => navigate('/gestao')}
              >
                Ver relatório mensal
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Atrasadas"
          value={summary.overdue}
          variation={`${summary.overdue} pendências nesta semana`}
          icon={AlertTriangle}
          tone="overdue"
          onClick={() => handleNavigate('overdue')}
        />
        <SummaryCard
          title="Hoje"
          value={summary.today}
          variation={`${summary.today} entregas previstas`}
          icon={CalendarClock}
          tone="today"
          onClick={() => handleNavigate('today')}
        />
        <SummaryCard
          title="Próximos 30 dias"
          value={summary.upcoming}
          variation={`${monthlyStats.percent}% concluídas deste mês`}
          icon={CalendarRange}
          tone="upcoming"
          onClick={() => handleNavigate('upcoming')}
        />
      </section>

      <section className="grid grid-cols-12 gap-6">
        {activeWidgets.map(widgetId => (
          <WidgetWrapper
            key={widgetId}
            id={widgetId as WidgetId}
            title={
              widgetId === 'distribution'
                ? 'Distribuição de tarefas'
                : widgetId === 'activity'
                ? 'Atividade semanal'
                : 'Status de processos'
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={() => setDraggingWidget(null)}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onAction={handleWidgetAction}
            dragging={draggingWidget}
          >
            {widgetContent[widgetId as WidgetId]}
          </WidgetWrapper>
        ))}
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="dashboard-card col-span-12 space-y-4 lg:col-span-4">
          <header>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Indicadores principais</h3>
            <p className="text-xs text-[var(--text-secondary)]">Resumo de performance jurídica</p>
          </header>
          <div className="space-y-3">
            {kpiCards.map(card => (
              <div key={card.title} className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
                  <card.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{card.title}</p>
                  <AnimatedNumber value={card.value} className="text-xl font-semibold text-[var(--text-primary)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-card col-span-12 space-y-4 lg:col-span-8">
          <header>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Objetivos do mês</h3>
            <p className="text-xs text-[var(--text-secondary)]">Acompanhe o andamento das metas de receita e produtividade.</p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Metas de receita</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">R$ 0,00</p>
              <p className="text-xs text-[var(--text-secondary)]">Integre o módulo financeiro para visualizar faturamento em tempo real.</p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Progresso de tarefas</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>{monthlyStats.completed} concluídas</span>
                  <span>{monthlyStats.total} planejadas</span>
                </div>
                <div
                  className="progress-bar mt-2"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={monthlyStats.percent}
                >
                  <div className="progress-bar__value" style={{ width: `${monthlyStats.percent}%` }} />
                </div>
                <div className="mt-2 text-xs font-semibold text-[var(--text-primary)]">
                  {monthlyStats.percent}% concluídas neste mês
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-4 lg:gap-6">
        {quickLinks.map(link => (
          <QuickActionCard
            key={link.title}
            title={link.title}
            description={link.description}
            icon={link.icon}
            onClick={() => navigate(link.href)}
            className="col-span-12 md:col-span-6 xl:col-span-3"
          />
        ))}
      </section>

      {isWidgetModalOpen && (
        <WidgetModal
          hidden={hiddenWidgets}
          setHidden={next => setHiddenWidgets(next)}
          available={[...DEFAULT_WIDGETS]}
          onClose={() => setWidgetModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
