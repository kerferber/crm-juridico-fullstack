import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  ClipboardList,
  CalendarCheck,
  CalendarClock,
  User,
  Briefcase,
  Link2,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTaskModal } from '../hooks/useTaskModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskStatus } from '../types/types';
import { cn } from '../lib/utils';
import MentionBadges from '../components/mentions/MentionBadges';

const statusStyles: Record<TaskStatus, string> = {
  [TaskStatus.Pendente]:
    'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200',
  [TaskStatus.Atrasada]:
    'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200',
  [TaskStatus.Concluida]:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
};

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tasks, users, contacts, lawsuits } = useApp();
  const { openForEdit } = useTaskModal();

  const taskId = Number.parseInt(id ?? '0', 10);
  const task = useMemo(() => tasks.find(item => item.id === taskId), [tasks, taskId]);

  if (!task) {
    return (
      <div className="rounded-xl border border-border/60 bg-white px-6 py-12 text-center text-sm text-muted-foreground shadow-sm dark:border-dark-border/60 dark:bg-dark-card">
        Tarefa não encontrada.
      </div>
    );
  }

  const responsible = users.find(user => user.id === task.responsibleId);
  const client = task.clientId ? contacts.find(contact => contact.id === task.clientId) : undefined;
  const lawsuit = task.lawsuitId ? lawsuits.find(item => item.id === task.lawsuitId) : undefined;

  const isOverdue =
    task.status !== TaskStatus.Concluida && task.deadline
      ? dayjs(task.deadline).isBefore(dayjs(), 'day')
      : false;

  return (
    <div className="space-y-8">
      <Link
        to="/tarefas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:translate-x-[-2px] hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para tarefas
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-primary/5 via-white to-transparent px-6 py-8 shadow-sm dark:border-dark-border/60 dark:from-dark-primary/10 dark:via-dark-card/70 dark:to-transparent">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl dark:bg-dark-primary/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner dark:bg-dark-primary/20 dark:text-dark-primary">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[24px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
                  {task.title}
                </h1>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em]',
                    statusStyles[task.status]
                  )}
                >
                  {task.status}
                </span>
              </div>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Visualize todas as informações referentes a esta tarefa e acompanhe prazos,
                responsáveis e vínculos com clientes e processos.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 dark:bg-dark-card/70">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  Oficial: {dayjs(task.dueDate).format('DD/MM/YYYY')}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1',
                    isOverdue
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200'
                      : 'bg-white/80 text-muted-foreground dark:bg-dark-card/70'
                  )}
                >
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  Prazo fatal:{' '}
                  {task.deadline ? dayjs(task.deadline).format('DD/MM/YYYY') : 'Não definido'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 dark:border-dark-primary/40 dark:text-dark-primary dark:hover:bg-dark-primary/15"
              onClick={() => openForEdit(task)}
            >
              <Edit3 className="h-4 w-4" />
              Editar tarefa
            </Button>
            <Button className="gap-2 bg-primary text-white shadow-sm hover:brightness-105 dark:bg-dark-primary">
              <Sparkles className="h-4 w-4" />
              Automatizar fluxo
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-border/50 bg-white/90 shadow-sm dark:border-dark-border/50 dark:bg-dark-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            {responsible?.name ?? 'Não atribuído'}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/50 bg-white/90 shadow-sm dark:border-dark-border/50 dark:bg-dark-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Cliente vinculado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-foreground dark:text-dark-foreground">
            {client ? (
              <>
                {client.name}
                <Button variant="link" size="sm" className="px-0 text-xs" asChild>
                  <Link to={`/contatos/${client.id}`}>
                    Ver contato <Link2 className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </>
            ) : (
              <span className="text-muted-foreground">Não vinculado</span>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/50 bg-white/90 shadow-sm dark:border-dark-border/50 dark:bg-dark-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Processo relacionado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-foreground dark:text-dark-foreground">
            {lawsuit ? (
              <>
                {lawsuit.internalNumber}
                <Button variant="link" size="sm" className="px-0 text-xs" asChild>
                  <Link to={`/processos/${lawsuit.id}`}>
                    Ver processo <Briefcase className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </>
            ) : (
              <span className="text-muted-foreground">Não vinculado</span>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/50 bg-white/90 shadow-sm dark:border-dark-border/50 dark:bg-dark-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Pontuação
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-primary dark:text-dark-primary">
            {task.score ?? 0}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Resumo cronológico</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>
              Prevista para {dayjs(task.dueDate).format('DD [de] MMMM [de] YYYY')}{' '}
              {isOverdue && (
                <strong className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
                  Atrasada
                </strong>
              )}
            </span>
          </div>
          {task.deadline && (
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span>Prazo fatal registrado para {dayjs(task.deadline).format('DD/MM/YYYY')}.</span>
            </div>
          )}
          {task.description ? (
            <p className="rounded-lg border border-border/60 bg-white/80 px-4 py-3 text-sm text-foreground dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground">
              {task.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma descrição adicional registrada para esta tarefa.
            </p>
          )}
        </CardContent>
      </Card>

      {(task.notes || (task.mentions && task.mentions.length > 0)) && (
        <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Notas e menções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {task.notes && (
              <p className="whitespace-pre-line text-foreground dark:text-dark-foreground">
                {task.notes}
              </p>
            )}
            <MentionBadges mentions={task.mentions} users={users} contacts={contacts} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskDetail;
