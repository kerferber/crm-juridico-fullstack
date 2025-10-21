import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { cn } from '../lib/utils';
import { TaskStatus } from '../types/types';
import {
  LayoutDashboard,
  AlertTriangle,
  Clock,
  Briefcase,
  Users,
  ArrowRight,
  Sparkles,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Spinner } from '../components/ui/Spinner';
import TaskWorkspace from '../components/dashboard/TaskWorkspace';
import { Link } from 'react-router-dom';

type HeroTab = 'proximas' | 'atrasadas' | 'concluidas';

const Dashboard: React.FC = () => {
  const { lawsuits, tasks, contacts, kanbanCards, loading, error, users } = useApp();
  const [heroTab, setHeroTab] = useState<HeroTab>('proximas');

  const today = dayjs().startOf('day');
  const currentUser = users[0];

  const {
    activeLawsuits,
    overdueTasks,
    newLeads,
    concludedThisMonth,
    heroTasks,
    overdueList,
    completedToday,
  } = useMemo(() => {
    const activeLawsuits = lawsuits.filter(l => l.status === 'Ativo').length;
    const overdueTasks = tasks.filter(t => t.status === TaskStatus.Atrasada).length;
    const newLeads = contacts.filter(c => c.status === 'Lead').length;
    const concludedThisMonth = tasks.filter(
      t => t.status === TaskStatus.Concluida && dayjs(t.dueDate).isSame(today, 'month')
    ).length;

    const upcomingTasks = tasks
      .filter(task => {
        if (task.status === TaskStatus.Concluida) return false;
        const due = dayjs(task.dueDate);
        return due.isSame(today, 'day') || due.isAfter(today, 'day');
      })
      .sort((a, b) => dayjs(a.dueDate).diff(dayjs(b.dueDate)))
      .slice(0, 6);

    const overdueList = tasks
      .filter(task => task.status !== TaskStatus.Concluida && dayjs(task.deadline).isBefore(today, 'day'))
      .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))
      .slice(0, 6);

    const completedToday = tasks
      .filter(task => task.status === TaskStatus.Concluida && dayjs(task.dueDate).isSame(today, 'day'))
      .sort((a, b) => dayjs(b.deadline).diff(dayjs(a.deadline)))
      .slice(0, 6);

    const heroTasks: Record<HeroTab, typeof upcomingTasks> = {
      proximas: upcomingTasks,
      atrasadas: overdueList,
      concluidas: completedToday,
    };

    return {
      activeLawsuits,
      overdueTasks,
      newLeads,
      concludedThisMonth,
      heroTasks,
      overdueList,
      completedToday,
    };
  }, [lawsuits, tasks, contacts, today]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-sm text-red-500">{error}</div>;
  }

  const greetingPrefix = dayjs().hour() < 12 ? 'Bom dia' : dayjs().hour() < 18 ? 'Boa tarde' : 'Boa noite';
  const heroTitle = `${greetingPrefix}, ${currentUser?.name.split(' ')[0] ?? 'equipe'}!`;
  const heroDescription = {
    proximas: 'Acompanhe as próximas entregas e prepare-se com antecedência.',
    atrasadas: 'Priorize estas pendências para manter o fluxo em dia.',
    concluidas: 'Celebre o que foi entregue hoje pela equipe.',
  }[heroTab];

  const heroDataset = heroTasks[heroTab] ?? [];

  const heroMetrics = [
    {
      label: 'Processos ativos',
      value: activeLawsuits,
      description: 'Casos em acompanhamento',
      icon: Briefcase,
      accent: 'text-sky-500',
    },
    {
      label: 'Pendências',
      value: overdueTasks,
      description: 'Tarefas acima do prazo',
      icon: AlertTriangle,
      accent: 'text-rose-500',
    },
    {
      label: 'Concluídas no mês',
      value: concludedThisMonth,
      description: 'Resultados entregues',
      icon: CheckCircle2,
      accent: 'text-emerald-500',
    },
    {
      label: 'Novos leads',
      value: newLeads,
      description: 'Em prospecção ativa',
      icon: Users,
      accent: 'text-indigo-500',
    },
  ];

  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.Pendente).length;
  const clientContacts = contacts.filter(contact => contact.status === 'Cliente').length;

  const insightCards = [
    {
      title: 'Pipeline ativo',
      value: kanbanCards.length,
      description: 'Oportunidades no funil',
      icon: LayoutDashboard,
      accent: 'text-indigo-500',
    },
    {
      title: 'Clientes em carteira',
      value: clientContacts,
      description: 'Relacionamentos acompanhados',
      icon: Users,
      accent: 'text-sky-500',
    },
    {
      title: 'Tarefas em progresso',
      value: inProgressTasks,
      description: 'Demandas em andamento',
      icon: Clock,
      accent: 'text-amber-500',
    },
    {
      title: 'Equipe online',
      value: users.length,
      description: 'Colaboradores ativos',
      icon: Users,
      accent: 'text-emerald-500',
    },
  ];

  const projectCards = [
    {
      title: 'CRM · Pipeline',
      description: 'Gerencie novas oportunidades e negociações em andamento.',
      icon: LayoutDashboard,
      href: '/crm',
    },
    {
      title: 'Processos ativos',
      description: 'Visualize casos em tramitação e próximos marcos.',
      icon: Briefcase,
      href: '/processos',
    },
    {
      title: 'Contatos recentes',
      description: 'Organize relacionamentos e histórico de interações.',
      icon: Users,
      href: '/contatos',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F3F8FF] via-[#EAF3FF] to-white px-6 py-7 text-slate-800 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.4)] dark:border-dark-border/60 dark:from-[#1E1B4B] dark:via-[#3730A3] dark:to-[#1E3A8A] dark:text-white">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-indigo-200/60 blur-3xl" />
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-600 shadow-sm dark:border-white/40 dark:bg-white/10 dark:text-white/80">
              <Sparkles className="h-4 w-4 text-sky-500 dark:text-white" />
              Painel diário · {today.format('dddd, DD [de] MMMM')}
            </span>
            <div className="space-y-3">
              <h1 className="text-[26px] font-semibold leading-tight text-slate-900 lg:text-[32px] dark:text-white">
                {heroTitle}
              </h1>
              <p className="max-w-2xl text-[13px] text-slate-500 lg:text-sm dark:text-white/75">
                Monitore compromissos, pendências e conquistas com uma visão clara inspirada em painéis leves e sofisticados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'proximas' as HeroTab, label: 'Próximas' },
                { key: 'atrasadas' as HeroTab, label: 'Atrasadas' },
                { key: 'concluidas' as HeroTab, label: 'Concluídas' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setHeroTab(tab.key)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-semibold transition',
                    heroTab === tab.key
                      ? 'border-sky-500 bg-sky-500 text-white shadow-sm dark:border-white/60'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:border-sky-300 hover:bg-white transition dark:border-white/30 dark:bg-white/10 dark:text-white/80'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button asChild className="w-fit rounded-md bg-sky-500 px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_rgba(56,189,248,0.9)] transition hover:bg-sky-600">
              <Link to="/tarefas">
                Criar tarefa estratégica <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 dark:text-white">
            {heroMetrics.map(metric => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.32)] dark:border-white/25 dark:bg-white/10"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/70">
                  <span>{metric.label}</span>
                  <metric.icon className={cn('h-5 w-5', metric.accent, 'text-opacity-80 dark:text-white')} />
                </div>
                <AnimatedNumber
                  value={metric.value}
                  className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-white/70">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-[0_22px_58px_-46px_rgba(15,23,42,0.32)] backdrop-blur-md dark:border-white/15 dark:bg-white/10">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Minhas tarefas</h2>
              <p className="text-[11px] text-slate-500 dark:text-white/70">{heroDescription}</p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="rounded-md border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 dark:border-white/25 dark:text-white dark:hover:bg-white/15"
            >
              <Link to="/tarefas">
                Ver todas <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </header>
          {heroDataset.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500 dark:border-white/30 dark:bg-white/10 dark:text-white/70">
              Nenhuma tarefa nesta categoria por enquanto.
            </p>
          ) : (
            <div className="grid gap-2 text-sm">
              {heroDataset.map(task => (
                <Link
                  key={task.id}
                  to={`/tarefas/${task.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:border-white/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{task.title}</p>
                    <span className="text-xs text-slate-500 dark:text-white/70">
                      Prazo {dayjs(task.deadline).format('DD MMM')} ·{' '}
                      {users.find(u => u.id === task.responsibleId)?.name ?? 'Equipe responsável'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm',
                      task.status === TaskStatus.Concluida
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-100'
                        : dayjs(task.deadline).isBefore(today, 'day')
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-400/25 dark:text-rose-100'
                        : 'bg-sky-100 text-sky-600 dark:bg-sky-400/25 dark:text-sky-100'
                    )}
                  >
                    {task.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insightCards.map(card => (
          <Card
            key={card.title}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.38)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_24px_55px_-44px_rgba(30,64,175,0.4)] dark:border-dark-border/60 dark:bg-dark-surface"
          >
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-dark-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn('h-4 w-4', card.accent)} />
            </CardHeader>
            <CardContent className="space-y-1">
              <AnimatedNumber
                value={card.value}
                className="text-2xl font-semibold text-slate-900 dark:text-dark-foreground"
              />
              <p className="text-xs text-slate-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_56px_-44px_rgba(15,23,42,0.42)] dark:border-dark-border/60 dark:bg-dark-surface">
          <CardHeader className="flex flex-col gap-2 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-dark-foreground">
              Projetos em destaque
            </CardTitle>
            <CardDescription className="text-xs">
              Continue de onde parou com acessos refinados às áreas mais acionadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {projectCards.map(project => (
              <Card
                key={project.title}
                className="group flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.32)] transition hover:-translate-y-[1px] hover:border-sky-300 hover:bg-white dark:border-dark-border/60 dark:bg-dark-surface-muted"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-dark-primary/15 dark:text-dark-primary">
                  <project.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-foreground">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500">{project.description}</p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="self-start rounded-md border border-slate-200 px-3 text-xs font-semibold text-sky-600 transition hover:border-sky-300 hover:bg-sky-50 dark:border-transparent dark:text-primary"
                >
                  <Link to={project.href}>
                    Abrir projeto <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_56px_-44px_rgba(15,23,42,0.42)] dark:border-dark-border/60 dark:bg-dark-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-dark-foreground">
              Alertas rápidos
            </CardTitle>
            <CardDescription className="text-xs">
              Priorize pendências e celebre entregas do dia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              {overdueList.length === 0 ? (
                <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Nenhuma pendência crítica. Excelente ritmo!
                </p>
              ) : (
                overdueList.map(task => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                  >
                    <p className="font-medium">{task.title}</p>
                    <span className="text-[11px]">
                      Prazo {dayjs(task.deadline).format('DD MMM')} ·{' '}
                      {users.find(u => u.id === task.responsibleId)?.name ?? 'Equipe'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3 text-sm">
              {completedToday.length === 0 ? (
                <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-center text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Ainda não há entregas hoje. Que tal concluir uma tarefa agora?
                </p>
              ) : (
                completedToday.map(task => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  >
                    <p className="font-medium">{task.title}</p>
                    <span className="text-[11px]">
                      Concluída por {users.find(u => u.id === task.responsibleId)?.name ?? 'Equipe'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <TaskWorkspace />
    </div>
  );
};

export default Dashboard;
