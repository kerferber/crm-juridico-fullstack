import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { TaskStatus } from '../types/types';
import { Briefcase, AlertTriangle, CheckCircle, BarChart3, Sparkles } from 'lucide-react';
import { MiniCalendar } from '../components/dashboard/MiniCalendar';
import { UpcomingDeadlinesCard } from '../components/dashboard/UpcomingDeadlinesCard';
import { GamificationSummaryCard } from '../components/dashboard/GamificationSummaryCard';
import { TeamGoalCard } from '../components/dashboard/TeamGoalCard';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import dayjs from 'dayjs';
import { Spinner } from '../components/ui/Spinner';

const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
}

const Dashboard: React.FC = () => {
    const { lawsuits, tasks, contacts, users, loading, error } = useApp();
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    const currentUser = users[0];

    const activeLawsuits = lawsuits.filter(l => l.status === 'Ativo').length;
    const overdueTasks = tasks.filter(t => t.status === TaskStatus.Atrasada).length;
    const newLeads = contacts.filter(c => c.status === 'Lead').length;
    const concludedThisMonth = tasks.filter(t => t.status === TaskStatus.Concluida && dayjs(t.dueDate).isSame(dayjs('2025-10-01'), 'month')).length;

    const tasksCompletedYesterday = tasks.filter(t => 
        t.responsibleId === currentUser.id &&
        t.status === TaskStatus.Concluida &&
        dayjs(t.dueDate).isSame(dayjs().subtract(1, 'day'), 'day')
    ).length;
    
    const greeting = getGreeting();
    const insightMessage = tasksCompletedYesterday > 0 
        ? `Você concluiu ${tasksCompletedYesterday} ${tasksCompletedYesterday > 1 ? 'tarefas' : 'tarefa'} ontem. Excelente ritmo!`
        : "Vamos fazer de hoje um dia produtivo!";

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{greeting}, {currentUser.name}!</h1>
                <p className="text-muted-foreground">{insightMessage}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {activeLawsuits > 0 ? (
                            <div className="text-2xl font-bold">
                                <AnimatedNumber value={activeLawsuits} />
                            </div>
                        ) : (
                            <div className="text-sm text-center text-muted-foreground pt-2 flex flex-col items-center justify-center h-full">
                                <Sparkles className="h-6 w-6 mb-1 text-secondary" />
                                <span>Tudo em ordem!</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        {overdueTasks > 0 ? (
                            <div className="text-2xl font-bold text-red-500">
                                <AnimatedNumber value={overdueTasks} />
                            </div>
                        ) : (
                             <div className="text-sm text-center text-muted-foreground pt-2 flex flex-col items-center justify-center h-full">
                                <CheckCircle className="h-6 w-6 mb-1 text-green-500" />
                                <span>Nenhuma pendência.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {newLeads > 0 ? (
                            <div className="text-2xl font-bold">
                                <AnimatedNumber value={newLeads} />
                            </div>
                        ) : (
                             <div className="text-sm text-center text-muted-foreground pt-2 flex flex-col items-center justify-center h-full">
                                <Sparkles className="h-6 w-6 mb-1 text-blue-500" />
                                <span>Aguardando novos leads.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Concluídas (Mês)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                           <AnimatedNumber value={concludedThisMonth} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 grid grid-cols-1 gap-6">
                   <GamificationSummaryCard />
                   <TeamGoalCard />
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <Card><CardContent className="p-4"><MiniCalendar /></CardContent></Card>
                    <UpcomingDeadlinesCard />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;