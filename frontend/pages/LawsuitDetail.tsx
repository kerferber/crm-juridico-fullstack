import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Briefcase,
  ArrowLeft,
  User,
  CalendarDays,
  Flag,
  Layers,
  Sparkles,
  ClipboardList,
  Timer,
  FileText,
  PlayCircle,
  Check,
  AlertTriangle,
  Gavel,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Timeline from '../components/lawsuits/Timeline';
import { TaskStatus, TimelineEvent } from '../types/types';
import { formatDate } from '../lib/utils';
import TaskShortcutCard from '../components/tasks/TaskShortcutCard';
import { useTaskModal } from '../hooks/useTaskModal';
import { cn } from '../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  Fechado: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200',
  Arquivado: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
};

const AREA_COLORS: Record<string, string> = {
  'Cível': 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary',
  'Trabalhista': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  'Previdenciário': 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
};

const LawsuitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lawsuits, contacts, users, tasks } = useApp();
  const { openForCreate: openTaskModal } = useTaskModal();
  const lawsuitId = Number.parseInt(id || '0', 10);
  const lawsuit = lawsuits.find(l => l.id === lawsuitId);

  if (!lawsuit) {
    return (
      <div className="rounded-xl border border-border/60 bg-white px-6 py-10 text-center text-muted-foreground shadow-sm dark:border-dark-border/60 dark:bg-dark-card">
        Processo não encontrado.
      </div>
    );
  }

  const client = contacts.find(contact => contact.id === lawsuit.clientId);
  const responsible = users.find(user => user.id === lawsuit.responsibleId);
  const lawsuitTasks = tasks.filter(task => task.lawsuitId === lawsuit.id);
  const concludedTasks = lawsuitTasks.filter(task => task.status === TaskStatus.Concluida).length;
  const delayedTasks = lawsuitTasks.filter(task => task.status === TaskStatus.Atrasada).length;
  const progress =
    lawsuitTasks.length > 0 ? Math.round((concludedTasks / lawsuitTasks.length) * 100) : 0;

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [
      {
        date: dayjs().subtract(30, 'day').toISOString(),
        icon: PlayCircle,
        title: 'Processo criado',
        description: `Registro ${lawsuit.internalNumber} iniciado no pipeline.`,
        color: '#4F46E5',
      },
      ...lawsuitTasks.map(task => {
        const responsibleName = users.find(u => u.id === task.responsibleId)?.name || 'Equipe';
        let icon = FileText;
        let color = '#64748B';
        if (task.status === TaskStatus.Concluida) {
          icon = Check;
          color = '#10B981';
        }
        if (task.status === TaskStatus.Atrasada) {
          icon = AlertTriangle;
          color = '#F97316';
        }
        return {
          date: task.deadline || task.dueDate,
          icon,
          title: task.title,
          description: `Responsável: ${responsibleName}`,
          color,
        };
      }),
    ];

    if (lawsuit.deadline) {
      events.push({
        date: lawsuit.deadline,
        icon: Flag,
        title: 'Prazo fatal',
        description: 'Data limite registrada para o processo.',
        color: '#EF4444',
      });
    }

    return events
      .filter(event => Boolean(event.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [lawsuit.deadline, lawsuit.internalNumber, lawsuitTasks, users]);

  const isOverdue = lawsuit.deadline ? dayjs().isAfter(dayjs(lawsuit.deadline), 'day') : false;

  return (
    <div className="space-y-8">
      <Link
        to="/processos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:translate-x-[-2px] hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Processos
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-primary/5 via-white to-transparent px-6 py-8 shadow-sm dark:border-dark-border/60 dark:from-dark-primary/10 dark:via-dark-card/70 dark:to-transparent">
        <div className="absolute -right-32 -top-32 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-dark-primary/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner dark:bg-dark-primary/20 dark:text-dark-primary">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
                  {lawsuit.internalNumber}
                </h1>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]',
                    STATUS_COLORS[lawsuit.status] ??
                      'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200'
                  )}
                >
                  {lawsuit.status}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]',
                    AREA_COLORS[lawsuit.area] ??
                      'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary'
                  )}
                >
                  {lawsuit.area}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Pipeline atualizado automaticamente conforme as tarefas avançam. Utilize os atalhos para
                criar novas interações ou ajustar responsáveis.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 dark:bg-dark-card/70">
                  <User className="h-3.5 w-3.5 text-primary" />
                  {responsible?.name ? `Responsável: ${responsible.name}` : 'Sem responsável'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 dark:bg-dark-card/70">
                  <Gavel className="h-3.5 w-3.5 text-primary" />
                  {client ? (
                    <Link
                      to={`/contatos/${client.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline dark:text-dark-primary"
                    >
                      {client.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    'Cliente não vinculado'
                  )}
                </span>
                {lawsuit.deadline && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 dark:bg-dark-card/70">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    Prazo: {formatDate(lawsuit.deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 dark:border-dark-primary/40 dark:text-dark-primary dark:hover:bg-dark-primary/15"
              onClick={() =>
                openTaskModal({
                  lawsuitId: lawsuit.id,
                  clientId: lawsuit.clientId,
                  responsibleId: lawsuit.responsibleId ?? users[0]?.id,
                })
              }
            >
              <ClipboardList className="h-4 w-4" />
              Nova tarefa
            </Button>
            <Button
              className="gap-2 bg-primary text-white shadow-sm hover:brightness-105 dark:bg-dark-primary"
              onClick={() =>
                openTaskModal({
                  lawsuitId: lawsuit.id,
                  clientId: lawsuit.clientId,
                  responsibleId: lawsuit.responsibleId ?? users[0]?.id,
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              Automatizar fluxo
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-primary/40 bg-primary/5 shadow-sm dark:border-dark-primary/40 dark:bg-dark-primary/10">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-primary dark:text-dark-primary">
              Progresso
            </CardTitle>
            <Sparkles className="h-5 w-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-semibold text-foreground dark:text-dark-foreground">
                {progress}%
              </span>
              <span className="text-xs text-muted-foreground">
                {concludedTasks}/{lawsuitTasks.length || 0} concluídas
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary transition-all dark:bg-dark-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-rose-200 bg-rose-50 shadow-sm dark:border-rose-400/30 dark:bg-rose-500/10">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 dark:text-rose-200">
              Tarefas críticas
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-rose-500 dark:text-rose-200">{delayedTasks}</p>
            <span className="text-xs text-muted-foreground">
              Necessitam intervenção imediata
            </span>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Etapa atual
            </CardTitle>
            <Layers className="h-5 w-5 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground dark:text-dark-foreground">
              {lawsuit.phase}
            </p>
            <span className="text-xs text-muted-foreground">Monitore o próximo marco crítico</span>
          </CardContent>
        </Card>
        <Card className="border border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-400/30 dark:bg-indigo-500/10">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-200">
              Prazo
            </CardTitle>
            <Timer className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-lg font-semibold',
                isOverdue ? 'text-rose-500 dark:text-rose-200' : 'text-foreground dark:text-dark-foreground'
              )}
            >
              {lawsuit.deadline ? formatDate(lawsuit.deadline) : 'Não definido'}
            </p>
            <span className="text-xs text-muted-foreground">
              {isOverdue ? 'Prazo venceu — reagendar ações' : 'Acompanhe entregas planejadas'}
            </span>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Linha do tempo do processo</CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre marcos importantes e acompanhe tudo que já ocorreu neste caso.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Timeline events={timelineEvents} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <TaskShortcutCard
            heading="Agendar nova tarefa"
            description="Dispare tarefas relacionadas a este processo e mantenha o time alinhado."
            defaults={{
              lawsuitId: lawsuit.id,
              clientId: lawsuit.clientId,
              responsibleId: lawsuit.responsibleId ?? users[0]?.id,
            }}
            ctaLabel="Nova tarefa do processo"
          />

          <Card className="border border-dashed border-border/60 bg-muted/15 shadow-none dark:border-dark-border/60 dark:bg-dark-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Anotações estratégicas</CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre insights e aprendizados para futuras audiências ou negociações.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-white/85 px-3 py-2 text-xs text-muted-foreground italic dark:border-dark-border/60 dark:bg-dark-card/60">
                Ex.: Possibilidade de acordo extrajudicial — reunir documentos do cliente até a
                próxima audiência.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Tarefas vinculadas</CardTitle>
            <p className="text-xs text-muted-foreground">
              Gerencie entregas diretamente por aqui. As atualizações refletem na linha do tempo.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lawsuitTasks.length > 0 ? (
            lawsuitTasks.map(task => (
              <div
                key={task.id}
                className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 dark:border-dark-border/60 dark:bg-dark-card/60 dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                    {task.title}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]',
                      task.status === 'Concluída'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : task.status === 'Atrasada'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200'
                    )}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {task.deadline && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 dark:bg-dark-card/50">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(task.deadline)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 dark:bg-dark-card/50">
                    <User className="h-3 w-3" />
                    Responsável:{' '}
                    {users.find(user => user.id === task.responsibleId)?.name ?? 'Sem atribuição'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/50">
              Nenhuma tarefa associada. Utilize o botão acima para atribuir a primeira atividade deste
              processo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LawsuitDetail;
