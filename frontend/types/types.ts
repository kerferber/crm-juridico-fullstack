import { LucideIcon } from 'lucide-react';

export enum TaskStatus {
  Pendente = 'Pendente',
  Concluida = 'Concluída',
  Atrasada = 'Atrasada',
}

export enum KanbanColumn {
  Prospeccao = 'Prospecção',
  AnaliseDocumentos = 'Análise de Documentos',
  ElaboracaoPeticao = 'Elaboração da Petição',
  AguardandoJulgamento = 'Aguardando Julgamento',
  Finalizados = 'Finalizados',
}

export enum KanbanPhase {
  Judicial = 'Judicial',
  Extrajudicial = 'Extrajudicial',
}

export enum TransactionType {
    Receita = 'Receita',
    Despesa = 'Despesa',
}

export interface User {
  id: number;
  name: string;
  avatar: string;
}

export interface Contact {
  id: number;
  name: string;
  document: string;
  origin: string;
  status: string;
  ownerId: number;
  lastInteraction: string;
  email: string;
  phone: string;
  profession: string;
}

export interface Lawsuit {
  id: number;
  internalNumber: string;
  clientId: number;
  responsibleId: number;
  area: 'Cível' | 'Trabalhista' | 'Previdenciário';
  phase: string;
  deadline: string;
  status: 'Ativo' | 'Fechado' | 'Arquivado';
  kanbanColumn?: KanbanColumn;
  kanbanPhase?: KanbanPhase;
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  dueDate: string;
  deadline: string;
  responsibleId: number;
  lawsuitId?: number;
  clientId?: number;
  score: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  column: KanbanColumn;
  phase: KanbanPhase;
  area: 'Cível' | 'Trabalhista' | 'Previdenciário' | 'Não definido';
  responsibleId: number;
  deadline?: string;
  hasAttachments: boolean;
  commentsCount: number;
  hasReminder: boolean;
  isDelayed: boolean;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
}

export interface Transaction {
    id: number;
    date: string;
    description: string;
    category: string;
    account: string;
    value: number;
    type: TransactionType;
}

export interface TimelineEvent {
  date: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export interface Level {
    level: number;
    name: string;
    pointsRequired: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    type: 'score' | 'tasks' | 'area';
    threshold: number;
    area?: 'Cível' | 'Trabalhista' | 'Previdenciário';
}
