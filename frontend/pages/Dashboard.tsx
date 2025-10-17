import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { cn } from '../lib/utils';
import { TaskStatus } from '../types/types';
import { LayoutDashboard, AlertTriangle, Clock, Briefcase, Users, ArrowRight } from 'lucide-react';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Spinner } from '../components/ui/Spinner';
import TaskWorkspace from '../components/dashboard/TaskWorkspace';
import { useTaskModal } from '../hooks/useTaskModal';
import { Link } from 'react-router-dom';

type HeroTab = 'proximas' | 'atrasadas' | 'concluidas';

const Dashboard: React.FC = () => {
  const { lawsuits, tasks, contacts, kanbanCards, loading, error, users } = useApp();
  const { openForEdit } = useTaskModal();
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
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
        <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Hoje é {today.format('dddd, DD [de] MMMM')}
            </span>
            <h1 className="text-xl font-semibold leading-tight text-foreground dark:text-dark-foreground">
              {heroTitle}
            </h1>
            <p className="max-w-xl text-xs text-muted-foreground">
              Use o painel para visualizar os compromissos prioritários e orientar o time.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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
                    'rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition',
                    heroTab === tab.key
                      ? 'border-primary/40 bg-primary text-white shadow-sm dark:border-dark-primary/40 dark:bg-dark-primary dark:text-dark-foreground'
                      : 'border-border/60 bg-white text-muted-foreground hover:border-primary/30 hover:text-primary dark:border-dark-border/60 dark:bg-dark-card/70 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-3 text-xs text-muted-foreground">
          {[ 
            { label: 'Ativos', value: activeLawsuits, accent: 'text-primary/80', description: 'Processos acompanhados' },
            { label: 'Pendências', value: overdueTasks, accent: 'text-rose-500', description: 'Tarefas em atraso' },
            { label: 'Concluídas', value: concludedThisMonth, accent: 'text-emerald-500', description: 'Neste mês' },
            { label: 'Novos leads', value: newLeads, accent: 'text-sky-500', description: 'Em prospecção' },
          ].map(card => (
            <Card
              key={card.label}
              className="rounded-xl border border-border/50 bg-white/90 shadow-[0_18px_45px_-30px_rgba(12,10,29,0.35)] dark:border-dark-border/50 dark:bg-dark-card/75"
            >
              <CardContent className="space-y-1.5 px-5 py-4">
                <span className={cn('text-[11px] font-semibold uppercase tracking-[0.18em]', card.accent)}>
                  {card.label}
                </span>
                <AnimatedNumber
                  value={card.value}
                  className="text-2xl font-semibold text-foreground dark:text-dark-foreground"
                />
                <p className="text-[11px] text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
        <div className="border-t border-border/60 px-6 py-5 dark:border-dark-border/60">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground dark:text-dark-foreground">Minhas tarefas</h2>
              <p className="text-xs text-muted-foreground">{heroDescription}</p>
            </div>
            <Button asChild variant="link" className="px-0 text-xs font-semibold text-primary">
              <Link to="/tarefas">
                Ver todas <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </header>
          {heroDataset.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-white p-6 text-center text-xs text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70">
              Nenhuma tarefa nesta categoria por enquanto.
            </p>
          ) : (
            <div className="grid gap-3 text-sm">
              {heroDataset.map(task => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openForEdit(task)}
                  className="flex w-full items-center justify-between rounded-lg border border-transparent bg-muted/20 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-dark-border/30 dark:hover:bg-dark-border/40"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground dark:text-dark-foreground">{task.title}</p>
                    <span className="text-xs text-muted-foreground">
                      Prazo: {dayjs(task.deadline).format('DD MMM')} · Responsável{' '}
                      {users.find(u => u.id === task.responsibleId)?.name ?? 'Equipe'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                      task.status === TaskStatus.Concluida
                        ? 'bg-emerald-100 text-emerald-600'
                        : dayjs(task.deadline).isBefore(today, 'day')
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-indigo-100 text-indigo-600'
                    )}
                  >
                    {task.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processos ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber value={activeLawsuits} className="text-2xl font-semibold text-foreground dark:text-dark-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">Casos em andamento</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber value={overdueTasks} className="text-2xl font-semibold text-rose-500" />
            <p className="mt-1 text-xs text-muted-foreground">Pendências acima do prazo</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Novos leads</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber value={kanbanCards.length} className="text-2xl font-semibold text-indigo-500" />
            <p className="mt-1 text-xs text-muted-foreground">Itens no pipeline</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas do time</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber value={tasks.length * 1.5} className="text-2xl font-semibold text-emerald-500" />
            <p className="mt-1 text-xs text-muted-foreground">Estimativa investida na semana</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border/60 bg-white p-6 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70 lg:col-span-2">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground dark:text-dark-foreground">
                Projetos em destaque
              </h2>
              <p className="text-xs text-muted-foreground">
                Continue de onde parou com acessos rápidos.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full text-xs font-semibold text-primary">
              Ver todos <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </header>
          <div className="grid gap-3 md:grid-cols-3">
            {projectCards.map(project => (
              <Card
                key={project.title}
                className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-primary/50 hover:shadow-lg dark:border-dark-border/60 dark:bg-dark-card/70"
              >
                <project.icon className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                </div>
                <Button variant="ghost" size="sm" className="self-start rounded-lg px-3 text-xs font-semibold text-primary" asChild>
                  <a href={project.href}>
                    Abrir projeto <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <Card className="rounded-xl border border-border/60 bg-white p-6 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground dark:text-dark-foreground">
              Alertas rápidos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Os principais pontos de atenção para o time jurídico.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              {overdueList.map(task => (
                <div key={task.id} className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  <p className="font-medium">{task.title}</p>
                  <span className="text-[11px]">
                    Prazo {dayjs(task.deadline).format('DD MMM')} · Responsável{' '}
                    {users.find(u => u.id === task.responsibleId)?.name ?? 'Equipe'}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-sm">
              {completedToday.map(task => (
                <div key={task.id} className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <p className="font-medium">{task.title}</p>
                  <span className="text-[11px]">
                    Concluída por {users.find(u => u.id === task.responsibleId)?.name ?? 'Equipe'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <TaskWorkspace />
    </div>
  );
};

export default Dashboard;
