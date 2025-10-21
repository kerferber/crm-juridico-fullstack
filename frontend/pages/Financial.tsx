import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { useTransactionModal } from '../hooks/useTransactionModal';
import { TransactionType } from '../types/types';
import { formatCurrency, formatDate } from '../lib/utils';
import dayjs from 'dayjs';
import { Plus, Minus, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Financial: React.FC = () => {
  const { transactions } = useApp();
  const { open: openTransactionModal } = useTransactionModal();

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const month = dayjs().subtract(5 - i, 'month');
      const monthTransactions = transactions.filter(t => dayjs(t.date).isSame(month, 'month'));
      const receitas = monthTransactions
        .filter(t => t.type === TransactionType.Receita)
        .reduce((sum, t) => sum + t.value, 0);
      const despesas = monthTransactions
        .filter(t => t.type === TransactionType.Despesa)
        .reduce((sum, t) => sum + t.value, 0);
      return { name: month.format('MMM'), Receitas: receitas, Despesas: despesas };
    });
  }, [transactions]);

  const saldo = transactions.reduce(
    (acc, t) => acc + (t.type === TransactionType.Receita ? t.value : -t.value),
    0
  );

  const currentMonth = dayjs();
  const receitaMes = transactions
    .filter(
      t => t.type === TransactionType.Receita && dayjs(t.date).isSame(currentMonth, 'month')
    )
    .reduce((sum, t) => sum + t.value, 0);

  const despesaMes = transactions
    .filter(
      t => t.type === TransactionType.Despesa && dayjs(t.date).isSame(currentMonth, 'month')
    )
    .reduce((sum, t) => sum + t.value, 0);

  const caixaProjetado = saldo + receitaMes - despesaMes;

  const ultimosLancamentos = transactions
    .slice()
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F4F7FF] via-[#EAF4FF] to-white px-6 py-7 text-slate-800 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.4)]">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-28 top-8 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-cyan-200/70 blur-3xl" />
        </div>
        <div className="relative grid gap-7 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-600 shadow-sm">
              Finanças premium
            </span>
            <div className="space-y-3">
              <h1 className="text-[26px] font-semibold leading-tight text-slate-900 lg:text-[32px]">
                Visão premium do fluxo de caixa
              </h1>
              <p className="max-w-2xl text-[13px] text-slate-500 lg:text-sm">
                Tome decisões com confiança: monitore receitas, despesas e tendências em tempo real,
                com filtros dinâmicos por categoria e período.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                className="rounded-md bg-sky-500 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(56,189,248,0.5)] transition hover:bg-sky-600"
                onClick={() => openTransactionModal(TransactionType.Receita)}
              >
                <Plus className="mr-2 h-4 w-4" /> Nova receita
              </Button>
              <Button
                size="sm"
                className="rounded-md border border-slate-200 bg-white/80 px-5 text-sm font-semibold text-slate-600 shadow-inner transition hover:border-sky-300 hover:text-sky-600"
                onClick={() => openTransactionModal(TransactionType.Despesa)}
              >
                <Minus className="mr-2 h-4 w-4" /> Registrar despesa
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-md border border-transparent px-4 text-sm font-semibold text-slate-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferência
              </Button>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-[0_20px_56px_-40px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Saldo consolidado</span>
              <span>{currentMonth.format('MMM YYYY')}</span>
            </div>
            <p className="text-3xl font-semibold text-slate-900">{formatCurrency(saldo)}</p>
            <div className="grid gap-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="inline-flex items-center gap-2 font-semibold text-emerald-500">
                  <TrendingUp className="h-4 w-4" /> Receita (mês)
                </span>
                <span>{formatCurrency(receitaMes)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="inline-flex items-center gap-2 font-semibold text-rose-500">
                  <TrendingDown className="h-4 w-4" /> Despesas (mês)
                </span>
                <span>{formatCurrency(despesaMes)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="font-semibold">Caixa projetado</span>
                <span>{formatCurrency(caixaProjetado)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo total</CardTitle>
            <CardDescription className="text-xs">Disponível após receitas e despesas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {formatCurrency(saldo)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita do mês</CardTitle>
            <CardDescription className="text-xs">Atualizada automaticamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {formatCurrency(receitaMes)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
            <CardDescription className="text-xs">Pagamentos e custos recorrentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {formatCurrency(despesaMes)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Caixa projetado</CardTitle>
            <CardDescription className="text-xs">Estimativa até o fim do mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {formatCurrency(caixaProjetado)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
        <CardHeader>
          <CardTitle>Performance de receitas x despesas</CardTitle>
          <CardDescription>Comparativo dos últimos seis meses.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#CBD5F5" />
              <YAxis tickFormatter={value => formatCurrency(Number(value))} stroke="#CBD5F5" />
              <Tooltip formatter={value => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="Receitas" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Despesas" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
        <CardHeader>
          <CardTitle>Últimos lançamentos</CardTitle>
          <CardDescription>Movimentações recentes registradas no fluxo.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.26em] text-muted-foreground">
                <th className="p-3">Data</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Conta</th>
                <th className="p-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ultimosLancamentos.map(lancamento => (
                <tr
                  key={lancamento.id}
                  className="border-t border-border/60 hover:bg-surface-muted/60 dark:border-dark-border/60 dark:hover:bg-dark-surface-muted/60"
                >
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(lancamento.date)}</td>
                  <td className="p-3 text-sm font-semibold text-foreground dark:text-dark-foreground">
                    {lancamento.description}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{lancamento.category ?? '—'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{lancamento.account ?? 'Conta padrão'}</td>
                  <td
                    className={`p-3 text-right text-sm font-semibold ${
                      lancamento.type === TransactionType.Receita ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {formatCurrency(lancamento.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
