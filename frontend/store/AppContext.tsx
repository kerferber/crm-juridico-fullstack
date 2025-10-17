import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Contact, Lawsuit, Task, KanbanCard, CalendarEvent, Transaction, KanbanColumn, KanbanPhase, TaskStatus, TransactionType } from '../types/types';
import dayjs from 'dayjs';
import { ApiError, apiClient, isUsingMockApi } from '../services/api';
import { useAuth } from './AuthContext';

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

const optionalString = (value: any): string | undefined => {
  const normalized = ensureString(value);
  return normalized ? normalized : undefined;
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
    email: ensureString(raw?.email),
    jobTitle: optionalString(raw?.jobTitle ?? raw?.job_title),
    personalEmail: optionalString(raw?.personalEmail ?? raw?.personal_email),
    phone: optionalString(raw?.phone),
    secondaryPhone: optionalString(raw?.secondaryPhone ?? raw?.secondary_phone),
    whatsapp: optionalString(raw?.whatsapp),
    address: optionalString(raw?.address),
    city: optionalString(raw?.city),
    state: optionalString(raw?.state),
    postalCode: optionalString(raw?.postalCode ?? raw?.postal_code),
    birthdate: optionalString(raw?.birthdate),
    linkedinUrl: optionalString(raw?.linkedinUrl ?? raw?.linkedin_url),
    instagramUrl: optionalString(raw?.instagramUrl ?? raw?.instagram_url),
    bio: optionalString(raw?.bio),
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
  const description = ensureString(raw?.description ?? raw?.notes);
  return {
    id: `lawsuit-${ensureNumber(raw?.id)}`,
    title: ensureString(
      raw?.title ??
        raw?.internalNumber ??
        raw?.internal_number ??
        `Processo #${ensureNumber(raw?.id)}`
    ),
    description: description || undefined,
    column,
    phase: normalizeKanbanPhase(raw?.kanbanPhase ?? raw?.kanban_phase),
    area: ensureString(raw?.area, 'Não definido') as KanbanCard['area'],
    responsibleId: ensureNumber(raw?.responsibleId ?? raw?.responsible_id),
    deadline: deadline || undefined,
    hasAttachments: Boolean(raw?.hasAttachments ?? raw?.has_attachments ?? false),
    commentsCount: ensureNumber(raw?.commentsCount ?? raw?.comments_count, 0),
    hasReminder: Boolean(raw?.hasReminder ?? raw?.has_reminder ?? false),
    isDelayed: deadline ? dayjs(deadline).isBefore(dayjs(), 'day') : false,
  };
};

const mapKanbanCardFromMock = (raw: any): KanbanCard => ({
  id: ensureString(raw?.id),
  title: ensureString(raw?.title),
  description: ensureString(raw?.description) || undefined,
  column: raw?.column ?? KanbanColumn.Prospeccao,
  phase: raw?.phase ?? KanbanPhase.Judicial,
  area: raw?.area ?? 'Não definido',
  responsibleId: ensureNumber(raw?.responsibleId),
  deadline: ensureString(raw?.deadline) || undefined,
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
  updateKanbanCardDetails: (cardId: string, updates: Partial<Omit<KanbanCard, 'id'>>) => Promise<void>;
  updateTaskStatus: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  updateTask: (taskId: number, data: Partial<Omit<Task, 'id'>>) => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }) => Promise<void>;
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
  createCollaborator: (data: {
    name: string;
    email: string;
    password: string;
    avatar?: string;
  }) => Promise<User>;
  updateUserCache: (user: User) => void;
  addLawsuit: (data: {
    internalNumber: string;
    area: Lawsuit['area'];
    phase: string;
    deadline: string;
    status: Lawsuit['status'];
    clientId: number;
    responsibleId: number;
    kanbanColumn: string;
    kanbanPhase: string;
  }) => Promise<Lawsuit>;
  addTransaction: (data: {
    date: string;
    description: string;
    category: string;
    account: string;
    value: number;
    type: TransactionType;
  }) => Promise<Transaction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
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
    let isCancelled = false;

    const resetState = () => {
      setUsers([]);
      setContacts([]);
      setLawsuits([]);
      setTasks([]);
      setKanbanCards([]);
      setCalendarEvents([]);
      setTransactions([]);
      setError(null);
    };

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

        if (isCancelled) return;

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
        if (err instanceof ApiError && (err.status === 401 || err.status === 419)) {
          await logout();
          if (!isCancelled) {
            resetState();
            setError('Sua sessão expirou. Faça login novamente.');
          }
        } else if (!isCancelled) {
          setError('Falha ao carregar os dados do servidor. Verifique sua conexão e autenticação.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (authLoading) {
      return () => {
        isCancelled = true;
      };
    }

    if (!isAuthenticated) {
      resetState();
      setLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, isAuthenticated, logout]);

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

  const updateKanbanCardDetails = async (cardId: string, updates: Partial<Omit<KanbanCard, 'id'>>) => {
    const lawsuitId = extractLawsuitIdFromCard(cardId);
    const hasDeadlineUpdate = Object.prototype.hasOwnProperty.call(updates, 'deadline');
    try {
      if (!isUsingMockApi && lawsuitId) {
        const payload: Record<string, any> = {};

        if (Object.prototype.hasOwnProperty.call(updates, 'responsibleId')) {
          payload.responsible_id = updates.responsibleId ?? null;
        }
        if (updates.area && updates.area !== 'Não definido') {
          payload.area = updates.area;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'title') && updates.title) {
          payload.internal_number = updates.title;
        }
        if (hasDeadlineUpdate) {
          payload.deadline = updates.deadline ? formatDateForApi(updates.deadline) : null;
        }

        if (Object.keys(payload).length > 0) {
          const response = await apiClient.put(`/lawsuits/${lawsuitId}`, payload);
          const mappedLawsuit = mapLawsuitFromApi(response);
          const mappedCard = mapKanbanCardFromLawsuit(mappedLawsuit);

          setLawsuits(prev =>
            prev.map(lawsuit => (lawsuit.id === lawsuitId ? mappedLawsuit : lawsuit))
          );

          setKanbanCards(prev =>
            prev.map(card =>
              card.id === cardId
                ? {
                    ...mappedCard,
                    title: updates.title ?? mappedCard.title,
                    description: updates.description ?? mappedCard.description,
                    area: updates.area ?? mappedCard.area,
                    responsibleId: updates.responsibleId ?? mappedCard.responsibleId,
                    hasAttachments: updates.hasAttachments ?? mappedCard.hasAttachments,
                    hasReminder: updates.hasReminder ?? mappedCard.hasReminder,
                    commentsCount: updates.commentsCount ?? mappedCard.commentsCount,
                    isDelayed: updates.isDelayed ?? mappedCard.isDelayed,
                    deadline: hasDeadlineUpdate ? updates.deadline ?? undefined : mappedCard.deadline,
                  }
                : card
            )
          );
        } else {
          setKanbanCards(prev =>
            prev.map(card =>
              card.id === cardId
                ? {
                    ...card,
                    ...updates,
                  }
                : card
            )
          );
        }
      } else {
        setKanbanCards(prev =>
          prev.map(card =>
            card.id === cardId
              ? {
                  ...card,
                  ...updates,
                }
              : card
          )
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar os detalhes do card.');
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

  const updateTask = async (taskId: number, data: Partial<Omit<Task, 'id'>>) => {
    try {
      if (isUsingMockApi) {
        setTasks(prev =>
          prev.map(task => (task.id === taskId ? { ...task, ...data } : task))
        );
        return;
      }

      const payload: Record<string, any> = {};
      if (Object.prototype.hasOwnProperty.call(data, 'title')) {
        payload.title = data.title;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        payload.status = data.status;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'score')) {
        payload.score = data.score;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
        const dueDate = data.dueDate;
        payload.due_date = dueDate ? formatDateForApi(dueDate) : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'deadline')) {
        const deadline = data.deadline;
        payload.deadline = deadline ? formatDateForApi(deadline) : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'responsibleId')) {
        payload.responsible_id = data.responsibleId;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'lawsuitId')) {
        payload.lawsuit_id = data.lawsuitId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'clientId')) {
        payload.client_id = data.clientId ?? null;
      }

      const response = await apiClient.put(`/tasks/${taskId}`, payload);
      const mapped = mapTaskFromApi(response);
      setTasks(prev => prev.map(task => (task.id === taskId ? mapped : task)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar a tarefa.');
      throw err;
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }) => {
    const computedStatus = taskData.status
      ? taskData.status
      : dayjs(taskData.deadline).isBefore(dayjs(), 'day')
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

      const rawDeadline = cardData.deadline ?? dayjs().add(30, 'day').toISOString();

      const payload = {
        internal_number: `CARD-${Date.now()}`,
        area: cardData.area === 'Não definido' ? 'Cível' : cardData.area,
        phase: 'Inicial',
        deadline: formatDateForApi(rawDeadline),
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
          description: cardData.description ?? mappedCard.description,
          deadline: cardData.deadline ?? mappedCard.deadline,
          hasAttachments: cardData.hasAttachments,
          hasReminder: cardData.hasReminder,
          commentsCount: cardData.commentsCount,
          isDelayed: cardData.isDelayed,
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

  const createCollaborator = async (data: {
    name: string;
    email: string;
    password: string;
    avatar?: string;
  }): Promise<User> => {
    try {
      if (isUsingMockApi) {
        const newUser: User = {
          id: Math.max(...users.map(u => u.id), 0) + 1,
          name: data.name,
          email: data.email,
          avatar: data.avatar ?? avatarFallback(data.name),
          personalEmail: data.email,
        };
        setUsers(prev => [...prev, newUser]);
        setError(null);
        return newUser;
      }

      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: data.avatar,
        personal_email: data.email,
      };

      const created = await apiClient.post('/users', payload);
      const mapped = mapUserFromApi(created);
      setUsers(prev => [...prev, mapped]);
      setError(null);
      return mapped;
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 422) {
        throw err;
      }
      setError('Não foi possível cadastrar o colaborador.');
      throw err;
    }
  };

  const updateUserCache = (userData: User) => {
    setUsers(prev =>
      prev.some(user => user.id === userData.id)
        ? prev.map(user => (user.id === userData.id ? { ...user, ...userData } : user))
        : prev
    );
  };

  const addLawsuit = async (data: {
    internalNumber: string;
    area: Lawsuit['area'];
    phase: string;
    deadline: string;
    status: Lawsuit['status'];
    clientId: number;
    responsibleId: number;
    kanbanColumn: string;
    kanbanPhase: string;
  }): Promise<Lawsuit> => {
    try {
      if (isUsingMockApi) {
        const newItem: Lawsuit = {
          id: Math.max(...lawsuits.map(l => l.id), 0) + 1,
          internalNumber: data.internalNumber,
          area: data.area,
          phase: data.phase,
          deadline: data.deadline,
          status: data.status,
          clientId: data.clientId,
          responsibleId: data.responsibleId,
          kanbanColumn: normalizeKanbanColumn(data.kanbanColumn),
          kanbanPhase: normalizeKanbanPhase(data.kanbanPhase),
        };
        setLawsuits(prev => [...prev, newItem]);
        setKanbanCards(prev => [...prev, mapKanbanCardFromLawsuit(newItem)]);
        setError(null);
        return newItem;
      }

      const payload = {
        internal_number: data.internalNumber,
        area: data.area,
        phase: data.phase,
        deadline: formatDateForApi(data.deadline),
        status: data.status,
        client_id: data.clientId,
        responsible_id: data.responsibleId,
        kanban_column: data.kanbanColumn,
        kanban_phase: data.kanbanPhase,
      };

      const created = await apiClient.post('/lawsuits', payload);
      const mapped = mapLawsuitFromApi(created);
      setLawsuits(prev => [...prev, mapped]);
      setKanbanCards(prev => [...prev, mapKanbanCardFromLawsuit(mapped)]);
      setError(null);
      return mapped;
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar o processo no backend.');
      throw err;
    }
  };

  const addTransaction = async (data: {
    date: string;
    description: string;
    category: string;
    account: string;
    value: number;
    type: TransactionType;
  }): Promise<Transaction> => {
    try {
      if (isUsingMockApi) {
        const newItem: Transaction = {
          id: Math.max(...transactions.map(t => t.id), 0) + 1,
          date: data.date,
          description: data.description,
          category: data.category,
          account: data.account,
          value: data.value,
          type: data.type,
        };
        setTransactions(prev => [...prev, newItem]);
        setError(null);
        return newItem;
      }

      const payload = {
        date: formatDateForApi(data.date),
        description: data.description,
        category: data.category,
        account: data.account,
        value: data.value,
        type: data.type,
      };

      const created = await apiClient.post('/transactions', payload);
      const mapped = mapTransactionFromApi(created);
      setTransactions(prev => [...prev, mapped]);
      setError(null);
      return mapped;
    } catch (err) {
      console.error(err);
      setError('Não foi possível registrar a transação.');
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
    updateKanbanCardDetails,
    updateTaskStatus,
    updateTask,
    addTask,
    addKanbanCard,
    addContact,
    createCollaborator,
    updateUserCache,
    addLawsuit,
    addTransaction,
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
