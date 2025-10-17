
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Plus, Minus, ArrowRightLeft } from 'lucide-react';
import { TransactionType } from '../types/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useTransactionModal } from '../hooks/useTransactionModal';

const Financial: React.FC = () => {
    const { transactions } = useApp();
    const { open: openTransactionModal } = useTransactionModal();

    const chartData = Array.from({ length: 6 }).map((_, i) => {
        const month = dayjs().subtract(5 - i, 'month');
        const monthTransactions = transactions.filter(t => dayjs(t.date).isSame(month, 'month'));
        const receitas = monthTransactions.filter(t => t.type === TransactionType.Receita).reduce((sum, t) => sum + t.value, 0);
        const despesas = monthTransactions.filter(t => t.type === TransactionType.Despesa).reduce((sum, t) => sum + t.value, 0);
        return { name: month.format('MMM'), Receitas: receitas, Despesas: despesas };
    });

    const saldo = transactions.reduce((acc, t) => acc + (t.type === TransactionType.Receita ? t.value : -t.value), 0);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-lg font-semibold">Financeiro</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="secondary" className="rounded-md px-3 text-xs font-semibold" onClick={() => openTransactionModal(TransactionType.Receita)}><Plus className="mr-2 h-4 w-4" /> Nova receita</Button>
                    <Button size="sm" variant="destructive" className="rounded-md px-3 text-xs font-semibold" onClick={() => openTransactionModal(TransactionType.Despesa)}><Minus className="mr-2 h-4 w-4" /> Nova despesa</Button>
                    <Button size="sm" variant="outline" className="rounded-md px-3 text-xs font-semibold"><ArrowRightLeft className="mr-2 h-4 w-4" /> Transferência</Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                 <Card><CardHeader><CardTitle className="text-sm font-medium">Saldo total</CardTitle></CardHeader><CardContent><p className="text-base font-semibold">{formatCurrency(saldo)}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle className="text-sm font-medium">Receita mensal prevista</CardTitle></CardHeader><CardContent><p className="text-base font-semibold">{formatCurrency(15000)}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle className="text-sm font-medium">Despesa mensal prevista</CardTitle></CardHeader><CardContent><p className="text-base font-semibold">{formatCurrency(8500)}</p></CardContent></Card>
                 <Card><CardHeader><CardTitle className="text-sm font-medium">Pagamentos atrasados</CardTitle></CardHeader><CardContent><p className="text-base font-semibold text-red-500">{formatCurrency(1200)}</p></CardContent></Card>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Receitas x Despesas por Mês</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Line type="monotone" dataKey="Receitas" stroke="#10B981" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Despesas" stroke="#EF4444" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Últimos Lançamentos</CardTitle></CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead><tr className="text-left"><th className="p-2">Data</th><th className="p-2">Descrição</th><th className="p-2">Categoria</th><th className="p-2">Conta</th><th className="p-2">Valor</th></tr></thead>
                        <tbody>
                            {transactions.slice(0, 10).map(t => (
                                <tr key={t.id} className="border-b dark:border-dark-border"><td className="p-2">{formatDate(t.date)}</td><td className="p-2">{t.description}</td><td className="p-2">{t.category}</td><td className="p-2">{t.account}</td><td className={`p-2 font-semibold ${t.type === TransactionType.Receita ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.value)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Financial;
