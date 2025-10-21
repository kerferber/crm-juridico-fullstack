import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AnimatedProgressBar } from '../components/ui/AnimatedProgressBar';
import { useApp } from '../store/AppContext';
import { cn, formatCurrency, getGamificationData } from '../lib/utils';
import { getGoalProgressPercentage } from '../lib/goal-utils';
import {
  Goal,
  GoalAssignment,
  GoalProgram,
  GoalStatus,
  Level,
  TaskStatus,
} from '../types/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  ArrowUpRight,
  Award,
  CalendarDays,
  Crown,
  Flag,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { LEVELS } from '../data/seed';

const STATUS_ORDER: Record<GoalStatus, number> = {
  critical: 0,
  attention: 1,
  onTrack: 2,
  achieved: 3,
};

const STATUS_STYLES: Record<
  GoalStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  critical: {
    label: 'Crítica',
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-300',
    bg: 'bg-red-50/80 dark:bg-red-500/10',
  },
  attention: {
    label: 'Atenção',
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-300',
    bg: 'bg-amber-50/80 dark:bg-amber-500/10',
  },
  onTrack: {
    label: 'No ritmo',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-300',
    bg: 'bg-sky-50/80 dark:bg-sky-500/10',
  },
  achieved: {
    label: 'Alcançada',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-300',
    bg: 'bg-emerald-50/80 dark:bg-emerald-500/10',
  },
};

const formatGoalValue = (goal: Goal, value: number) => {
  if (!Number.isFinite(value)) return '—';
  if (goal.unit === 'currency') {
    return formatCurrency(value);
  }
  if (goal.unit === 'percentage') {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`;
  }
  return value.toLocaleString('pt-BR');
};

const Gamification: React.FC = () => {
  const {
    users,
    tasks,
    lawsuits,
    goals,
    goalPrograms,
    goalAssignments,
    goalCheckpoints,
  } = useApp();

  const currentUser = users[0];
  const fallbackLevel: Level = LEVELS[0] ?? {
    level: 1,
    name: 'Iniciante',
    pointsRequired: 0,
  };

  const gamification = useMemo(() => {
    if (!currentUser) {
      return {
        completedTasks: [],
        score: 0,
        level: fallbackLevel,
        nextLevel: LEVELS[1],
        progressPercentage: 0,
        earnedBadges: [],
      };
    }
    return getGamificationData(currentUser, tasks, lawsuits);
  }, [currentUser, tasks, lawsuits, fallbackLevel]);

  const teamRanking = useMemo(() => {
    return users
      .map(user => {
        const completed = tasks.filter(
          task =>
            task.responsibleId === user.id &&
            task.status === TaskStatus.Concluida
        );
        const points = completed.reduce((sum, task) => sum + task.score, 0);
        const onTime = completed.filter(task =>
          dayjs(task.dueDate).isSameOrBefore(dayjs(task.deadline), 'day')
        ).length;
        return {
          user,
          points,
          completed: completed.length,
          onTimeRate: completed.length
            ? Math.round((onTime / completed.length) * 100)
            : 0,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [users, tasks]);

  const highlightedGoals = useMemo(() => {
    return goals
      .slice()
      .sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        return dayjs(a.endDate).diff(dayjs(b.endDate));
      })
      .slice(0, 4)
      .map(goal => ({
        goal,
        program: goalPrograms.find(program => program.id === goal.programId),
        progress: getGoalProgressPercentage(goal),
      }));
  }, [goals, goalPrograms]);

  const personalFocus = useMemo(() => {
    if (!currentUser) return [];

    const assignmentByGoal = goalAssignments
      .filter(
        assignment =>
          assignment.assigneeType === 'user' &&
          String(assignment.assigneeId) === String(currentUser.id)
      )
      .reduce<Map<string, GoalAssignment>>((map, assignment) => {
        const existing = map.get(assignment.goalId);
        const existingWeight = existing?.weight ?? 0;
        const nextWeight = assignment.weight ?? 0;
        if (!existing || nextWeight >= existingWeight) {
          map.set(assignment.goalId, assignment);
        }
        return map;
      }, new Map<string, GoalAssignment>());

    const uniqueAssignments = Array.from(assignmentByGoal.values()) as GoalAssignment[];

    return uniqueAssignments
      .map(assignment => {
        const goal = goals.find(item => item.id === assignment.goalId);
        if (!goal) return null;
        const program = goalPrograms.find(
          item => item.id === goal.programId
        );
        return {
          goal,
          program,
          progress: getGoalProgressPercentage(goal),
          weight: assignment.weight,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> => Boolean(item)
      )
      .sort(
        (a, b) => STATUS_ORDER[a.goal.status] - STATUS_ORDER[b.goal.status]
      )
      .slice(0, 3);
  }, [currentUser, goalAssignments, goals, goalPrograms]);

  const activePrograms = useMemo(() => {
    return goalPrograms
      .map(program => {
        const programGoals = goals.filter(
          goal => goal.programId === program.id
        );
        const averageProgress = programGoals.length
          ? programGoals.reduce(
              (sum, goal) => sum + getGoalProgressPercentage(goal),
              0
            ) / programGoals.length
          : 0;
        const criticalGoals = programGoals.filter(
          goal => goal.status === 'critical'
        ).length;
        const attentionGoals = programGoals.filter(
          goal => goal.status === 'attention'
        ).length;
        const nextMilestone = programGoals
          .slice()
          .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)))[0];
        return {
          program,
          averageProgress,
          criticalGoals,
          attentionGoals,
          totalGoals: programGoals.length,
          nextMilestone,
        };
      })
      .sort((a, b) =>
        dayjs(a.program.endDate).diff(dayjs(b.program.endDate))
      );
  }, [goalPrograms, goals]);

  const executionTimeline = useMemo(() => {
    return goalCheckpoints
      .slice()
      .sort(
        (a, b) =>
          dayjs(b.recordedAt).valueOf() - dayjs(a.recordedAt).valueOf()
      )
      .slice(0, 5)
      .map(checkpoint => {
        const goal = goals.find(item => item.id === checkpoint.goalId);
        const author = users.find(
          user => user.id === checkpoint.authorId
        );
        const delta = checkpoint.delta ?? checkpoint.value;
        return {
          checkpoint,
          goal,
          author,
          delta,
        };
      });
  }, [goalCheckpoints, goals, users]);

  const monthlyPoints = useMemo(() => {
    return Array.from({ length: 6 }).map((_, index) => {
      const month = dayjs().subtract(5 - index, 'month');
      const monthTasks = tasks.filter(
        task =>
          task.status === TaskStatus.Concluida &&
          dayjs(task.dueDate).isSame(month, 'month')
      );
      const points = monthTasks.reduce(
        (sum, task) => sum + task.score,
        0
      );
      return {
        month: month.format('MMM'),
        points,
      };
    });
  }, [tasks]);

  const monthlyCompleted = useMemo(() => {
    return tasks.filter(
      task =>
        task.status === TaskStatus.Concluida &&
        dayjs(task.dueDate).isSame(dayjs(), 'month')
    ).length;
  }, [tasks]);

  const averageScore = useMemo(() => {
    if (!gamification.completedTasks.length) return 0;
    return (
      gamification.score / gamification.completedTasks.length
    );
  }, [gamification]);

  const userRankingPosition = currentUser
    ? teamRanking.findIndex(
        entry => entry.user.id === currentUser.id
      ) + 1 || null
    : null;

  const pointsToNext = gamification.nextLevel
    ? Math.max(
        gamification.nextLevel.pointsRequired - gamification.score,
        0
      )
    : 0;

  const firstName =
    currentUser?.name.split(' ')[0] ?? 'Equipe';

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <Card className="relative overflow-hidden rounded-[28px] border-0 bg-gradient-to-br from-[#161B5C] via-[#4338CA] to-[#0EA5E9] text-white shadow-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-cyan-400/40 blur-3xl" />
            <div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-violet-400/40 blur-3xl" />
          </div>
          <CardContent className="relative flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/80">
                  <Sparkles className="h-4 w-4" />
                  Painel premium
                </span>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold sm:text-4xl">
                    {firstName}, domine seu progresso de carreira.
                  </h1>
                  <p className="text-sm text-white/75">
                    Visualize seu nível, conquistas e metas-chave em um painel inspirado nas
                    demais áreas premium do workflow.
                  </p>
                  {userRankingPosition && (
                    <p className="text-xs text-white/70">
                      Você está na posição #{userRankingPosition} do ranking geral da equipe.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 rounded-full border border-white/50 bg-white px-5 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-900/20 transition hover:bg-white/90 hover:text-indigo-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar meta
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Ver benefícios
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs uppercase tracking-[0.25em] text-white/70">
                  <span>
                    Nível {gamification.level.level} · {gamification.level.name}
                  </span>
                  {gamification.nextLevel && (
                    <span>
                      Faltam {pointsToNext.toLocaleString('pt-BR')} pts para{' '}
                      {gamification.nextLevel.name}
                    </span>
                  )}
                  <span>{monthlyCompleted} entregas neste mês</span>
                </div>
              </div>
              <div className="w-full max-w-xs space-y-4 rounded-[24px] border border-white/20 bg-white/10 p-6 text-white shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/80">
                  <Trophy className="h-4 w-4" />
                  Resumo rápido
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Nível atual</span>
                    <span className="text-base font-semibold text-white">
                      {gamification.level.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Pontuação</span>
                    <span className="text-xl font-semibold text-white">
                      {gamification.score.toLocaleString('pt-BR')} pts
                    </span>
                  </div>
                  {gamification.nextLevel && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>Progresso para {gamification.nextLevel.name}</span>
                        <span>
                          {Math.round(
                            Math.max(0, Math.min(100, gamification.progressPercentage))
                          )}
                          %
                        </span>
                      </div>
                      <AnimatedProgressBar value={gamification.progressPercentage} className="bg-white" />
                      <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">
                        Restam {pointsToNext.toLocaleString('pt-BR')} pts
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/12 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                  Entregas recentes
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {monthlyCompleted}
                </p>
                <p className="text-xs text-white/65">
                  Tarefas concluídas em {dayjs().format('MMMM')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/12 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                  Pontos por entrega
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {averageScore.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </p>
                <p className="text-xs text-white/65">
                  Média por tarefa concluída
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/12 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                  Reconhecimentos
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {gamification.earnedBadges.length}
                </p>
                <p className="text-xs text-white/65">
                  Badges desbloqueadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              Foco pessoal
            </CardTitle>
            <CardDescription>
              As metas prioritárias atribuídas a você no momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {personalFocus.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/20 dark:text-dark-muted">
                Nenhuma meta pessoal está atribuída. Use a área de
                configurações para definir responsabilidades.
              </div>
            )}
            {personalFocus.map(item => {
              const status = STATUS_STYLES[item.goal.status];
              const accent =
                item.program?.color ?? 'rgba(99, 102, 241, 0.65)';
              return (
                <div
                  key={item.goal.id}
                  className="space-y-3 rounded-xl border border-border/70 bg-white/70 p-4 shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground dark:text-dark-muted">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        {item.program?.type ?? 'Meta'}
                      </div>
                      <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                        {item.goal.title}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                        status.bg,
                        status.text
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          status.dot
                        )}
                      />
                      {status.label}
                    </span>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground dark:text-dark-muted">
                    <div className="flex items-center justify-between">
                      <span>Progresso</span>
                      <span>
                        {Math.round(
                          Math.max(0, Math.min(100, item.progress))
                        )}
                        %
                      </span>
                    </div>
                    <AnimatedProgressBar
                      value={item.progress}
                      className="bg-primary"
                    />
                    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 dark:text-dark-muted">
                      <span>
                        Meta: {formatGoalValue(item.goal, item.goal.targetValue)}
                      </span>
                      <span>
                        Atual: {formatGoalValue(item.goal, item.goal.currentValue)}
                      </span>
                      {item.weight !== undefined && (
                        <span>
                          Peso {Math.round(item.weight * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {gamification.earnedBadges.length > 0 && (
              <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 dark:border-dark-border/60 dark:bg-dark-border/20">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground dark:text-dark-muted">
                  Conquistas
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {gamification.earnedBadges.slice(0, 5).map(badge => {
                    const BadgeIcon =
                      typeof badge.icon === 'function' ? badge.icon : Award;
                    return (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-center text-xs shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80 dark:text-dark-muted"
                        title={badge.description}
                      >
                        <BadgeIcon className="h-5 w-5 text-amber-500" />
                        <span className="text-[11px] font-medium">
                          {badge.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {gamification.earnedBadges.length > 5 && (
                  <Button variant="ghost" size="sm" className="px-0 text-xs text-primary dark:text-dark-primary">
                    Ver todas as badges
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[2fr,1fr]">
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-5 w-5 text-primary" />
              Metas em destaque
            </CardTitle>
            <CardDescription>
              Monitoramento das metas estratégicas com maior impacto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {highlightedGoals.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/20 dark:text-dark-muted">
                Nenhuma meta cadastrada por enquanto.
              </div>
            )}
            {highlightedGoals.map(item => {
              const status = STATUS_STYLES[item.goal.status];
              const accent =
                item.program?.color ?? 'rgba(99, 102, 241, 0.65)';
              return (
                <div
                  key={item.goal.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground dark:text-dark-muted">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        {item.program?.name ?? 'Programa'}
                      </div>
                      <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                        {item.goal.title}
                      </p>
                      {item.goal.description && (
                        <p className="text-xs text-muted-foreground dark:text-dark-muted">
                          {item.goal.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                        status.bg,
                        status.text
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          status.dot
                        )}
                      />
                      {status.label}
                    </span>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground dark:text-dark-muted">
                    <div className="flex items-center justify-between">
                      <span>
                        {formatGoalValue(
                          item.goal,
                          item.goal.currentValue
                        )}{' '}
                        de{' '}
                        {formatGoalValue(
                          item.goal,
                          item.goal.targetValue
                        )}
                      </span>
                      <span>
                        {Math.round(
                          Math.max(0, Math.min(100, item.progress))
                        )}
                        %
                      </span>
                    </div>
                    <AnimatedProgressBar
                      value={item.progress}
                      className="bg-primary"
                    />
                    {item.goal.motivationMessage && (
                      <p className="text-xs italic text-muted-foreground dark:text-dark-muted">
                        {item.goal.motivationMessage}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 dark:text-dark-muted">
                      <span>
                        Prazo: {dayjs(item.goal.endDate).format('DD MMM YYYY')}
                      </span>
                      <span>
                        Frequência:{' '}
                        {item.goal.checkpointFrequency
                          ? item.goal.checkpointFrequency
                          : 'Sob demanda'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-primary" />
              Ranking da equipe
            </CardTitle>
            <CardDescription>
              Top performers considerando pontos e entregas no prazo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamRanking.slice(0, 5).map((entry, index) => {
              const isCurrent =
                currentUser && entry.user.id === currentUser.id;
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/90 px-4 py-3 text-sm shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80',
                    isCurrent &&
                      'border-primary/50 bg-primary/5 dark:border-dark-primary/60 dark:bg-dark-primary/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                        index === 0
                          ? 'bg-amber-400/20 text-amber-500'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-500'
                          : index === 2
                          ? 'bg-orange-300/20 text-orange-500'
                          : 'bg-muted text-muted-foreground dark:bg-dark-border/50 dark:text-dark-muted'
                      )}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground dark:text-dark-foreground">
                        {entry.user.name}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 dark:text-dark-muted">
                        <span>
                          {entry.points.toLocaleString('pt-BR')} pts
                        </span>
                        <span>
                          {entry.completed} entregas
                        </span>
                        <span>{entry.onTimeRate}% no prazo</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="px-0 text-xs text-primary dark:text-dark-primary">
                    Detalhes
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
            {teamRanking.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/20 dark:text-dark-muted">
                Nenhum colaborador com tarefas concluídas ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr,1fr]">
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-5 w-5 text-primary" />
              Programas estratégicos
            </CardTitle>
            <CardDescription>
              Visão geral dos programas de metas ativos e sua saúde geral.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePrograms.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/20 dark:text-dark-muted">
                Cadastre um programa de metas para começar a acompanhar os resultados.
              </div>
            )}
            {activePrograms.map(item => {
              const ProgramIcon =
                item.program.icon && typeof item.program.icon === 'function'
                  ? item.program.icon
                  : Award;
              return (
                <div
                  key={item.program.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl border"
                        style={{
                          borderColor: item.program.color ?? 'rgba(99, 102, 241, 0.35)',
                          backgroundColor: (item.program.color ?? '#6366F1') + '15',
                        }}
                      >
                        <ProgramIcon
                          className="h-5 w-5"
                          style={{
                            color: item.program.color ?? '#6366F1',
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                          {item.program.name}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-dark-muted">
                          {item.program.description}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="px-0 text-xs text-primary dark:text-dark-primary">
                      Abrir programa
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid gap-3 text-xs text-muted-foreground dark:text-dark-muted">
                    <div className="flex items-center justify-between">
                      <span>Média de progresso</span>
                      <span>
                        {Math.round(
                          Math.max(0, Math.min(100, item.averageProgress))
                        )}
                        %
                      </span>
                    </div>
                    <AnimatedProgressBar
                      value={item.averageProgress}
                      className="bg-primary"
                    />
                    <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 dark:text-dark-muted">
                      <span>{item.totalGoals} metas</span>
                      <span>
                        {item.criticalGoals} críticas · {item.attentionGoals} atenção
                      </span>
                      <span>
                        Encerramento: {dayjs(item.program.endDate).format('DD MMM YYYY')}
                      </span>
                    </div>
                    {item.nextMilestone && (
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs dark:border-dark-border/60 dark:bg-dark-border/20">
                        Próximo marco: {item.nextMilestone.title}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Últimas atualizações
            </CardTitle>
            <CardDescription>
              Checkpoints mais recentes registrados pela equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {executionTimeline.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/20 dark:text-dark-muted">
                Ainda não existem checkpoints cadastrados.
              </div>
            )}
            {executionTimeline.map(item => {
              return (
                <div
                  key={item.checkpoint.id}
                  className="flex gap-3 rounded-xl border border-border/70 bg-card/90 px-4 py-3 text-sm shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground dark:text-dark-foreground">
                          {item.goal?.title ?? 'Meta encerrada'}
                        </p>
                        {item.goal?.programId && (
                          <p className="text-xs text-muted-foreground dark:text-dark-muted">
                            {goalPrograms.find(program => program.id === item.goal?.programId)?.name}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground dark:bg-dark-border/30 dark:text-dark-muted">
                        {dayjs(item.checkpoint.recordedAt).format('DD MMM')}
                      </span>
                    </div>
                    {item.checkpoint.notes && (
                      <p className="text-xs text-muted-foreground dark:text-dark-muted">
                        {item.checkpoint.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 dark:text-dark-muted">
                      {item.author && <span>Por {item.author.name.split(' ')[0]}</span>}
                      <span>
                        {item.delta >= 0 ? '+' : ''}
                        {item.delta.toLocaleString('pt-BR')}
                      </span>
                      <span>
                        Total: {item.checkpoint.value.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr,1fr]">
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pontuação mensal da equipe
            </CardTitle>
            <CardDescription>
              Evolução dos pontos acumulados nos últimos seis meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyPoints}>
                <defs>
                  <linearGradient id="teamPointsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(79, 70, 229, 0.3)', strokeWidth: 2 }}
                  formatter={value => [
                    `${Number(value).toLocaleString('pt-BR')} pts`,
                    'Pontuação',
                  ]}
                  labelFormatter={label => `Mês: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="points"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#teamPointsGradient)"
                  name="Pontuação"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm dark:border-dark-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-primary" />
              Próximos reconhecimentos
            </CardTitle>
            <CardDescription>
              Badges e níveis que você pode conquistar em breve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gamification.nextLevel ? (
              <div className="rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground dark:text-dark-muted">
                  Próximo nível
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
                      {gamification.nextLevel.name}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-dark-muted">
                      Atingindo {gamification.nextLevel.pointsRequired.toLocaleString('pt-BR')} pontos totais.
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="px-3 text-xs text-primary dark:text-dark-primary">
                    Ver benefícios
                  </Button>
                </div>
                <div className="mt-3">
                  <AnimatedProgressBar
                    value={gamification.progressPercentage}
                    className="bg-primary"
                  />
                  <p className="mt-2 text-xs text-muted-foreground dark:text-dark-muted">
                    Faltam {pointsToNext.toLocaleString('pt-BR')} pontos para esse reconhecimento.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/20 dark:text-dark-muted">
                Você já atingiu o nível máximo disponível. Parabéns!
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 dark:border-dark-border/60 dark:bg-dark-border/20">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground dark:text-dark-muted">
                Próximas badges
              </p>
              {gamification.earnedBadges.length === 0 && (
                <p className="text-xs text-muted-foreground dark:text-dark-muted">
                  Complete suas primeiras entregas para começar a desbloquear badges.
                </p>
              )}
              <div className="grid gap-3">
                {LEVELS.slice(gamification.level.level, gamification.level.level + 2).map(level => (
                  <div
                    key={level.level}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs shadow-sm dark:border-dark-border/70 dark:bg-dark-card/80 dark:text-dark-muted"
                  >
                    <span>Nível {level.level}: {level.name}</span>
                    <span>{level.pointsRequired.toLocaleString('pt-BR')} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Gamification;
