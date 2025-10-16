
import React, { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { BADGES } from '../data/seed';
import { Trophy, Check, Flame, Swords, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskStatus } from '../types/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import dayjs from 'dayjs';
import { getGamificationData } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';


const Gamification: React.FC = () => {
    const { users, tasks, lawsuits, loading, error } = useApp();

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }
    
    const currentUser = users[0];
    if (!currentUser) {
        return <div className="text-center text-muted-foreground">Nenhum usuário encontrado para exibir dados de gamificação.</div>;
    }

    // --- Main User Data ---
    const { 
        completedTasks, 
        score: currentUserScore, 
        level: currentLevel, 
        nextLevel, 
        progressPercentage 
    } = useMemo(() => getGamificationData(currentUser, tasks, lawsuits), [currentUser, tasks, lawsuits]);
    
    // --- All Users Ranking ---
    const userRanking = useMemo(() => {
        return users.map(user => {
            const { score } = getGamificationData(user, tasks, lawsuits);
            return { ...user, score };
        }).sort((a, b) => b.score - a.score);
    }, [users, tasks, lawsuits]);

    const currentUserRank = userRanking.findIndex(u => u.id === currentUser.id) + 1;

    // --- Widget 1: Destaque da Semana ---
    const playerOfTheWeek = useMemo(() => {
        const last7days = dayjs().subtract(7, 'days');
        const weeklyScores = users.map(user => {
            const weeklyPoints = tasks
                .filter(t => 
                    t.responsibleId === user.id && 
                    t.status === TaskStatus.Concluida && 
                    dayjs(t.dueDate).isAfter(last7days)
                )
                .reduce((sum, t) => sum + t.score, 0);
            return { ...user, weeklyPoints };
        });
        return weeklyScores.sort((a, b) => b.weeklyPoints - a.weeklyPoints)[0];
    }, [users, tasks]);

    // --- Widget 2: Sequência de Atividades ---
    const activityStreak = useMemo(() => {
        if (completedTasks.length === 0) return 0;
        const completionDates = [...new Set(completedTasks.map(t => dayjs(t.dueDate).format('YYYY-MM-DD')))].sort();
        let streak = 0;
        let expectedDate = dayjs();
        if(!completionDates.includes(expectedDate.format('YYYY-MM-DD'))) {
          expectedDate = dayjs().subtract(1, 'day');
        }

        for (let i = completionDates.length - 1; i >= 0; i--) {
            if (completionDates[i] === expectedDate.format('YYYY-MM-DD')) {
                streak++;
                expectedDate = expectedDate.subtract(1, 'day');
            } else if (dayjs(completionDates[i]).isBefore(expectedDate)) {
                break;
            }
        }
        return streak;
    }, [completedTasks]);
    
    // --- Widget 3: Batalha de Pontos ---
    const pointBattle = useMemo(() => {
        if (currentUserRank === 1) return null;
        const rival = userRanking[currentUserRank - 2];
        return {
            rivalName: rival.name,
            pointsNeeded: rival.score - currentUserScore + 1,
        };
    }, [currentUserRank, userRanking, currentUserScore]);

    // --- Chart 1: Evolução de Pontos ---
    const pointsEvolutionData = useMemo(() => {
        const thirtyDaysAgo = dayjs().subtract(29, 'day');
        const relevantTasks = completedTasks
            .filter(t => dayjs(t.dueDate).isAfter(thirtyDaysAgo))
            .sort((a, b) => dayjs(a.dueDate).diff(dayjs(b.dueDate)));

        let cumulativeScore = 0;
        const dataMap = new Map<string, number>();

        for (const task of relevantTasks) {
            cumulativeScore += task.score;
            dataMap.set(dayjs(task.dueDate).format('DD/MM'), cumulativeScore);
        }
        
        let lastKnownScore = 0;
        return Array.from({ length: 30 }, (_, i) => {
            const day = dayjs().subtract(29 - i, 'day');
            const dayKey = day.format('DD/MM');
            if (dataMap.has(dayKey)) {
                lastKnownScore = dataMap.get(dayKey)!;
            }
            return { day: dayKey, Pontos: lastKnownScore };
        });
    }, [completedTasks]);

    // --- Chart 2: Distribuição por Área ---
    const areaDistributionData = useMemo(() => {
        const distribution = completedTasks.reduce((acc, task) => {
            const lawsuit = lawsuits.find(l => l.id === task.lawsuitId);
            if (lawsuit) {
                acc[lawsuit.area] = (acc[lawsuit.area] || 0) + task.score;
            }
            return acc;
        }, {} as Record<string, number>);

        const maxPoints = Math.max(...Object.values(distribution), 1);
        return Object.entries(distribution).map(([area, points]) => ({ subject: area, A: points, fullMark: maxPoints }));
    }, [completedTasks, lawsuits]);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Trophy className="h-10 w-10 text-yellow-400" />
                <div>
                    <h1 className="text-3xl font-bold">Painel de Gamificação</h1>
                    <p className="text-muted-foreground">Compita, conquiste e veja sua evolução de performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-gradient-to-br from-primary/90 to-blue-400 text-white dark:from-primary dark:to-blue-600">
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl">Seu Progresso de Carreira</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-lg opacity-80">Nível Atual</p>
                                <p className="text-4xl font-bold">{currentLevel.name}</p>
                            </div>
                            <p className="text-3xl font-bold">{currentUserScore.toLocaleString()} pts</p>
                        </div>
                        {nextLevel && (
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium opacity-90">Progresso para {nextLevel.name}</span>
                                    <span className="opacity-80">{currentUserScore.toLocaleString()} / {nextLevel.pointsRequired.toLocaleString()} pts</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-4">
                                    <div className="bg-white h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Ranking Geral</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {userRanking.slice(0, 5).map((user, index) => (
                                <li key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className={cn("font-bold w-6 text-center mr-2", 
                                            index === 0 && "text-yellow-500", 
                                            index === 1 && "text-gray-400", 
                                            index === 2 && "text-amber-600"
                                        )}>{index + 1}</span>
                                        <img src={user.avatar} className="h-8 w-8 rounded-full mr-3" />
                                        <span className={cn(user.id === currentUser.id && "font-bold")}>{user.name}</span>
                                    </div>
                                    <span className="font-bold text-primary">{user.score.toLocaleString()} pts</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Destaque da Semana</CardTitle>
                        <Award className="h-5 w-5 text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <img src={playerOfTheWeek.avatar} className="h-16 w-16 rounded-full mx-auto mb-2 border-4 border-secondary" />
                        <p className="text-xl font-bold text-center">{playerOfTheWeek.name}</p>
                        <p className="text-sm text-muted-foreground text-center">+{playerOfTheWeek.weeklyPoints} pts nos últimos 7 dias</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Sequência de Atividades</CardTitle>
                        <Flame className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent className="text-center">
                         <p className="text-6xl font-bold text-orange-500">{activityStreak}</p>
                         <p className="text-muted-foreground">{activityStreak === 1 ? 'Dia consecutivo' : 'Dias consecutivos'}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Batalha de Pontos</CardTitle>
                        <Swords className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent className="text-center">
                        {pointBattle ? (
                            <>
                                <p className="text-6xl font-bold text-red-500">{pointBattle.pointsNeeded}</p>
                                <p className="text-muted-foreground">pontos para superar {pointBattle.rivalName}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-6xl font-bold text-green-500">#1</p>
                                <p className="text-muted-foreground">Você está no topo do ranking!</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader><CardTitle>Sua Evolução de Pontos (Últimos 30 dias)</CardTitle></CardHeader>
                    <CardContent className="h-[250px] -ml-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={pointsEvolutionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Line type="monotone" dataKey="Pontos" stroke="#2563EB" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Distribuição de Pontos por Área</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={areaDistributionData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <Radar name={currentUser.name} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Mural de Conquistas</CardTitle>
                    <CardDescription>Desbloqueie todas as badges para provar sua maestria.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {BADGES.map(badge => {
                        let current = 0;
                        if (badge.type === 'score') {
                            current = currentUserScore;
                        } else if (badge.type === 'tasks') {
                            current = completedTasks.length;
                        } else if (badge.type === 'area') {
                            current = completedTasks.filter(t => {
                                const l = lawsuits.find(lw => lw.id === t.lawsuitId);
                                return l && l.area === badge.area;
                            }).length;
                        }
                        const isEarned = current >= badge.threshold;
                        const progress = isEarned ? 100 : (current / badge.threshold) * 100;

                        return (
                            <Card key={badge.id} className={cn("p-4 text-center transition-all", isEarned && "bg-green-50 dark:bg-green-900/20 border-green-500")}>
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                     <badge.icon className={cn("w-12 h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", isEarned ? "text-green-500" : "text-muted-foreground")} />
                                     {isEarned && <Check className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 h-6 w-6" />}
                                </div>
                                <p className="font-bold">{badge.name}</p>
                                <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                                {!isEarned && (
                                    <>
                                        <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-1.5 mb-1">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{current} / {badge.threshold}</p>
                                    </>
                                )}
                            </Card>
                        );
                    })}
                </CardContent>
            </Card>

        </div>
    );
};

export default Gamification;