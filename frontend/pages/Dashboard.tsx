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
        <div className="space-y-8">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-[22px] font-semibold tracking-tight">
                    {greeting}, {currentUser.name}!
                </h1>
                <p className="text-sm text-muted-foreground">{insightMessage}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-white/95 to-white/80 shadow-[0_22px_50px_-30px_rgba(79,70,229,0.35)] dark:from-dark-card/90 dark:to-dark-card/70">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {activeLawsuits > 0 ? (
                            <div className="text-lg font-semibold">
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
                <Card className="bg-gradient-to-br from-rose-50/80 to-white/78 shadow-[0_22px_50px_-30px_rgba(244,114,182,0.38)] dark:from-dark-card/90 dark:to-dark-card/70">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        {overdueTasks > 0 ? (
                            <div className="text-lg font-semibold text-red-500">
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
                <Card className="bg-gradient-to-br from-white/95 via-sky-50/75 to-white/78 shadow-[0_22px_52px_-34px_rgba(56,189,248,0.35)] dark:from-dark-card/90 dark:via-dark-card/80 dark:to-dark-card/70">
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {newLeads > 0 ? (
                            <div className="text-lg font-semibold">
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
                 <Card className="bg-gradient-to-br from-emerald-50/75 to-white/78 shadow-[0_22px_50px_-30px_rgba(16,185,129,0.35)] dark:from-dark-card/85 dark:to-dark-card/70">
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Concluídas (Mês)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold text-green-500">
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
                    <Card className="shadow-[0_18px_45px_-28px_rgba(79,70,229,0.35)]">
                        <CardContent className="p-4"><MiniCalendar /></CardContent>
                    </Card>
                    <UpcomingDeadlinesCard />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
