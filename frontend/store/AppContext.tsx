import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Contact, Lawsuit, Task, KanbanCard, CalendarEvent, Transaction, KanbanColumn, KanbanPhase, TaskStatus, TransactionType } from '../types/types';
import dayjs from 'dayjs';
import { apiClient, isUsingMockApi } from '../services/api';

type ApiCollection<T> = T[] | { data: T[] };

const toArray = <T,>(payload: ApiCollection<T> | null | undefined): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as any).data)) {
    return (payload as any).data;
  }
  return [];
};

const ensureString = (value: any, fallback = ''): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const ensureNumber = (value: any, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const ensureOptionalNumber = (value: any): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const avatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Usuário')}&background=random`;

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatDateForApi = (value: string) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

const normalizeKanbanColumn = (value: any): KanbanColumn => {
  const normalized = removeDiacritics(ensureString(value)).toLowerCase();
  const map: Record<string, KanbanColumn> = {
    'prospeccao': KanbanColumn.Prospeccao,
    'prospecao': KanbanColumn.Prospeccao,
    'prospecção': KanbanColumn.Prospeccao,
    'backlog': KanbanColumn.Prospeccao,
    'analise de documentos': KanbanColumn.AnaliseDocumentos,
    'análise de documentos': KanbanColumn.AnaliseDocumentos,
    'em progresso': KanbanColumn.AnaliseDocumentos,
    'elaboracao da peticao': KanbanColumn.ElaboracaoPeticao,
    'elaboração da petição': KanbanColumn.ElaboracaoPeticao,
    'revisao': KanbanColumn.ElaboracaoPeticao,
    'revisão': KanbanColumn.ElaboracaoPeticao,
    'aguardando julgamento': KanbanColumn.AguardandoJulgamento,
    'finalizados': KanbanColumn.Finalizados,
  };
  return map[normalized] ?? KanbanColumn.Prospeccao;
};

const normalizeKanbanPhase = (value: any): KanbanPhase => {
  const normalized = ensureString(value, KanbanPhase.Judicial).toLowerCase();
  return normalized === KanbanPhase.Extrajudicial.toLowerCase()
    ? KanbanPhase.Extrajudicial
    : KanbanPhase.Judicial;
};

const mapUserFromApi = (raw: any): User => {
  const name = ensureString(raw?.name, 'Usuário');
  return {
    id: ensureNumber(raw?.id),
    name,
    avatar: ensureString(raw?.avatar, avatarFallback(name)),
  };
};

const mapContactFromApi = (raw: any): Contact => ({
  id: ensureNumber(raw?.id),
  name: ensureString(raw?.name),
  document: ensureString(raw?.document),
  origin: ensureString(raw?.origin),
  status: ensureString(raw?.status),
  ownerId: ensureNumber(raw?.ownerId ?? raw?.owner_id),
  lastInteraction: ensureString(raw?.lastInteraction ?? raw?.last_interaction),
  email: ensureString(raw?.email),
  phone: ensureString(raw?.phone),
  profession: ensureString(raw?.profession),
});

const mapLawsuitFromApi = (raw: any): Lawsuit => ({
  id: ensureNumber(raw?.id),
  internalNumber: ensureString(raw?.internalNumber ?? raw?.internal_number),
  clientId: ensureNumber(raw?.clientId ?? raw?.client_id),
  responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
  area: ensureString(raw?.area, 'Cível') as Lawsuit['area'],
  phase: ensureString(raw?.phase),
  deadline: ensureString(raw?.deadline ?? raw?.deadline_at),
  status: ensureString(raw?.status, 'Ativo') as Lawsuit['status'],
  kanbanColumn: normalizeKanbanColumn(raw?.kanbanColumn ?? raw?.kanban_column),
  kanbanPhase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
});

const mapTaskFromApi = (raw: any): Task => ({
  id: ensureNumber(raw?.id),
  title: ensureString(raw?.title),
  status: ensureString(raw?.status, TaskStatus.Pendente) as TaskStatus,
  dueDate: ensureString(raw?.dueDate ?? raw?.due_date ?? raw?.deadline),
  deadline: ensureString(raw?.deadline ?? raw?.due_date ?? raw?.dueDate),
  responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
  lawsuitId: ensureOptionalNumber(raw?.lawsuitId ?? raw?.lawsuit_id),
  clientId: ensureOptionalNumber(raw?.clientId ?? raw?.client_id),
  score: ensureNumber(raw?.score),
});

const mapCalendarEventFromApi = (raw: any): CalendarEvent => ({
  id: ensureNumber(raw?.id),
  title: ensureString(raw?.title),
  start: ensureString(raw?.start),
  end: ensureString(raw?.end ?? raw?.start),
  color: ensureString(raw?.color, '#3B82F6'),
});

const mapTransactionFromApi = (raw: any): Transaction => ({
  id: ensureNumber(raw?.id),
  date: ensureString(raw?.date),
  description: ensureString(raw?.description),
  category: ensureString(raw?.category),
  account: ensureString(raw?.account),
  value: Number.parseFloat(String(raw?.value ?? 0)) || 0,
  type: ensureString(raw?.type, TransactionType.Despesa) as TransactionType,
});

const mapKanbanCardFromLawsuit = (raw: any): KanbanCard => {
  const column = normalizeKanbanColumn(raw?.kanbanColumn ?? raw?.kanban_column);
  const deadline = ensureString(raw?.deadline ?? raw?.deadline_at);
  return {
    id: `lawsuit-${ensureNumber(raw?.id)}`,
    title: ensureString(
      raw?.title ??
        raw?.internalNumber ??
        raw?.internal_number ??
        `Processo #${ensureNumber(raw?.id)}`
    ),
    column,
    phase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
    area: ensureString(raw?.area, 'Não definido') as KanbanCard['area'],
    responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
    hasAttachments: Boolean(raw?.hasAttachments ?? raw?.has_attachments ?? false),
    commentsCount: ensureNumber(raw?.commentsCount ?? raw?.comments_count, 0),
    hasReminder: Boolean(raw?.hasReminder ?? raw?.has_reminder ?? false),
    isDelayed: deadline ? dayjs(deadline).isBefore(dayjs(), 'day') : false,
  };
};

const mapKanbanCardFromMock = (raw: any): KanbanCard => ({
  id: ensureString(raw?.id),
  title: ensureString(raw?.title),
  column: raw?.column ?? KanbanColumn.Prospeccao,
  phase: raw?.phase ?? KanbanPhase.Judicial,
  area: raw?.area ?? 'Não definido',
  responsibleId: ensureNumber(raw?.responsibleId),
  hasAttachments: Boolean(raw?.hasAttachments),
  commentsCount: ensureNumber(raw?.commentsCount, 0),
  hasReminder: Boolean(raw?.hasReminder),
  isDelayed: Boolean(raw?.isDelayed),
});

const extractLawsuitIdFromCard = (cardId: string): number | null => {
  if (!cardId) return null;
  if (cardId.startsWith('lawsuit-')) {
    const parsed = Number(cardId.replace('lawsuit-', ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numeric = Number(cardId);
  return Number.isFinite(numeric) ? numeric : null;
};

interface AppContextType {
  users: User[];
  contacts: Contact[];
  lawsuits: Lawsuit[];
  tasks: Task[];
  kanbanCards: KanbanCard[];
  calendarEvents: CalendarEvent[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  updateKanbanCardColumn: (cardId: string, newColumn: KanbanColumn, newPhase: KanbanPhase) => Promise<void>;
  updateTaskStatus: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'status'>) => Promise<void>;
  addKanbanCard: (cardData: Omit<KanbanCard, 'id'>) => Promise<void>;
  addContact: (contactData: {
    name: string;
    document: string;
    origin: string;
    status: string;
    ownerId: number;
    email: string;
    phone: string;
    profession: string;
    lastInteraction?: string;
  }) => Promise<Contact>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          usersRaw,
          contactsRaw,
          lawsuitsRaw,
          tasksRaw,
          calendarRaw,
          transactionsRaw,
          kanbanRaw,
        ] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/contacts'),
          apiClient.get('/lawsuits'),
          apiClient.get('/tasks'),
          apiClient.get('/calendar-events'),
          apiClient.get('/transactions'),
          isUsingMockApi ? apiClient.get('/kanban-cards') : Promise.resolve(null),
        ]);

        const lawsuitsRawList = toArray<any>(lawsuitsRaw);
        const lawsuitsList = lawsuitsRawList.map(mapLawsuitFromApi);

        setUsers(toArray<any>(usersRaw).map(mapUserFromApi));
        setContacts(toArray<any>(contactsRaw).map(mapContactFromApi));
        setLawsuits(lawsuitsList);
        setTasks(toArray<any>(tasksRaw).map(mapTaskFromApi));
        setCalendarEvents(toArray<any>(calendarRaw).map(mapCalendarEventFromApi));
        setTransactions(toArray<any>(transactionsRaw).map(mapTransactionFromApi));
        setKanbanCards(
          isUsingMockApi
            ? toArray<any>(kanbanRaw).map(mapKanbanCardFromMock)
            : lawsuitsList.map(mapKanbanCardFromLawsuit)
        );
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar os dados do servidor. Verifique sua conexão e autenticação.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateKanbanCardColumn = async (cardId: string, newColumn: KanbanColumn, newPhase: KanbanPhase) => {
    const lawsuitId = extractLawsuitIdFromCard(cardId);
    try {
      if (!isUsingMockApi && lawsuitId) {
        await apiClient.put(`/lawsuits/${lawsuitId}/kanban`, {
          kanban_column: newColumn,
          kanban_phase: newPhase,
        });
      }
      setKanbanCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, column: newColumn, phase: newPhase } : card
        )
      );
      if (lawsuitId) {
        setLawsuits(prev =>
          prev.map(lawsuit =>
            lawsuit.id === lawsuitId
              ? { ...lawsuit, kanbanColumn: newColumn, kanbanPhase: newPhase }
              : lawsuit
          )
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar o card no backend.');
      throw err;
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      let updatedTask: Task | null = null;
      if (!isUsingMockApi) {
        const response = await apiClient.put(`/tasks/${taskId}/status`, { status: newStatus });
        if (response) {
          updatedTask = mapTaskFromApi(response);
        }
      }
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? (updatedTask ?? { ...task, status: newStatus }) : task
        )
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar o status da tarefa no backend.');
      throw err;
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'status'>) => {
    const computedStatus = dayjs(taskData.deadline).isBefore(dayjs(), 'day')
      ? TaskStatus.Atrasada
      : TaskStatus.Pendente;

    try {
      if (isUsingMockApi) {
        const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
        const newTask: Task = {
          ...taskData,
          id: newId,
          status: computedStatus,
        };
        setTasks(prev => [...prev, newTask]);
        return;
      }

      const payload = {
        title: taskData.title,
        score: taskData.score,
        responsible_id: taskData.responsibleId,
        lawsuit_id: taskData.lawsuitId,
        client_id: taskData.clientId,
        due_date: formatDateForApi(taskData.dueDate),
        deadline: formatDateForApi(taskData.deadline),
        status: computedStatus,
      };

      const created = await apiClient.post('/tasks', payload);
      const mapped = mapTaskFromApi(created);
      setTasks(prev => [...prev, mapped]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar a tarefa no backend.');
      throw err;
    }
  };

  const addKanbanCard = async (cardData: Omit<KanbanCard, 'id'>) => {
    try {
      if (isUsingMockApi) {
        const newCard: KanbanCard = {
          ...cardData,
          id: `card-${Date.now()}`
        };
        setKanbanCards(prev => [...prev, newCard]);
        return;
      }

      const defaultClientId = contacts[0]?.id;
      const defaultResponsibleId = users[0]?.id ?? null;

      if (!defaultClientId) {
        throw new Error('Nenhum contato disponível para vincular ao processo.');
      }

      const payload = {
        internal_number: `CARD-${Date.now()}`,
        area: cardData.area === 'Não definido' ? 'Cível' : cardData.area,
        phase: 'Inicial',
        deadline: formatDateForApi(dayjs().add(30, 'day').toISOString()),
        status: 'Ativo',
        client_id: defaultClientId,
        responsible_id: cardData.responsibleId || defaultResponsibleId,
        kanban_column: cardData.column,
        kanban_phase: cardData.phase,
      };

      const created = await apiClient.post('/lawsuits', payload);
      const mappedLawsuit = mapLawsuitFromApi(created);
      const mappedCard = mapKanbanCardFromLawsuit(mappedLawsuit);

      setLawsuits(prev => [...prev, mappedLawsuit]);
      setKanbanCards(prev => [
        ...prev,
        {
          ...mappedCard,
          title: cardData.title || mappedCard.title,
          area: cardData.area,
        },
      ]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar o card no backend.');
      throw err;
    }
  };

  const addContact = async (contactData: {
    name: string;
    document: string;
    origin: string;
    status: string;
    ownerId: number;
    email: string;
    phone: string;
    profession: string;
    lastInteraction?: string;
  }): Promise<Contact> => {
    try {
      if (isUsingMockApi) {
        const newContact: Contact = {
          id: Math.max(...contacts.map(c => c.id), 0) + 1,
          ...contactData,
          lastInteraction: contactData.lastInteraction ?? '',
        };
        setContacts(prev => [...prev, newContact]);
        setError(null);
        return newContact;
      }

      const payload = {
        name: contactData.name,
        document: contactData.document,
        origin: contactData.origin,
        status: contactData.status,
        owner_id: contactData.ownerId,
        email: contactData.email,
        phone: contactData.phone,
        profession: contactData.profession,
        last_interaction: contactData.lastInteraction ? formatDateForApi(contactData.lastInteraction) : null,
      };

      const created = await apiClient.post('/contacts', payload);
      const mapped = mapContactFromApi(created);
      setContacts(prev => [...prev, mapped]);
      setError(null);
      return mapped;
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar o contato no backend.');
      throw err;
    }
  };

  const value = {
    users,
    contacts,
    lawsuits,
    tasks,
    kanbanCards,
    calendarEvents,
    transactions,
    loading,
    error,
    updateKanbanCardColumn,
    updateTaskStatus,
    addTask,
    addKanbanCard,
    addContact,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
