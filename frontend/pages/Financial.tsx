import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { useTransactionModal } from '../hooks/useTransactionModal';
import { TransactionType } from '../types/types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Plus, Minus, ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, Filter, X } from 'lucide-react';
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

dayjs.extend(isSameOrBefore);

const Financial: React.FC = () => {
  const { transactions, paymentSchedules } = useApp();
  const { open: openTransactionModal } = useTransactionModal();
  const [periodPreset, setPeriodPreset] = useState<'30' | '90' | '12m' | 'all'>('30');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccount: 'Conta Principal',
    toAccount: 'Investimentos',
    amount: '',
    reference: '',
  });

  const accounts = useMemo(
    () => ['all', ...Array.from(new Set(transactions.map(t => t.account || 'Conta padrão')))],
    [transactions]
  );
  const selectableAccounts = useMemo(() => {
    const list = accounts.filter(account => account !== 'all');
    return list.length > 0 ? list : ['Conta padrão'];
  }, [accounts]);
  useEffect(() => {
    setTransferForm(prev => ({
      ...prev,
      fromAccount: selectableAccounts.includes(prev.fromAccount) ? prev.fromAccount : selectableAccounts[0],
      toAccount: selectableAccounts.includes(prev.toAccount) ? prev.toAccount : selectableAccounts[0],
    }));
  }, [selectableAccounts]);
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(transactions.map(t => t.category || 'Sem categoria')))],
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const today = dayjs();
    const start = (() => {
      switch (periodPreset) {
        case '30':
          return today.subtract(30, 'day');
        case '90':
          return today.subtract(90, 'day');
        case '12m':
          return today.subtract(12, 'month');
        case 'all':
        default:
          return null;
      }
    })();
    return transactions.filter(tx => {
      const date = dayjs(tx.date);
      if (start && date.isBefore(start, 'day')) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (accountFilter !== 'all' && tx.account !== accountFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      return true;
    });
  }, [transactions, periodPreset, typeFilter, accountFilter, categoryFilter]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const month = dayjs().subtract(5 - i, 'month');
      const monthTransactions = filteredTransactions.filter(t => dayjs(t.date).isSame(month, 'month'));
      const receitas = monthTransactions
        .filter(t => t.type === TransactionType.Receita)
        .reduce((sum, t) => sum + t.value, 0);
      const despesas = monthTransactions
        .filter(t => t.type === TransactionType.Despesa)
        .reduce((sum, t) => sum + t.value, 0);
      return { name: month.format('MMM'), Receitas: receitas, Despesas: despesas };
    });
  }, [filteredTransactions]);

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

  const ultimosLancamentos = filteredTransactions
    .slice()
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, 8);

  const upcomingReceivables = useMemo(() => {
    const upcoming = paymentSchedules
      .flatMap(schedule => schedule.installments || [])
      .filter(installment => installment.status === 'pending' && installment.dueDate)
      .map(installment => ({
        dueDate: installment.dueDate!,
        amount: installment.amount,
      }));
    const next30 = upcoming
      .filter(item => dayjs(item.dueDate).isSameOrBefore(dayjs().add(30, 'day'), 'day'))
      .reduce((sum, item) => sum + item.amount, 0);
    return { total: upcoming.reduce((sum, item) => sum + item.amount, 0), next30 };
  }, [paymentSchedules]);

  const executiveKPIs = useMemo(() => {
    const receitas = transactions.filter(t => t.type === TransactionType.Receita);
    const despesaMensal = despesaMes;
    const mediaTicket = receitas.length > 0 ? receitas.reduce((sum, t) => sum + t.value, 0) / receitas.length : 0;
    const runway = despesaMensal > 0 ? saldo / despesaMensal : null;
    const inadimplencia = upcomingReceivables.total === 0
      ? 0
      : upcomingReceivables.next30 / upcomingReceivables.total;
    return { mediaTicket, runway, inadimplencia };
  }, [transactions, despesaMes, saldo, upcomingReceivables]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-white px-5 py-5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Performance financeira
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-dark-foreground">
              Fluxo de caixa consolidado
            </h1>
            <p className="text-sm text-muted-foreground">
              Compare entradas e saídas, projete o caixa e dispare movimentos com poucos cliques.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2 rounded-full" onClick={() => openTransactionModal(TransactionType.Receita)}>
              <Plus className="h-4 w-4" />
              Nova receita
            </Button>
            <Button size="sm" variant="outline" className="gap-2 rounded-full" onClick={() => openTransactionModal(TransactionType.Despesa)}>
              <Minus className="h-4 w-4" />
              Registrar despesa
            </Button>
            <Button size="sm" variant="ghost" className="gap-2 rounded-full" onClick={() => setIsTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Transferência
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              title: 'Saldo consolidado',
              value: formatCurrency(saldo),
              helper: `Atualizado em ${currentMonth.format('MMM YYYY')}`,
              icon: TrendingUp,
            },
            {
              title: 'Receitas x Despesas (mês)',
              value: `${formatCurrency(receitaMes)} / ${formatCurrency(despesaMes)}`,
              helper: 'Entradas · Saídas',
              icon: TrendingDown,
            },
            {
              title: 'Caixa projetado',
              value: formatCurrency(caixaProjetado),
              helper: 'Considera o que já está previsto',
              icon: DollarSign,
            },
          ].map(card => (
            <div
              key={card.title}
              className="rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {card.title}
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground dark:text-dark-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white px-5 py-5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filtros rápidos
            <div className="inline-flex rounded-full border border-border/60 bg-white p-1 text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70">
              {[
                { id: '30', label: '30 dias' },
                { id: '90', label: '90 dias' },
                { id: '12m', label: '12 meses' },
                { id: 'all', label: 'Tudo' },
              ].map(option => (
                <Button
                  key={option.id}
                  size="sm"
                  variant={periodPreset === option.id ? 'secondary' : 'ghost'}
                  className="rounded-full px-3"
                  onClick={() => setPeriodPreset(option.id as typeof periodPreset)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value as 'all' | TransactionType)}
              className="h-10 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
            >
              <option value="all">Todas as naturezas</option>
              <option value={TransactionType.Receita}>Receitas</option>
              <option value={TransactionType.Despesa}>Despesas</option>
            </select>
            <select
              value={accountFilter}
              onChange={event => setAccountFilter(event.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
            >
              {accounts.map(account => (
                <option key={account} value={account}>
                  {account === 'all' ? 'Todas as contas' : account}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={event => setCategoryFilter(event.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-white px-3 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas as categorias' : category}
                </option>
              ))}
            </select>
            <div className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground dark:border-dark-border/60">
              Projeções próximas 30 dias: <span className="text-foreground dark:text-dark-foreground font-semibold">{formatCurrency(upcomingReceivables.next30)}</span>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ticket médio</CardTitle>
            <CardDescription className="text-xs">Receitas totais dividido por número de lançamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {formatCurrency(executiveKPIs.mediaTicket)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Runway estimado</CardTitle>
            <CardDescription className="text-xs">Meses de operação com o saldo atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {executiveKPIs.runway ? `${executiveKPIs.runway.toFixed(1)} meses` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/70 shadow-sm dark:border-dark-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Inadimplência projetada</CardTitle>
            <CardDescription className="text-xs">Pendências dos próximos 30 dias / total previsto.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {(executiveKPIs.inadimplencia * 100).toFixed(1)}%
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
                <th className="p-3">Status</th>
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
                  <td className="p-3 text-xs">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 font-semibold uppercase tracking-[0.2em] text-[10px]',
                      dayjs(lancamento.date).isBefore(dayjs(), 'day')
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200'
                    )}>
                      {dayjs(lancamento.date).isBefore(dayjs(), 'day') ? 'Compensado' : 'Previsto'}
                    </span>
                  </td>
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

      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-white p-6 shadow-2xl dark:border-dark-border/60 dark:bg-dark-card/90">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  Transferência interna
                </p>
                <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                  Movimentar entre contas
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-border/60 p-1 text-muted-foreground hover:text-foreground dark:border-dark-border/60"
                onClick={() => setIsTransferOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={event => {
                event.preventDefault();
                setIsTransferOpen(false);
                setTransferForm(prev => ({ ...prev, amount: '', reference: '' }));
                window.alert('Transferência registrada localmente. Integração com backoffice em desenvolvimento.');
              }}
            >
              <label className="text-sm font-semibold text-muted-foreground">
                De
                <select
                  value={transferForm.fromAccount}
                  onChange={event => setTransferForm(prev => ({ ...prev, fromAccount: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border/60 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
                >
                  {selectableAccounts.map(account => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-muted-foreground">
                Para
                <select
                  value={transferForm.toAccount}
                  onChange={event => setTransferForm(prev => ({ ...prev, toAccount: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border/60 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
                >
                  {selectableAccounts.map(account => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-muted-foreground">
                Valor
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={event => setTransferForm(prev => ({ ...prev, amount: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border/60 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-muted-foreground">
                Referência
                <input
                  value={transferForm.reference}
                  onChange={event => setTransferForm(prev => ({ ...prev, reference: event.target.value }))}
                  placeholder="Ex.: Reserva de impostos"
                  className="mt-1 w-full rounded-lg border border-border/60 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsTransferOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Confirmar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
