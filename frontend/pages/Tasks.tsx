
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Plus, Check, AlertTriangle, Clock } from 'lucide-react';
import { Task, TaskStatus } from '../types/types';
import { cn } from '../lib/utils';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Link } from 'react-router-dom';
import { useTaskModal } from '../hooks/useTaskModal';

dayjs.extend(isBetween);

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const { users, lawsuits, contacts } = useApp();
    const responsible = users.find(u => u.id === task.responsibleId);
    const relatedLawsuit = lawsuits.find(l => l.id === task.lawsuitId);
    const relatedContact = contacts.find(c => c.id === task.clientId);

    const getStatusIcon = () => {
        switch (task.status) {
            case TaskStatus.Concluida: return <Check className="h-4 w-4 text-green-500" />;
            case TaskStatus.Atrasada: return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    return (
        <div className="flex items-start justify-between rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm shadow-primary/5 transition hover:border-primary/50 dark:border-dark-border/60 dark:bg-dark-card/70">
            <div className="flex items-start gap-4">
                <span className="mt-1 shrink-0 rounded-full bg-white/80 p-2 shadow-inner dark:bg-dark-border/60">
                    {getStatusIcon()}
                </span>
                <div>
                    <p className="font-semibold text-foreground dark:text-dark-foreground">{task.title}</p>
                    <div className="text-xs text-muted-foreground space-x-2">
                        {relatedLawsuit && <Link to={`/processos/${relatedLawsuit.id}`} className="hover:underline">Processo: {relatedLawsuit.internalNumber}</Link>}
                        {relatedContact && <Link to={`/contatos/${relatedContact.id}`} className="hover:underline">Contato: {relatedContact.name}</Link>}
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-right">
                <div className="w-24 text-right">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/80">Prazo</p>
                    <p className={cn("text-sm font-semibold", dayjs(task.deadline).isBefore(dayjs(), 'day') && task.status !== TaskStatus.Concluida ? 'text-rose-500' : 'text-muted-foreground')}>
                        {formatDate(task.deadline)}
                    </p>
                </div>
                {responsible && (
                    <div className="flex items-center space-x-2">
                        <img src={responsible.avatar} alt={responsible.name} className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-700" title={responsible.name} />
                    </div>
                )}
            </div>
        </div>
    );
};


const Tasks: React.FC = () => {
    const { tasks } = useApp();
    const { open: openTaskModal } = useTaskModal();
    const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
    
    const myTasks = tasks.filter(t => t.responsibleId === 1); // Hardcoded current user

    const filteredTasks = useMemo(() => {
        const today = dayjs();
        switch (activeTab) {
            case 'today':
                return myTasks.filter(t => dayjs(t.dueDate).isSame(today, 'day'));
            case 'week':
                return myTasks.filter(t => dayjs(t.dueDate).isBetween(today.startOf('week'), today.endOf('week')));
            case 'all':
            default:
                return myTasks;
        }
    }, [myTasks, activeTab]);

    const tasksAtrasada = filteredTasks.filter(t => t.status === TaskStatus.Atrasada).sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)));
    const tasksPendente = filteredTasks.filter(t => t.status === TaskStatus.Pendente).sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)));
    const tasksConcluida = filteredTasks.filter(t => t.status === TaskStatus.Concluida).sort((a, b) => dayjs(b.dueDate).diff(dayjs(a.dueDate)));

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight">Tarefas</h1>
                    <p className="text-sm text-muted-foreground">Organize prioridades e visualize entregas por período.</p>
                </div>
                <Button size="lg" className="shadow-[0_18px_35px_-24px_rgba(79,70,229,0.45)]" onClick={openTaskModal}><Plus className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Minhas Tarefas</CardTitle>
                            <CardDescription>Visualize e gerencie suas tarefas.</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-white/70 p-1 dark:border-dark-border/60 dark:bg-dark-background/60">
                            <Button variant={activeTab === 'today' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('today')}>Hoje</Button>
                            <Button variant={activeTab === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('week')}>Semana</Button>
                            <Button variant={activeTab === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('all')}>Todas</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {tasksAtrasada.length > 0 && (
                        <div className="space-y-4 border-b border-border/50 px-6 py-5 dark:border-dark-border/50">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">
                                Atrasadas ({tasksAtrasada.length})
                            </h3>
                            <div className="space-y-3">
                                {tasksAtrasada.map(task => <TaskItem key={task.id} task={task} />)}
                            </div>
                        </div>
                    )}
                    {tasksPendente.length > 0 && (
                         <div className="space-y-4 border-b border-border/50 px-6 py-5 dark:border-dark-border/50">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
                                Pendentes ({tasksPendente.length})
                            </h3>
                            <div className="space-y-3">
                                {tasksPendente.map(task => <TaskItem key={task.id} task={task} />)}
                            </div>
                        </div>
                    )}
                     {tasksConcluida.length > 0 && (
                         <div className="space-y-4 px-6 py-5">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
                                Concluídas ({tasksConcluida.length})
                            </h3>
                            <div className="space-y-3">
                                {tasksConcluida.map(task => <TaskItem key={task.id} task={task} />)}
                            </div>
                        </div>
                    )}
                    {filteredTasks.length === 0 && (
                        <p className="py-10 text-center text-muted-foreground">Nenhuma tarefa para esta visualização.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Tasks;
