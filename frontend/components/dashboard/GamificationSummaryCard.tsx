import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useApp } from '../../store/AppContext';
import { BADGES } from '../../data/seed';
import { TaskStatus, User } from '../../types/types';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedProgressBar } from '../ui/AnimatedProgressBar';
import { getGamificationData } from '../../lib/utils'; // Using the new helper

export const GamificationSummaryCard: React.FC = () => {
    const { users, tasks, lawsuits } = useApp();
    const currentUser = users[0];

    if (!currentUser) return null;

    const { score, level, nextLevel, progressPercentage, earnedBadges } = getGamificationData(currentUser, tasks, lawsuits);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                    Seu Painel de Desempenho
                </CardTitle>
                <CardDescription>Sua pontuação, nível de carreira e conquistas.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <p className="text-2xl font-bold">{score.toLocaleString()} pts</p>
                        <p className="text-sm font-semibold text-primary">{level.name}</p>
                    </div>
                    {nextLevel && (
                        <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progresso para {nextLevel.name}</span>
                                <span>{nextLevel.pointsRequired.toLocaleString()} pts</span>
                            </div>
                            <AnimatedProgressBar value={progressPercentage} />
                        </div>
                    )}
                </div>

                {/* --- SUGESTÃO IMPLEMENTADA: BADGES DESBLOQUEADOS --- */}
                <div className="mt-4 pt-4 border-t dark:border-dark-border">
                    <h4 className="text-sm font-semibold mb-2">Conquistas Desbloqueadas</h4>
                    <div className="flex flex-wrap items-center gap-2">
                        {earnedBadges.length > 0 ? (
                            earnedBadges.map(badge => (
                                <div 
                                    key={badge.id} 
                                    className="p-2 bg-gray-100 dark:bg-dark-border rounded-full" 
                                    title={`${badge.name}: ${badge.description}`}
                                >
                                    <badge.icon className="h-5 w-5 text-yellow-500" />
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground">Continue trabalhando para desbloquear sua primeira conquista!</p>
                        )}
                    </div>
                </div>

                 <Link to="/gamificacao" className="text-primary dark:text-dark-primary text-sm mt-4 block text-center hover:underline">
                    Ver painel de gamificação completo &gt;
                </Link>
            </CardContent>
        </Card>
    );
};
