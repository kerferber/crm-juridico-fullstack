import { User, Contact, Lawsuit, Task, KanbanCard, CalendarEvent, Transaction, TaskStatus, KanbanColumn, KanbanPhase, TransactionType, Level, Badge } from '../types/types';
import { Award, Star, Target, Scale, Shield, Landmark, Check } from 'lucide-react';
import dayjs from 'dayjs';

export const USERS: User[] = [
    { id: 1, name: 'Carlos Ferreira', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { id: 2, name: 'Sofia Ribeiro', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
    { id: 3, name: 'Miguel Almeida', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
];

export const CONTACTS: Contact[] = [
    { id: 1, name: 'Empresa Alpha Ltda', document: '12345678000190', origin: 'Indicação', status: 'Cliente', ownerId: 1, lastInteraction: '2025-10-10', email: 'contato@alpha.com', phone: '(11) 98765-4321', profession: 'Indústria' },
    { id: 2, name: 'Beatriz Costa', document: '12345678901', origin: 'Website', status: 'Lead', ownerId: 2, lastInteraction: '2025-10-12', email: 'beatriz.costa@example.com', phone: '(21) 91234-5678', profession: 'Designer' },
    { id: 3, name: 'Ricardo Neves', document: '98765432109', origin: 'Feira de Negócios', status: 'Cliente', ownerId: 1, lastInteraction: '2025-09-28', email: 'ricardo.neves@example.com', phone: '(31) 95555-4444', profession: 'Engenheiro' },
];

export const LAWSUITS: Lawsuit[] = [
    { id: 1, internalNumber: '2025/001-CIV', clientId: 1, responsibleId: 1, area: 'Cível', phase: 'Inicial', deadline: '2025-11-20', status: 'Ativo' },
    { id: 2, internalNumber: '2025/002-TRAB', clientId: 2, responsibleId: 2, area: 'Trabalhista', phase: 'Recursal', deadline: '2025-10-30', status: 'Ativo' },
    { id: 3, internalNumber: '2024/058-PREV', clientId: 3, responsibleId: 1, area: 'Previdenciário', phase: 'Execução', deadline: '2025-01-15', status: 'Fechado' },
];

export const TASKS: Task[] = [
    { id: 1, title: 'Elaborar petição inicial para 2025/001-CIV', status: TaskStatus.Pendente, dueDate: '2025-10-18', deadline: '2025-10-25', responsibleId: 1, lawsuitId: 1, score: 50 },
    { id: 2, title: 'Analisar documentos do caso Beatriz Costa', status: TaskStatus.Concluida, dueDate: '2025-10-10', deadline: '2025-10-12', responsibleId: 2, lawsuitId: 2, clientId: 2, score: 30 },
    { id: 3, title: 'Agendar reunião com Empresa Alpha', status: TaskStatus.Pendente, dueDate: '2025-10-15', deadline: '2025-10-16', responsibleId: 1, clientId: 1, score: 10 },
    { id: 4, title: 'Preparar recurso de apelação para 2025/002-TRAB', status: TaskStatus.Atrasada, dueDate: '2025-10-13', deadline: '2025-10-12', responsibleId: 2, lawsuitId: 2, score: 60 },
    { id: 5, title: 'Calcular liquidação de sentença 2024/058-PREV', status: TaskStatus.Concluida, dueDate: '2025-09-20', deadline: '2025-09-25', responsibleId: 1, lawsuitId: 3, score: 40 },
];

export const KANBAN_CARDS: KanbanCard[] = [
    { id: 'card-1', title: 'Processo #1 - Empresa Alpha', column: KanbanColumn.ElaboracaoPeticao, phase: KanbanPhase.Judicial, area: 'Cível', responsibleId: 1, hasAttachments: true, commentsCount: 2, hasReminder: true, isDelayed: false },
    { id: 'card-2', title: 'Caso Beatriz Costa', column: KanbanColumn.AnaliseDocumentos, phase: KanbanPhase.Judicial, area: 'Trabalhista', responsibleId: 2, hasAttachments: true, commentsCount: 0, hasReminder: false, isDelayed: true },
    { id: 'card-3', title: 'Acordo Extrajudicial - XYZ Corp', column: KanbanColumn.Prospeccao, phase: KanbanPhase.Extrajudicial, area: 'Não definido', responsibleId: 3, hasAttachments: false, commentsCount: 0, hasReminder: false, isDelayed: false },
    { id: 'card-4', title: 'Processo #3 - Ricardo Neves', column: KanbanColumn.Finalizados, phase: KanbanPhase.Judicial, area: 'Previdenciário', responsibleId: 1, hasAttachments: true, commentsCount: 5, hasReminder: false, isDelayed: false },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
    { id: 1, title: 'Audiência - Proc. 2025/002-TRAB', start: '2025-10-14T10:00:00', end: '2025-10-14T11:00:00', color: '#10B981' },
    { id: 2, title: 'Reunião com Empresa Alpha', start: '2025-10-16T15:00:00', end: '2025-10-16T16:00:00', color: '#3B82F6' },
    { id: 3, title: 'Prazo: Petição Inicial 2025/001-CIV', start: '2025-10-25', end: '2025-10-25', color: '#EF4444' },
];

export const TRANSACTIONS: Transaction[] = [
    { id: 1, date: '2025-10-01', description: 'Honorários - Empresa Alpha', category: 'Honorários', account: 'Conta Principal', value: 5000, type: TransactionType.Receita },
    { id: 2, date: '2025-10-05', description: 'Aluguel do escritório', category: 'Despesas Fixas', account: 'Conta Principal', value: 2500, type: TransactionType.Despesa },
    { id: 3, date: '2025-10-10', description: 'Pagamento de custas - Proc. 2025/002-TRAB', category: 'Custas Processuais', account: 'Conta Principal', value: 350, type: TransactionType.Despesa },
    { id: 4, date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), description: 'Adiantamento - Ricardo Neves', category: 'Honorários', account: 'Conta Principal', value: 2000, type: TransactionType.Receita },
];

export const LEVELS: Level[] = [
    { level: 1, name: 'Estagiário', pointsRequired: 0 },
    { level: 2, name: 'Advogado Júnior', pointsRequired: 100 },
    { level: 3, name: 'Advogado Pleno', pointsRequired: 500 },
    { level: 4, name: 'Advogado Sênior', pointsRequired: 1500 },
    { level: 5, name: 'Sócio', pointsRequired: 5000 },
];

export const BADGES: Badge[] = [
    { id: 'score-1', name: 'Pontuador Iniciante', description: 'Acumule 100 pontos', icon: Star, type: 'score', threshold: 100 },
    { id: 'score-2', name: 'Mestre dos Pontos', description: 'Acumule 1000 pontos', icon: Award, type: 'score', threshold: 1000 },
    { id: 'tasks-1', name: 'Finalizador', description: 'Conclua 10 tarefas', icon: Check, type: 'tasks', threshold: 10 },
    { id: 'tasks-2', name: 'Super Produtivo', description: 'Conclua 50 tarefas', icon: Target, type: 'tasks', threshold: 50 },
    { id: 'area-1', name: 'Especialista Cível', description: 'Conclua 5 tarefas da área Cível', icon: Scale, type: 'area', threshold: 5, area: 'Cível' },
    { id: 'area-2', name: 'Defensor Trabalhista', description: 'Conclua 5 tarefas da área Trabalhista', icon: Shield, type: 'area', threshold: 5, area: 'Trabalhista' },
    { id: 'area-3', name: 'Mestre Previdenciário', description: 'Conclua 5 tarefas da área Previdenciário', icon: Landmark, type: 'area', threshold: 5, area: 'Previdenciário' },
];
