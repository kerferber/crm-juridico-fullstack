import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { User, Task, Lawsuit, Level, Badge, TaskStatus } from '../types/types';
import { LEVELS, BADGES } from '../data/seed';

dayjs.locale('pt-br');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date, format = 'DD/MM/YYYY') => {
  return dayjs(date).format(format);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDocument = (doc: string) => {
  if (doc.length === 11) {
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (doc.length === 14) {
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
};

// Centralized gamification logic
export const getGamificationData = (user: User, tasks: Task[], lawsuits: Lawsuit[]) => {
    const completedTasks = tasks.filter(t => t.responsibleId === user.id && t.status === TaskStatus.Concluida);
    const score = completedTasks.reduce((acc, task) => acc + task.score, 0);

    const level = [...LEVELS].reverse().find(l => score >= l.pointsRequired) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.pointsRequired > score);
    
    const progressPercentage = nextLevel 
        ? ((score - level.pointsRequired) / (nextLevel.pointsRequired - level.pointsRequired)) * 100
        : 100;

    const earnedBadges = BADGES.filter(badge => {
        let current = 0;
        if (badge.type === 'score') {
            current = score;
        } else if (badge.type === 'tasks') {
            current = completedTasks.length;
        } else if (badge.type === 'area') {
            current = completedTasks.filter(t => {
                const l = lawsuits.find(lw => lw.id === t.lawsuitId);
                return l && l.area === badge.area;
            }).length;
        }
        return current >= badge.threshold;
    });

    return { completedTasks, score, level, nextLevel, progressPercentage, earnedBadges };
};
