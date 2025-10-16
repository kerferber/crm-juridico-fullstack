
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { TaskStatus } from '../types/types';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Award, Trophy, Crown, TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';

dayjs.extend(isSameOrBefore);

// --- SUGESTÃO 2: Componente para Comparativos Temporais ---
const ComparisonBadge: React.FC<{ value: number; period?: string; invertColors?: boolean }> = ({ value, period = "mês anterior", invertColors = false }) => {
    if (isNaN(value) || !isFinite(value)) return null;
    const isPositive = value > 0;
    const isNegative = value < 0;
    
    let colorClass = 'text-gray-500';
    if (isPositive) colorClass = invertColors ? 'text-red-500' : 'text-green-500';
    if (isNegative) colorClass = invertColors ? 'text-green-500' : 'text-red-500';
    
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className={`flex items-center text-xs mt-1 ${colorClass}`}>
            {isPositive || isNegative ? <Icon className="h-3 w-3 mr-1" /> : null}
            <span>{isPositive ? '+' : ''}{value.toFixed(1)}% vs. {period}</span>
        </div>
    );
};

// --- SUGESTÃO 1: Componente para Resumo Executivo ---
const ExecutiveSummary: React.FC<{ insights: string[] }> = ({ insights }) => (
    <Card className="mb-6 bg-primary/5 dark:bg-dark-primary/10 border-primary/20">
        <CardContent className="p-4 flex items-start space-x-4">
            <Info className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="text-sm">
                <p className="font-semibold mb-1">Insights Rápidos</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {insights.map((insight, index) => <li key={index}>{insight}</li>)}
                </ul>
            </div>
        </CardContent>
    </Card>
);


const Management: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'agilidade' | 'produtividade' | 'escritorio'>('agilidade');
    const { tasks, users, lawsuits, transactions } = useApp();

    const agilityData = useMemo(() => {
        const thisMonth = dayjs();
        const lastMonth = dayjs().subtract(1, 'month');

        const getAverageDelayForMonth = (month: dayjs.Dayjs) => {
            const completedInMonth = tasks.filter(t => t.status === TaskStatus.Concluida && dayjs(t.dueDate).isSame(month, 'month'));
            const lateInMonth = completedInMonth.filter(t => dayjs(t.dueDate).isAfter(dayjs(t.deadline), 'day'));
            if (lateInMonth.length === 0) return 0;
            const totalDelay = lateInMonth.reduce((sum, t) => sum + dayjs(t.dueDate).diff(dayjs(t.deadline), 'day'), 0);
            return totalDelay / lateInMonth.length;
        };
        
        const averageDelayThisMonth = getAverageDelayForMonth(thisMonth);
        const averageDelayLastMonth = getAverageDelayForMonth(lastMonth);
        
        const delayChange = averageDelayLastMonth > 0 
            ? ((averageDelayThisMonth - averageDelayLastMonth) / averageDelayLastMonth) * 100 
            : (averageDelayThisMonth > 0 ? 100 : 0);
        
        // Insights
        const delayInsight = `O tempo médio de atraso neste mês foi de ${averageDelayThisMonth.toFixed(1)} dias.`;
        const topOverdueUser = users.map(user => ({
            name: user.name,
            count: tasks.filter(t => t.responsibleId === user.id && t.status === TaskStatus.Atrasada).length
        })).sort((a,b) => b.count - a.count)[0];
        const overdueInsight = `${topOverdueUser.name} é quem possui mais tarefas atrasadas no momento (${topOverdueUser.count}).`;

        // Remaining calculations...
        const concluidas = tasks.filter(t => t.status === TaskStatus.Concluida);
        const concluidasEmDia = concluidas.filter(t => dayjs(t.dueDate).isSameOrBefore(dayjs(t.deadline), 'day')).length;
        const concluidasAtrasadas = concluidas.length - concluidasEmDia;
        const pendentes = tasks.filter(t => t.status === TaskStatus.Pendente).length;
        const atrasadas = tasks.filter(t => t.status === TaskStatus.Atrasada).length;
        const pieData = [
            { name: 'Concluídas em Dia', value: concluidasEmDia },
            { name: 'Concluídas com Atraso', value: concluidasAtrasadas },
            { name: 'Pendentes', value: pendentes },
            { name: 'Atrasadas', value: atrasadas },
        ];
        const collaboratorsWithOverdueTasks = users.map(user => ({
            ...user,
            overdueCount: tasks.filter(t => t.responsibleId === user.id && t.status === TaskStatus.Atrasada).length
        })).filter(u => u.overdueCount > 0).sort((a, b) => b.overdueCount - a.overdueCount);
        const monthlyTaskStatus = Array.from({ length: 6 }).map((_, i) => {
            const month = dayjs().subtract(5 - i, 'month');
            const monthTasks = tasks.filter(t => dayjs(t.dueDate).isSame(month, 'month'));
            return { name: month.format('MMM'), Concluídas: monthTasks.filter(t => t.status === TaskStatus.Concluida).length, Pendentes: monthTasks.filter(t => t.status === TaskStatus.Pendente).length, Atrasadas: monthTasks.filter(t => t.status === TaskStatus.Atrasada).length };
        });

        return { pieData, collaboratorsWithOverdueTasks, averageDelay: averageDelayThisMonth, delayChange, monthlyTaskStatus, insights: [delayInsight, overdueInsight] };
    }, [tasks, users]);
    
    const productivityData = useMemo(() => {
        const getPointsForMonth = (month: dayjs.Dayjs) => tasks
            .filter(t => t.status === TaskStatus.Concluida && dayjs(t.dueDate).isSame(month, 'month'))
            .reduce((sum, t) => sum + t.score, 0);

        const pointsThisMonth = getPointsForMonth(dayjs());
        const pointsLastMonth = getPointsForMonth(dayjs().subtract(1, 'month'));
        const pointsChange = pointsLastMonth > 0 ? ((pointsThisMonth - pointsLastMonth) / pointsLastMonth) * 100 : (pointsThisMonth > 0 ? 100 : 0);
        
        const topPerformerThisMonth = users.map(user => ({
            name: user.name,
            points: tasks.filter(t => t.responsibleId === user.id && t.status === TaskStatus.Concluida && dayjs(t.dueDate).isSame(dayjs(), 'month')).reduce((sum, t) => sum + t.score, 0)
        })).sort((a,b) => b.points - a.points)[0];
        
        // Insights
        const pointsInsight = `A produtividade total da equipe, medida em pontos, ${pointsChange >= 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(pointsChange).toFixed(0)}% este mês.`;
        const performerInsight = `O destaque do mês é ${topPerformerThisMonth.name} com ${topPerformerThisMonth.points.toLocaleString()} pontos.`;
        
        // ... a
        const userRanking = users.map(user => {
            const userTasks = tasks.filter(t => t.responsibleId === user.id);
            const concluded = userTasks.filter(t => t.status === TaskStatus.Concluida);
            const points = concluded.reduce((sum, t) => sum + t.score, 0);
            const onTime = concluded.filter(t => dayjs(t.dueDate).isSameOrBefore(dayjs(t.deadline), 'day')).length;
            return { ...user, points, concludedCount: concluded.length, onTimePercentage: concluded.length > 0 ? (onTime / concluded.length) * 100 : 0, }
        }).sort((a, b) => b.points - a.points);
        const top3ThisMonth = users.map(user => ({ ...user, points: tasks.filter(t => t.responsibleId === user.id && t.status === TaskStatus.Concluida && dayjs(t.dueDate).isSame(dayjs(), 'month')).reduce((sum, t) => sum + t.score, 0) })).sort((a,b) => b.points - a.points).slice(0, 3);
        const effortByArea = lawsuits.reduce((acc, lawsuit) => {
            const areaTasks = tasks.filter(t => t.lawsuitId === lawsuit.id && t.status === TaskStatus.Concluida).length;
            acc[lawsuit.area] = (acc[lawsuit.area] || 0) + areaTasks;
            return acc;
        }, {} as Record<string, number>);
        const effortData = Object.entries(effortByArea).map(([name, value]) => ({ name, value }));
        const monthlyTeamPoints = Array.from({ length: 6 }).map((_, i) => ({ name: dayjs().subtract(5 - i, 'month').format('MMM'), Pontos: getPointsForMonth(dayjs().subtract(5 - i, 'month')) }));

        return { userRanking, top3ThisMonth, effortData, monthlyTeamPoints, insights: [pointsInsight, performerInsight] };
    }, [tasks, users, lawsuits]);

    const officeData = useMemo(() => {
        const getFinancialsForMonth = (month: dayjs.Dayjs) => {
            const monthTransactions = transactions.filter(t => dayjs(t.date).isSame(month, 'month'));
            const revenue = monthTransactions.filter(t => t.type === 'Receita').reduce((s, t) => s + t.value, 0);
            const expenses = monthTransactions.filter(t => t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
            return { revenue, expenses, profit: revenue - expenses };
        };

        const thisMonthFinancials = getFinancialsForMonth(dayjs());
        const lastMonthFinancials = getFinancialsForMonth(dayjs().subtract(1, 'month'));

        const revenueChange = lastMonthFinancials.revenue > 0 ? ((thisMonthFinancials.revenue - lastMonthFinancials.revenue) / lastMonthFinancials.revenue) * 100 : (thisMonthFinancials.revenue > 0 ? 100 : 0);
        const expensesChange = lastMonthFinancials.expenses > 0 ? ((thisMonthFinancials.expenses - lastMonthFinancials.expenses) / lastMonthFinancials.expenses) * 100 : (thisMonthFinancials.expenses > 0 ? 100 : 0);
        const profitChange = lastMonthFinancials.profit !== 0 ? ((thisMonthFinancials.profit - lastMonthFinancials.profit) / Math.abs(lastMonthFinancials.profit)) * 100 : (thisMonthFinancials.profit > 0 ? 100 : 0);

        // Insights
        const profitInsight = `O lucro líquido deste mês foi de ${formatCurrency(thisMonthFinancials.profit)}, uma variação de ${profitChange.toFixed(0)}% em relação ao mês anterior.`;
        const performanceByArea = lawsuits.reduce((acc, lawsuit) => {
            const points = tasks.filter(t => t.lawsuitId === lawsuit.id && t.status === TaskStatus.Concluida).reduce((s, t) => s + t.score, 0);
            acc[lawsuit.area] = (acc[lawsuit.area] || 0) + points;
            return acc;
        }, {} as Record<string, number>);
        const topArea = Object.entries(performanceByArea).sort((a, b) => b[1] - a[1])[0];
        const areaInsight = `A área de ${topArea[0]} foi a mais produtiva, gerando ${topArea[1].toLocaleString()} pontos.`;

        // ...
        const monthlyCashFlow = Array.from({ length: 6 }).map((_, i) => {
            const month = dayjs().subtract(5 - i, 'month');
            const { revenue, expenses, profit } = getFinancialsForMonth(month);
            return { name: month.format('MMM'), Receitas: revenue, Despesas: expenses, Lucro: profit };
        });
        const performanceByAreaTable = Object.entries(performanceByArea).map(([area, points]) => ({
             area, 
             lawsuitCount: lawsuits.filter(l => l.area === area).length, 
             concludedTasks: tasks.filter(t => t.status === TaskStatus.Concluida && lawsuits.find(l => l.id === t.lawsuitId)?.area === area).length, 
             points 
        }));

        return { 
            totalRevenue: thisMonthFinancials.revenue, 
            totalExpenses: thisMonthFinancials.expenses, 
            netProfit: thisMonthFinancials.profit, 
            revenueChange, expensesChange, profitChange, 
            monthlyCashFlow, 
            performanceByArea: performanceByAreaTable,
            insights: [profitInsight, areaInsight]
        };
    }, [transactions, lawsuits, tasks]);
    
    const COLORS = ['#10B981', '#F59E0B', '#64748B', '#EF4444'];
    const AREA_COLORS = ['#3B82F6', '#10B981', '#8B5CF6'];

    
    return (
        <div className="space-y-6">
            <h1 className="text-[22px] font-semibold">Gestão</h1>
            <div className="border-b border-border dark:border-dark-border">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('agilidade')} className={cn('py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'agilidade' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Agilidade</button>
                    <button onClick={() => setActiveTab('produtividade')} className={cn('py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'produtividade' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Produtividade</button>
                    <button onClick={() => setActiveTab('escritorio')} className={cn('py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'escritorio' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Visão do Escritório</button>
                </nav>
            </div>
            
            {activeTab === 'agilidade' && (
                <div className="space-y-6">
                    <ExecutiveSummary insights={agilityData.insights} />
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>Evolução de Tarefas por Status (Últimos 6 Meses)</CardTitle></CardHeader>
                            <CardContent className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={agilityData.monthlyTaskStatus}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Atrasadas" stackId="a" fill="#EF4444" /><Bar dataKey="Pendentes" stackId="a" fill="#F59E0B" /><Bar dataKey="Concluídas" stackId="a" fill="#10B981" /></BarChart></ResponsiveContainer></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Status Geral das Tarefas</CardTitle></CardHeader>
                            <CardContent className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={agilityData.pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">{agilityData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
                        </Card>
                    </div>
                     <div className="grid gap-6 lg:grid-cols-3">
                         <Card>
                            <CardHeader><CardTitle>Tempo Médio de Atraso</CardTitle><CardDescription>Para tarefas concluídas no mês</CardDescription></CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold text-red-500">{agilityData.averageDelay.toFixed(1)} dias</p>
                                <ComparisonBadge value={agilityData.delayChange} invertColors />
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>Colaboradores com Tarefas Atrasadas</CardTitle></CardHeader>
                            <CardContent>{agilityData.collaboratorsWithOverdueTasks.length > 0 ? (<ul className="space-y-3">{agilityData.collaboratorsWithOverdueTasks.map(user => (<li key={user.id} className="flex items-center justify-between"><div className="flex items-center"><img src={user.avatar} className="h-8 w-8 rounded-full mr-3" />{user.name}</div><span className="font-bold text-red-500">{user.overdueCount} {user.overdueCount > 1 ? 'tarefas' : 'tarefa'}</span></li>))}</ul>) : <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador com tarefas atrasadas!</p>}</CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'produtividade' && (
                 <div className="space-y-6">
                    <ExecutiveSummary insights={productivityData.insights} />
                    <div className="grid gap-6 lg:grid-cols-3">{productivityData.top3ThisMonth.map((user, index) => (<Card key={user.id} className={cn(index === 0 && "border-yellow-400 border-2", index === 1 && "border-gray-400", index === 2 && "border-amber-600")}><CardContent className="p-4 flex items-center space-x-4">{index === 0 && <Trophy className="h-8 w-8 text-yellow-400"/>}{index === 1 && <Award className="h-8 w-8 text-gray-400"/>}{index === 2 && <Crown className="h-8 w-8 text-amber-600"/>}<div><p className="font-bold">{user.name}</p><p className="text-sm text-muted-foreground">{user.points.toLocaleString()} pontos este mês</p></div></CardContent></Card>))}</div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>Ranking Geral de Produtividade</CardTitle></CardHeader>
                            <CardContent><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">#</th><th className="p-2">Responsável</th><th className="p-2">Pontos</th><th className="p-2">Tarefas Concluídas</th><th className="p-2">% em Dia</th></tr></thead><tbody>{productivityData.userRanking.map((u, i) => (<tr key={u.id} className="border-b dark:border-dark-border last:border-0"><td className="p-2 font-bold">{i+1}</td><td className="p-2 flex items-center"><img src={u.avatar} className="h-6 w-6 rounded-full mr-2" />{u.name}</td><td className="p-2 font-bold text-primary">{u.points}</td><td className="p-2">{u.concludedCount}</td><td className="p-2">{u.onTimePercentage.toFixed(0)}%</td></tr>))}</tbody></table></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Distribuição de Esforço por Área</CardTitle><CardDescription>Baseado em tarefas concluídas</CardDescription></CardHeader>
                            <CardContent className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={productivityData.effortData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>{productivityData.effortData.map((entry, index) => <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Evolução de Pontos da Equipe</CardTitle></CardHeader>
                        <CardContent className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={productivityData.monthlyTeamPoints}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="Pontos" stroke="#2563EB" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'escritorio' && (
                <div className="space-y-6">
                    <ExecutiveSummary insights={officeData.insights} />
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card><CardHeader><CardTitle className="flex items-center"><TrendingUp className="text-green-500 mr-2"/>Receita (Mês)</CardTitle></CardHeader><CardContent><p className="text-lg font-semibold">{formatCurrency(officeData.totalRevenue)}</p><ComparisonBadge value={officeData.revenueChange} /></CardContent></Card>
                        <Card><CardHeader><CardTitle className="flex items-center"><TrendingDown className="text-red-500 mr-2"/>Despesa (Mês)</CardTitle></CardHeader><CardContent><p className="text-lg font-semibold">{formatCurrency(officeData.totalExpenses)}</p><ComparisonBadge value={officeData.expensesChange} invertColors /></CardContent></Card>
                        <Card><CardHeader><CardTitle className="flex items-center"><DollarSign className="text-primary mr-2"/>Lucro Líquido (Mês)</CardTitle></CardHeader><CardContent><p className="text-lg font-semibold">{formatCurrency(officeData.netProfit)}</p><ComparisonBadge value={officeData.profitChange} /></CardContent></Card>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Fluxo de Caixa Mensal</CardTitle></CardHeader>
                        <CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={officeData.monthlyCashFlow}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} /><Tooltip formatter={(value) => formatCurrency(value as number)} /><Legend /><Bar dataKey="Receitas" fill="#10B981" /><Bar dataKey="Despesas" fill="#EF4444" /><Line type="monotone" dataKey="Lucro" stroke="#2563EB" strokeWidth={3} /></BarChart></ResponsiveContainer></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Performance por Área de Atuação</CardTitle></CardHeader>
                        <CardContent><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Área</th><th className="p-2">Nº Processos</th><th className="p-2">Tarefas Concluídas</th><th className="p-2">Pontos Gerados</th></tr></thead><tbody>{officeData.performanceByArea.map(({area, lawsuitCount, concludedTasks, points}) => (<tr key={area} className="border-b dark:border-dark-border last:border-0"><td className="p-2 font-bold">{area}</td><td className="p-2">{lawsuitCount}</td><td className="p-2">{concludedTasks}</td><td className="p-2 font-semibold text-primary">{points.toLocaleString()}</td></tr>))}</tbody></table></CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Management;
