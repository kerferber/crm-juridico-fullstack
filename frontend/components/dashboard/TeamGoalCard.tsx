
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useApp } from '../../store/AppContext';
import { Target } from 'lucide-react';
import { TransactionType } from '../../types/types';
import dayjs from 'dayjs';
import { AnimatedProgressBar } from '../ui/AnimatedProgressBar';
import { formatCurrency } from '../../lib/utils';

export const TeamGoalCard: React.FC = () => {
    const { lawsuits, transactions } = useApp();

    // Example goal: close 5 lawsuits this month.
    const goalClosedLawsuits = 5;
    const currentClosedLawsuits = lawsuits.filter(l => 
        l.status === 'Fechado' && dayjs(l.deadline).isSame(dayjs('2025-10-01'), 'month')
    ).length;
    const lawsuitsProgress = (currentClosedLawsuits / goalClosedLawsuits) * 100;

    // Example goal 2: Revenue of R$ 15,000 this month
    const goalRevenue = 15000;
    const currentRevenue = transactions
        .filter(t => t.type === TransactionType.Receita && dayjs(t.date).isSame(dayjs('2025-10-01'), 'month'))
        .reduce((sum, t) => sum + t.value, 0);
    const revenueProgress = (currentRevenue / goalRevenue) * 100;


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5 text-blue-500" />
                    Metas do Mês
                </CardTitle>
                <CardDescription>Progresso da equipe em relação às metas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm mb-1 font-medium">
                        <span>Processos Fechados</span>
                        <span>{currentClosedLawsuits} / {goalClosedLawsuits}</span>
                    </div>
                    <AnimatedProgressBar value={lawsuitsProgress} />
                </div>
                 <div>
                    <div className="flex justify-between text-sm mb-1 font-medium">
                        <span>Faturamento</span>
                        <span>{formatCurrency(currentRevenue)} / {formatCurrency(goalRevenue)}</span>
                    </div>
                    <AnimatedProgressBar value={revenueProgress} className="[&>div]:bg-green-500" />
                </div>
            </CardContent>
        </Card>
    );
};
