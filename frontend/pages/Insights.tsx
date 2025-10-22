import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { getGoalProgressPercentage } from '../lib/goal-utils';
import { formatCurrency } from '../lib/utils';
import { TaskStatus, TransactionType, GoalStatus, User, Contact, GoalProgram } from '../types/types';
import { apiClient, ApiError } from '../services/api';

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

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface AiSettingsResponse {
  model?: string | null;
  openai_key?: string | null;
  prompt?: string | null;
}

type AiSettings = {
  model: string;
  openaiKey: string;
  prompt: string;
};

const Insights: React.FC = () => {
  const { contacts, lawsuits, tasks, users, goals, transactions, goalPrograms } = useApp();
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAiSettings = async () => {
      setAiLoading(true);
      try {
        const response = await apiClient.get<AiSettingsResponse>('ai-settings');
        if (!active) {
          return;
        }
        const normalized: AiSettings = {
          model: typeof response?.model === 'string' ? response.model : '',
          openaiKey: typeof response?.openai_key === 'string' ? response.openai_key : '',
          prompt: typeof response?.prompt === 'string' ? response.prompt : '',
        };
        setAiSettings(normalized);
        setAiError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        if (err instanceof ApiError) {
          setAiError(err.message || 'Falha ao carregar as configurações de IA.');
        } else {
          setAiError('Não foi possível carregar as configurações de IA.');
        }
        setAiSettings(null);
      } finally {
        if (active) {
          setAiLoading(false);
        }
      }
    };

    loadAiSettings();

    return () => {
      active = false;
    };
  }, []);

  const isAiConfigured = Boolean(aiSettings?.model && aiSettings?.openaiKey && aiSettings?.prompt);

  const query = useMemo(() => {
    const now = dayjs();
    const currentMonthLabel = now.format('MMMM YYYY');
    const previousMonth = now.subtract(1, 'month');
    const upcomingTasksWindow = now.add(7, 'day');
    const upcomingLawsuitWindow = now.add(30, 'day');

    const usersById = new Map<number, User>();
    users.forEach(user => usersById.set(user.id, user));

    const contactsById = new Map<number, Contact>();
    contacts.forEach(contact => contactsById.set(contact.id, contact));

    const programsById = new Map<string, GoalProgram>();
    goalPrograms.forEach(program => programsById.set(program.id, program));

    const formatUserLabel = (userId?: number) => {
      if (typeof userId === 'number') {
        const user = usersById.get(userId);
        if (user) {
          return `${user.name} (ID: ${user.id})`;
        }
        return `Usuário não identificado (ID: ${userId})`;
      }
      return 'Usuário não identificado';
    };

    const formatDateLabel = (value?: string | null) => {
      if (!value) {
        return 'sem data informada';
      }
      const parsed = dayjs(value);
      if (!parsed.isValid()) {
        return 'sem data válida';
      }
      return parsed.format('DD/MM/YYYY');
    };

    const numericSortValue = (value?: string | null) => {
      if (!value) {
        return Number.POSITIVE_INFINITY;
      }
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed.valueOf() : Number.POSITIVE_INFINITY;
    };

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
      return `- ${formatUserLabel(user.id)}: criadas ${createdInMonth}, concluídas ${concludedCount} (no prazo ${concludedOnTime}), atrasadas ${overdueCount}`;
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

    const overdueTasksHighlights = tasks
      .filter(task => task.status === TaskStatus.Atrasada)
      .sort((a, b) => numericSortValue(a.deadline) - numericSortValue(b.deadline))
      .slice(0, 10)
      .map(task => {
        const lawsuitRef = task.lawsuitId ? `, processo ID ${task.lawsuitId}` : '';
        const clientRef = task.clientId ? `, cliente ID ${task.clientId}` : '';
        return `  - [ID ${task.id}] ${task.title} — responsável ${formatUserLabel(task.responsibleId)}${lawsuitRef}${clientRef}, prazo legal ${formatDateLabel(task.deadline)}, conclusão prevista ${formatDateLabel(task.dueDate)}, status ${task.status}, score ${task.score}`;
      });

    const upcomingTasksHighlights = tasks
      .filter(task => {
        const due = dayjs(task.dueDate);
        if (!due.isValid()) {
          return false;
        }
        return due.isAfter(now) && due.isBefore(upcomingTasksWindow);
      })
      .sort((a, b) => numericSortValue(a.dueDate) - numericSortValue(b.dueDate))
      .slice(0, 10)
      .map(task => {
        const lawsuitRef = task.lawsuitId ? `, processo ID ${task.lawsuitId}` : '';
        const clientRef = task.clientId ? `, cliente ID ${task.clientId}` : '';
        return `  - [ID ${task.id}] ${task.title} — responsável ${formatUserLabel(task.responsibleId)}${lawsuitRef}${clientRef}, conclusão prevista ${formatDateLabel(task.dueDate)}, prazo legal ${formatDateLabel(task.deadline)}, status ${task.status}, score ${task.score}`;
      });

    const tasksWithoutResponsible = tasks
      .filter(task => !usersById.has(task.responsibleId))
      .map(task => `  - [ID ${task.id}] ${task.title} — responsável não identificado, status ${task.status}, conclusão prevista ${formatDateLabel(task.dueDate)}, prazo legal ${formatDateLabel(task.deadline)}, score ${task.score}`);

    const contactsByStatusEntries = (Object.entries(
      contacts.reduce<Record<string, number>>((acc, contact) => {
        const key = contact.status || 'Sem status';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const contactsByOriginEntries = (Object.entries(
      contacts.reduce<Record<string, number>>((acc, contact) => {
        const key = contact.origin || 'Sem origem';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const contactsByOwner = users.map(user => {
      const ownedContacts = contacts.filter(contact => contact.ownerId === user.id);
      return `  - ${formatUserLabel(user.id)}: ${ownedContacts.length} contatos ativos`;
    });

    const recentContactsHighlights = contacts
      .filter(contact => dayjs(contact.lastInteraction).isValid())
      .sort((a, b) => dayjs(b.lastInteraction).valueOf() - dayjs(a.lastInteraction).valueOf())
      .slice(0, 10)
      .map(contact => `  - [ID ${contact.id}] ${contact.name} — status ${contact.status}, origem ${contact.origin}, profissão ${contact.profession}, última interação ${formatDateLabel(contact.lastInteraction)}, responsável ${formatUserLabel(contact.ownerId)}`);

    const lawsuitsByStatusEntries = (Object.entries(
      lawsuits.reduce<Record<string, number>>((acc, lawsuit) => {
        const key = lawsuit.status || 'Sem status';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const lawsuitsByPhaseEntries = (Object.entries(
      lawsuits.reduce<Record<string, number>>((acc, lawsuit) => {
        const key = lawsuit.phase || 'Sem fase';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const lawsuitsByAreaEntries = (Object.entries(
      lawsuits.reduce<Record<string, number>>((acc, lawsuit) => {
        const key = lawsuit.area || 'Sem área';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const lawsuitsByResponsible = users.map(user => {
      const userLawsuits = lawsuits.filter(lawsuit => lawsuit.responsibleId === user.id);
      const activeCount = userLawsuits.filter(lawsuit => lawsuit.status === 'Ativo').length;
      return `  - ${formatUserLabel(user.id)}: ${userLawsuits.length} processos (${activeCount} ativos)`;
    });

    const lawsuitsUpcomingDeadlines = lawsuits
      .filter(lawsuit => {
        const deadline = dayjs(lawsuit.deadline);
        return (
          lawsuit.status === 'Ativo' &&
          deadline.isValid() &&
          deadline.isAfter(now) &&
          deadline.isBefore(upcomingLawsuitWindow)
        );
      })
      .sort((a, b) => numericSortValue(a.deadline) - numericSortValue(b.deadline))
      .slice(0, 10)
      .map(lawsuit => {
        const client = contactsById.get(lawsuit.clientId);
        const clientLabel = client
          ? `${client.name} (ID: ${client.id})`
          : `Cliente não identificado (ID: ${lawsuit.clientId})`;
        const reference = lawsuit.internalNumber ? ` ${lawsuit.internalNumber}` : '';
        return `  - [ID ${lawsuit.id}]${reference} — cliente ${clientLabel}, responsável ${formatUserLabel(lawsuit.responsibleId)}, fase ${lawsuit.phase}, área ${lawsuit.area}, prazo ${formatDateLabel(lawsuit.deadline)}, status ${lawsuit.status}`;
      });

    const totalRevenue = transactions
      .filter(transaction => transaction.type === TransactionType.Receita)
      .reduce((total, transaction) => total + transaction.value, 0);
    const totalExpense = transactions
      .filter(transaction => transaction.type === TransactionType.Despesa)
      .reduce((total, transaction) => total + transaction.value, 0);
    const totalNet = totalRevenue - totalExpense;

    const revenueByCategoryEntries = (Object.entries(
      transactions
        .filter(transaction => transaction.type === TransactionType.Receita)
        .reduce<Record<string, number>>((acc, transaction) => {
          const key = transaction.category || 'Sem categoria';
          acc[key] = (acc[key] ?? 0) + transaction.value;
          return acc;
        }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const expenseByCategoryEntries = (Object.entries(
      transactions
        .filter(transaction => transaction.type === TransactionType.Despesa)
        .reduce<Record<string, number>>((acc, transaction) => {
          const key = transaction.category || 'Sem categoria';
          acc[key] = (acc[key] ?? 0) + transaction.value;
          return acc;
        }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const balanceByAccountEntries = (Object.entries(
      transactions.reduce<Record<string, number>>((acc, transaction) => {
        const key = transaction.account || 'Conta não informada';
        const sign = transaction.type === TransactionType.Receita ? 1 : -1;
        acc[key] = (acc[key] ?? 0) + transaction.value * sign;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

    const averageTransactionValue =
      transactions.length > 0
        ? transactions.reduce((total, transaction) => total + transaction.value, 0) / transactions.length
        : 0;

    const revenueTransactions = transactions.filter(transaction => transaction.type === TransactionType.Receita);
    const averageRevenueTicket =
      revenueTransactions.length > 0
        ? revenueTransactions.reduce((total, transaction) => total + transaction.value, 0) / revenueTransactions.length
        : 0;

    const goalsByProgramEntries = (Object.entries(
      goals.reduce<Record<string, number>>((acc, goal) => {
        const program = programsById.get(goal.programId);
        const key = program?.name ?? 'Programa não identificado';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ) as Array<[string, number]>).sort(([, a], [, b]) => b - a);

    const criticalGoals = goals.filter(goal => goal.status === 'attention' || goal.status === 'critical');
    const goalsEndingSoon = goals.filter(goal => {
      const end = dayjs(goal.endDate);
      return end.isValid() && end.isAfter(now) && end.isBefore(upcomingLawsuitWindow);
    });

    const goalOwnerLabel = (ownerType: string, ownerId?: number | string) => {
      if (ownerType === 'user' && typeof ownerId === 'number') {
        return formatUserLabel(ownerId);
      }
      if (ownerId !== undefined && ownerId !== null) {
        return `${ownerType} ${ownerId}`;
      }
      return 'Responsável não definido';
    };

    const criticalGoalDetails = criticalGoals.map(goal => {
      const program = programsById.get(goal.programId);
      const progress = getGoalProgressPercentage(goal);
      return `  - [ID ${goal.id}] ${goal.title} (${program?.name ?? 'Programa não identificado'}) — status ${STATUS_LABELS[goal.status]}, progresso ${progress.toFixed(1)}%, responsável ${goalOwnerLabel(goal.ownerType, goal.ownerId)}, meta ${goal.currentValue} de ${goal.targetValue}, término ${formatDateLabel(goal.endDate)}`;
    });

    const goalsEndingSoonDetails = goalsEndingSoon.map(goal => {
      const program = programsById.get(goal.programId);
      const progress = getGoalProgressPercentage(goal);
      return `  - [ID ${goal.id}] ${goal.title} (${program?.name ?? 'Programa não identificado'}) — termina em ${formatDateLabel(goal.endDate)}, progresso ${progress.toFixed(1)}%, responsável ${goalOwnerLabel(goal.ownerType, goal.ownerId)}`;
    });

    const contactStatusLine =
      contactsByStatusEntries.length > 0
        ? contactsByStatusEntries.map(([status, count]) => `${status}: ${count}`).join(', ')
        : 'Nenhum contato registrado.';

    const contactOriginLine =
      contactsByOriginEntries.length > 0
        ? contactsByOriginEntries.map(([origin, count]) => `${origin}: ${count}`).join(', ')
        : 'Nenhuma origem registrada.';

    const lawsuitStatusLine =
      lawsuitsByStatusEntries.length > 0
        ? lawsuitsByStatusEntries.map(([status, count]) => `${status}: ${count}`).join(', ')
        : 'Nenhum processo cadastrado.';

    const lawsuitPhaseLine =
      lawsuitsByPhaseEntries.length > 0
        ? lawsuitsByPhaseEntries.map(([phase, count]) => `${phase}: ${count}`).join(', ')
        : 'Nenhuma fase registrada.';

    const lawsuitAreaLine =
      lawsuitsByAreaEntries.length > 0
        ? lawsuitsByAreaEntries.map(([area, count]) => `${area}: ${count}`).join(', ')
        : 'Nenhuma área registrada.';

    const revenueByCategoryLines =
      revenueByCategoryEntries.length > 0
        ? revenueByCategoryEntries.map(
            ([category, value]) => `  - ${category}: ${formatCurrency(value)}`
          )
        : ['  - Nenhuma receita registrada.'];

    const expenseByCategoryLines =
      expenseByCategoryEntries.length > 0
        ? expenseByCategoryEntries.map(
            ([category, value]) => `  - ${category}: ${formatCurrency(value)}`
          )
        : ['  - Nenhuma despesa registrada.'];

    const balanceByAccountLines =
      balanceByAccountEntries.length > 0
        ? balanceByAccountEntries.map(([account, value]) => {
            const formatted = formatCurrency(Math.abs(value));
            const prefix = value >= 0 ? '+' : '-';
            return `  - ${account}: ${prefix}${formatted}`;
          })
        : ['  - Nenhum movimento financeiro registrado.'];

    const goalsByProgramLine =
      goalsByProgramEntries.length > 0
        ? goalsByProgramEntries.map(([program, count]) => `${program}: ${count}`).join(', ')
        : 'Nenhuma meta cadastrada.';

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

    querySections.push(
      '',
      '## Detalhamento adicional de tarefas',
      overdueTasksHighlights.length
        ? '- Tarefas em atraso mais críticas:'
        : '- Nenhuma tarefa em atraso registrada.'
    );
    if (overdueTasksHighlights.length) {
      querySections.push(...overdueTasksHighlights);
    }
    querySections.push(
      upcomingTasksHighlights.length
        ? '- Próximas tarefas com conclusão prevista em 7 dias:'
        : '- Nenhuma tarefa com conclusão prevista em 7 dias.'
    );
    if (upcomingTasksHighlights.length) {
      querySections.push(...upcomingTasksHighlights);
    }
    if (tasksWithoutResponsible.length) {
      querySections.push('- Tarefas sem responsável associado:');
      querySections.push(...tasksWithoutResponsible);
    }

    querySections.push(
      '',
      '## Clientes e relacionamento',
      `- Distribuição por status: ${contactStatusLine}`,
      `- Distribuição por origem: ${contactOriginLine}`
    );
    querySections.push('- Contatos por responsável:');
    querySections.push(...contactsByOwner);
    if (recentContactsHighlights.length) {
      querySections.push('- Últimas interações registradas:');
      querySections.push(...recentContactsHighlights);
    }

    querySections.push(
      '',
      '## Processos e prazos',
      `- Distribuição por status: ${lawsuitStatusLine}`,
      `- Distribuição por fase: ${lawsuitPhaseLine}`,
      `- Distribuição por área: ${lawsuitAreaLine}`
    );
    querySections.push('- Processos por responsável:');
    querySections.push(...lawsuitsByResponsible);
    if (lawsuitsUpcomingDeadlines.length) {
      querySections.push('- Prazos de processos nos próximos 30 dias:');
      querySections.push(...lawsuitsUpcomingDeadlines);
    }

    querySections.push(
      '',
      '## Detalhamento financeiro',
      `- Receita acumulada: ${formatCurrency(totalRevenue)}`,
      `- Despesa acumulada: ${formatCurrency(totalExpense)}`,
      `- Resultado acumulado: ${formatCurrency(totalNet)}`,
      `- Ticket médio geral: ${formatCurrency(averageTransactionValue)}`,
      `- Ticket médio de receita: ${formatCurrency(averageRevenueTicket)}`
    );
    querySections.push('- Receita por categoria:');
    querySections.push(...revenueByCategoryLines);
    querySections.push('- Despesa por categoria:');
    querySections.push(...expenseByCategoryLines);
    querySections.push('- Saldo por conta:');
    querySections.push(...balanceByAccountLines);

    querySections.push(
      '',
      '## Metas prioritárias e programas',
      `- Distribuição de metas por programa: ${goalsByProgramLine}`
    );
    if (criticalGoalDetails.length) {
      querySections.push('- Metas em atenção/críticas:');
      querySections.push(...criticalGoalDetails);
    }
    if (goalsEndingSoonDetails.length) {
      querySections.push('- Metas com término nos próximos 30 dias:');
      querySections.push(...goalsEndingSoonDetails);
    }

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

      <Card className="border border-border/60 shadow-sm dark:border-dark-border/60">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Gerar insights com OpenAI</CardTitle>
          <Button
            type="button"
            onClick={async () => {
              setGenerationError(null);
              setInsights(null);
              if (!isAiConfigured || !aiSettings) {
                setGenerationError(
                  'Configure o modelo, a chave da OpenAI e o prompt no painel administrativo antes de gerar insights.'
                );
                return;
              }

              setGenerating(true);
              try {
                const basePrompt = aiSettings.prompt.trim();
                const promptToSend = basePrompt ? `${basePrompt}\n\n${query}` : query;

                const response = await fetch(OPENAI_API_URL, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${aiSettings.openaiKey}`,
                  },
                  body: JSON.stringify({
                    model: aiSettings.model,
                    messages: [{ role: 'user', content: promptToSend }],
                  }),
                });

                if (!response.ok) {
                  const errorPayload = await response.json().catch(() => ({}));
                  throw new Error(errorPayload?.error?.message ?? 'Falha ao gerar insights.');
                }

                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content?.trim();
                if (!content) {
                  throw new Error('Resposta inesperada da OpenAI.');
                }
                setInsights(content);
              } catch (err) {
                if (err instanceof Error) {
                  setGenerationError(err.message);
                } else {
                  setGenerationError('Não foi possível obter insights agora.');
                }
              } finally {
                setGenerating(false);
              }
            }}
            disabled={generating || !isAiConfigured || aiLoading}
            className="w-full sm:w-auto"
          >
            {generating ? 'Gerando...' : 'Gerar insights'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {aiError}
            </p>
          )}
          {!aiError && !aiLoading && !isAiConfigured && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              As configurações de IA deste workspace ainda não estão completas. Defina o modelo, a chave e o prompt no painel administrativo.
            </p>
          )}
          {aiLoading && !aiError && (
            <p className="text-sm text-muted-foreground">
              Carregando configurações de IA...
            </p>
          )}
          {generating && (
            <p className="text-sm text-muted-foreground">
              Consultando o modelo {aiSettings?.model ?? 'de IA'}... aguarde alguns instantes.
            </p>
          )}
          {generationError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {generationError}
            </p>
          )}
          {insights && (
            <textarea
              readOnly
              value={insights}
              className="h-[320px] w-full resize-none rounded-lg border border-border/60 bg-muted/10 p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/80 dark:text-dark-foreground"
            />
          )}
          {!generating && !generationError && !insights && (
            <p className="text-xs text-muted-foreground">
              Clique em “Gerar insights” para obter recomendações automáticas diretamente aqui no painel.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;
