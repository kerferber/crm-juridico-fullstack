
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
        <div className="flex items-start justify-between p-4 border-b dark:border-dark-border last:border-b-0">
            <div className="flex items-start space-x-4">
                <span className="mt-1">{getStatusIcon()}</span>
                <div>
                    <p className="font-semibold">{task.title}</p>
                    <div className="text-xs text-muted-foreground space-x-2">
                        {relatedLawsuit && <Link to={`/processos/${relatedLawsuit.id}`} className="hover:underline">Processo: {relatedLawsuit.internalNumber}</Link>}
                        {relatedContact && <Link to={`/contatos/${relatedContact.id}`} className="hover:underline">Contato: {relatedContact.name}</Link>}
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-right">
                <div className="w-24">
                    <p className="font-medium">Prazo</p>
                    <p className={cn("text-xs", dayjs(task.deadline).isBefore(dayjs(), 'day') && task.status !== TaskStatus.Concluida ? 'text-red-500' : 'text-muted-foreground')}>{formatDate(task.deadline)}</p>
                </div>
                {responsible && (
                    <div className="flex items-center space-x-2">
                        <img src={responsible.avatar} alt={responsible.name} className="h-6 w-6 rounded-full" title={responsible.name} />
                    </div>
                )}
            </div>
        </div>
    );
};


const Tasks: React.FC = () => {
    const { tasks } = useApp();
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Tarefas</h1>
                <Button><Plus className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Minhas Tarefas</CardTitle>
                            <CardDescription>Visualize e gerencie suas tarefas.</CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-dark-border/50 p-1 rounded-lg">
                            <Button variant={activeTab === 'today' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('today')}>Hoje</Button>
                            <Button variant={activeTab === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('week')}>Semana</Button>
                            <Button variant={activeTab === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('all')}>Todas</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {tasksAtrasada.length > 0 && (
                        <div className="p-4 border-b dark:border-dark-border">
                            <h3 className="text-sm font-semibold text-red-500 mb-2 px-4">Atrasadas ({tasksAtrasada.length})</h3>
                            {tasksAtrasada.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    )}
                    {tasksPendente.length > 0 && (
                         <div className="p-4 border-b dark:border-dark-border">
                            <h3 className="text-sm font-semibold text-yellow-600 mb-2 px-4">Pendentes ({tasksPendente.length})</h3>
                            {tasksPendente.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    )}
                     {tasksConcluida.length > 0 && (
                         <div className="p-4">
                            <h3 className="text-sm font-semibold text-green-600 mb-2 px-4">Concluídas ({tasksConcluida.length})</h3>
                            {tasksConcluida.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    )}
                    {filteredTasks.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Nenhuma tarefa para esta visualização.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Tasks;
