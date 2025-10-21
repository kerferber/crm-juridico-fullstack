import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { getGoalProgressPercentage } from '../lib/goal-utils';
import { formatCurrency } from '../lib/utils';
import { TaskStatus, TransactionType, GoalStatus } from '../types/types';

const STATUS_LABELS: Record<GoalStatus, string> = {
  achieved: 'Alcançada',
  onTrack: 'No ritmo',
  attention: 'Atenção',
  critical: 'Crítica',
};

const describeDelta = (current: number, previous: number) => {
  const delta = current - previous;
  const formattedDelta =
    delta === 0 ? 'sem variação' : `${delta > 0 ? '+' : ''}${delta} em relação ao mês anterior`;
  return `${current} (${formattedDelta})`;
};

const describeCurrencyDelta = (current: number, previous: number) => {
  const delta = current - previous;
  const formattedDelta =
    delta === 0
      ? 'sem variação'
      : `${delta > 0 ? '+' : '-'}${formatCurrency(Math.abs(delta))} vs mês anterior`;
  return `${formatCurrency(current)} (${formattedDelta})`;
};

const Insights: React.FC = () => {
  const { contacts, lawsuits, tasks, users, goals, transactions, goalPrograms } = useApp();

  const query = useMemo(() => {
    const now = dayjs();
    const currentMonthLabel = now.format('MMMM YYYY');
    const previousMonth = now.subtract(1, 'month');

    const isInMonth = (value: string | undefined, target: dayjs.Dayjs) => {
      if (!value) {
        return false;
      }
      const parsed = dayjs(value);
      return parsed.isValid() && parsed.isSame(target, 'month');
    };

    // Clientes
    const newClientsThisMonth = contacts.filter(contact =>
      isInMonth(contact.lastInteraction, now)
    ).length;
    const newClientsPrevMonth = contacts.filter(contact =>
      isInMonth(contact.lastInteraction, previousMonth)
    ).length;

    // Processos
    const newCasesThisMonth = lawsuits.filter(lawsuit =>
      isInMonth(lawsuit.deadline, now)
    ).length;
    const newCasesPrevMonth = lawsuits.filter(lawsuit =>
      isInMonth(lawsuit.deadline, previousMonth)
    ).length;

    // Tarefas
    const tasksCreatedThisMonth = tasks.filter(task => isInMonth(task.dueDate, now)).length;
    const tasksCreatedPrevMonth = tasks.filter(task =>
      isInMonth(task.dueDate, previousMonth)
    ).length;

    const tasksCompleted = tasks.filter(task => task.status === TaskStatus.Concluida).length;
    const tasksOverdue = tasks.filter(task => task.status === TaskStatus.Atrasada).length;
    const tasksPending = tasks.filter(task => task.status === TaskStatus.Pendente).length;

    const tasksCompletedThisMonth = tasks.filter(
      task => task.status === TaskStatus.Concluida && isInMonth(task.dueDate, now)
    ).length;
    const tasksCompletedPrevMonth = tasks.filter(
      task => task.status === TaskStatus.Concluida && isInMonth(task.dueDate, previousMonth)
    ).length;

    const tasksByUser = users.map(user => {
      const userTasks = tasks.filter(task => task.responsibleId === user.id);
      const createdInMonth = userTasks.filter(task => isInMonth(task.dueDate, now)).length;
      const overdueCount = userTasks.filter(task => task.status === TaskStatus.Atrasada).length;
      const concludedCount = userTasks.filter(task => task.status === TaskStatus.Concluida).length;
      const concludedOnTime = userTasks.filter(task => {
        if (task.status !== TaskStatus.Concluida || !task.deadline) {
          return false;
        }
        const due = dayjs(task.dueDate);
        const deadline = dayjs(task.deadline);
        if (!due.isValid() || !deadline.isValid()) {
          return false;
        }
        return due.valueOf() <= deadline.valueOf();
      }).length;
      return `- ${user.name}: criadas ${createdInMonth}, concluídas ${concludedCount} (no prazo ${concludedOnTime}), atrasadas ${overdueCount}`;
    });

    // Metas
    const goalsByStatus = goals.reduce<Record<GoalStatus, number>>(
      (acc, goal) => {
        acc[goal.status] = (acc[goal.status] ?? 0) + 1;
        return acc;
      },
      { achieved: 0, onTrack: 0, attention: 0, critical: 0 }
    );
    const goalSummaries = goals.map(goal => {
      const programName = goalPrograms.find(program => program.id === goal.programId)?.name;
      const progress = getGoalProgressPercentage(goal);
      return `- ${goal.title} (${programName ?? 'Programa não identificado'}): status ${
        STATUS_LABELS[goal.status]
      }, progresso ${progress.toFixed(1)}%, valor atual ${goal.currentValue} de ${goal.targetValue}.`;
    });
    const averageGoalProgress =
      goals.length > 0
        ? goals.reduce((acc, goal) => acc + getGoalProgressPercentage(goal), 0) / goals.length
        : 0;

    // Finanças
    const revenueThisMonth = transactions
      .filter(
        transaction =>
          transaction.type === TransactionType.Receita && isInMonth(transaction.date, now)
      )
      .reduce((total, transaction) => total + transaction.value, 0);
    const revenuePrevMonth = transactions
      .filter(
        transaction =>
          transaction.type === TransactionType.Receita && isInMonth(transaction.date, previousMonth)
      )
      .reduce((total, transaction) => total + transaction.value, 0);
    const expenseThisMonth = transactions
      .filter(
        transaction =>
          transaction.type === TransactionType.Despesa && isInMonth(transaction.date, now)
      )
      .reduce((total, transaction) => total + transaction.value, 0);
    const expensePrevMonth = transactions
      .filter(
        transaction =>
          transaction.type === TransactionType.Despesa && isInMonth(transaction.date, previousMonth)
      )
      .reduce((total, transaction) => total + transaction.value, 0);
    const netThisMonth = revenueThisMonth - expenseThisMonth;
    const netPrevMonth = revenuePrevMonth - expensePrevMonth;

    const querySections = [
      `# Relatório estruturado do escritório — ${currentMonthLabel}`,
      '',
      '## Visão geral',
      `- Clientes totais: ${contacts.length}`,
      `- Clientes com interação neste mês: ${describeDelta(newClientsThisMonth, newClientsPrevMonth)}`,
      `- Processos ativos: ${
        lawsuits.filter(lawsuit => lawsuit.status === 'Ativo').length
      } (novos no mês: ${describeDelta(newCasesThisMonth, newCasesPrevMonth)})`,
      '',
      '## Tarefas',
      `- Tarefas criadas no mês (base: data de conclusão prevista): ${describeDelta(
        tasksCreatedThisMonth,
        tasksCreatedPrevMonth
      )}`,
      `- Tarefas concluídas no mês: ${describeDelta(tasksCompletedThisMonth, tasksCompletedPrevMonth)}`,
      `- Total de tarefas concluídas: ${tasksCompleted}`,
      `- Tarefas pendentes: ${tasksPending}`,
      `- Tarefas atrasadas: ${tasksOverdue}`,
      '',
      '### Tarefas por colaborador',
      ...tasksByUser,
      '',
      '## Metas e desempenho',
      `- Metas totais monitoradas: ${goals.length}`,
      `- Média de progresso: ${averageGoalProgress.toFixed(1)}%`,
      `- Distribuição de status: alcançadas ${goalsByStatus.achieved}, no ritmo ${goalsByStatus.onTrack}, atenção ${goalsByStatus.attention}, críticas ${goalsByStatus.critical}`,
      '### Detalhes por meta',
      ...goalSummaries,
      '',
      '## Indicadores financeiros',
      `- Receita do mês: ${describeCurrencyDelta(revenueThisMonth, revenuePrevMonth)}`,
      `- Despesas do mês: ${describeCurrencyDelta(expenseThisMonth, expensePrevMonth)}`,
      `- Resultado líquido: ${describeCurrencyDelta(netThisMonth, netPrevMonth)}`,
      '',
      '## Pontos de atenção sugeridos para IA',
      '- Identificar causas das tarefas atrasadas e sugerir plano de ação.',
      '- Avaliar metas em status Atenção/Crítica e propor iniciativas para recuperação.',
      '- Recomendar ações para converter contatos sem processos em oportunidades.',
      '- Sugerir otimizações financeiras com base em variações de receita e despesas.',
    ];

    return querySections.join('\n');
  }, [contacts, lawsuits, tasks, users, goals, transactions, goalPrograms]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          Laboratório de IA
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-tight">Insights automatizados</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use o prompt abaixo para alimentar modelos de IA com um panorama completo do escritório.
        </p>
      </div>

      <Card className="border border-border/60 shadow-sm dark:border-dark-border/60">
        <CardHeader>
          <CardTitle>Prompt consolidado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Selecione todo o conteúdo do campo (Ctrl+A / Cmd+A) e envie para o motor de IA desejado.
          </p>
          <textarea
            readOnly
            value={query}
            className="h-[440px] w-full resize-none rounded-lg border border-border/60 bg-muted/10 p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/80 dark:text-dark-foreground"
            onFocus={event => event.currentTarget.select()}
            spellCheck={false}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;
