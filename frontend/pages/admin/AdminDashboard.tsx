import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { adminApiClient } from '../../services/adminApi';
import { ApiError } from '../../services/api';
import { useAdminAuth } from '../../store/AdminAuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

interface OverviewTotals {
  tasks_total: number;
  tasks_last_30_days: number;
  users_total: number;
  users_active_24h: number;
  contacts_total: number;
  lawsuits_total: number;
  transactions: {
    revenue: number;
    expense: number;
    net: number;
  };
}

interface OverviewTenantMetrics {
  tenant: {
    id: number;
    name: string;
    slug: string;
    status: string;
    created_at: string;
    users_count: number;
  };
  metrics: {
    tasks_total: number;
    tasks_last_30_days: number;
    users_total: number;
    users_active_24h: number;
    contacts_total: number;
    lawsuits_total: number;
    transactions: {
      revenue: number;
      expense: number;
      net: number;
    };
  };
  activity: {
    latest_task: string | null;
    latest_user: string | null;
    latest_contact: string | null;
    latest_transaction: string | null;
  };
}

interface OverviewResponse {
  generated_at: string;
  totals: OverviewTotals;
  tenants: OverviewTenantMetrics[];
}

interface TimeseriesSeriesItem {
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  tasks: number[];
  revenue: number[];
  expense: number[];
}

interface TimeseriesResponse {
  labels: string[];
  series: TimeseriesSeriesItem[];
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numberFormatter = new Intl.NumberFormat('pt-BR');
const MAX_CHART_TENANTS = 6;
const REFRESH_INTERVAL = 30_000;

const formatDateLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const colorPalette = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#EA580C',
  '#EC4899',
  '#0EA5E9',
  '#16A34A',
  '#A855F7',
];

const AdminDashboard: React.FC = () => {
  const { token, logout } = useAdminAuth();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const [overviewResponse, timeseriesResponse] = await Promise.all([
        adminApiClient.get<OverviewResponse>('metrics/overview', token),
        adminApiClient.get<TimeseriesResponse>('metrics/timeseries?days=30', token),
      ]);
      setOverview(overviewResponse);
      setTimeseries(timeseriesResponse);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }
        setError(err.message || 'Falha ao carregar métricas do painel.');
      } else {
        setError('Não foi possível buscar os dados do painel administrativo.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const tasksPerTenantData = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.tenants.map(item => ({
      name: item.tenant.name,
      total: item.metrics.tasks_total,
      last30: item.metrics.tasks_last_30_days,
    }));
  }, [overview]);

  const aggregatedRevenueSeries = useMemo(() => {
    if (!timeseries) {
      return [];
    }

    const { labels, series } = timeseries;
    return labels.map((day, index) => {
      const revenue = series.reduce((acc, tenantSeries) => acc + (tenantSeries.revenue[index] ?? 0), 0);
      const expense = series.reduce((acc, tenantSeries) => acc + (tenantSeries.expense[index] ?? 0), 0);
      const net = revenue - expense;
      return { day: formatDateLabel(day), revenue, expense, net };
    });
  }, [timeseries]);

  const tasksTimeseriesData = useMemo(() => {
    if (!timeseries) {
      return [];
    }

    const { labels, series } = timeseries;
    const limitedSeries = series.slice(0, MAX_CHART_TENANTS);

    return labels.map((day, index) => {
      const entry: Record<string, number | string> = { day: formatDateLabel(day) };
      limitedSeries.forEach((tenantSeries, tenantIndex) => {
        const key = tenantSeries.tenant.slug || `tenant_${tenantSeries.tenant.id}_${tenantIndex}`;
        entry[key] = tenantSeries.tasks[index] ?? 0;
      });
      return entry;
    });
  }, [timeseries]);

  const taskSeriesKeys = useMemo(() => {
    if (!timeseries) {
      return [];
    }
    return timeseries.series.slice(0, MAX_CHART_TENANTS).map((tenantSeries, index) => ({
      key: tenantSeries.tenant.slug || `tenant_${tenantSeries.tenant.id}_${index}`,
      label: tenantSeries.tenant.name,
    }));
  }, [timeseries]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Visão geral dos tenants</h1>
          <p className="text-sm text-muted-foreground">
            Métricas em tempo real atualizadas automaticamente a cada 30 segundos.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchMetrics} disabled={loading}>
          Atualizar agora
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-500/10">
          {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-surface dark:border-dark-border/50 dark:bg-dark-surface">
          <Spinner size="lg" />
        </div>
      ) : null}

      {overview && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Receita líquida"
            value={currency.format(overview.totals.transactions.net)}
            subtitle={`${currency.format(overview.totals.transactions.revenue)} receita / ${currency.format(
              overview.totals.transactions.expense
            )} despesas`}
          />
          <MetricCard
            title="Tarefas (30 dias)"
            value={numberFormatter.format(overview.totals.tasks_last_30_days)}
            subtitle={`Total acumulado: ${numberFormatter.format(overview.totals.tasks_total)}`}
          />
          <MetricCard
            title="Usuários ativos"
            value={numberFormatter.format(overview.totals.users_active_24h)}
            subtitle={`${numberFormatter.format(overview.totals.users_total)} usuários totais`}
          />
          <MetricCard
            title="Contatos e processos"
            value={`${numberFormatter.format(overview.totals.contacts_total)} contatos`}
            subtitle={`${numberFormatter.format(overview.totals.lawsuits_total)} processos`} 
          />
        </section>
      )}

      {overview && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Produção por tenant</h2>
                <p className="text-xs text-muted-foreground">Total de tarefas e volume dos últimos 30 dias.</p>
              </div>
            </header>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksPerTenantData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="last30" name="Últimos 30 dias" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Fluxo financeiro diário</h2>
                <p className="text-xs text-muted-foreground">Receitas, despesas e resultado líquido agregado.</p>
              </div>
            </header>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedRevenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={value => currency.format(value).replace('R$', 'R$ ')} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => currency.format(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Receitas" stroke="#16A34A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="net" name="Resultado líquido" stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {timeseries && taskSeriesKeys.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
          <header>
            <h2 className="text-lg font-semibold text-foreground">Tarefas por tenant (últimos 30 dias)</h2>
            <p className="text-xs text-muted-foreground">
              Visualize a quantidade diária de tarefas criadas por tenant. Apenas os {MAX_CHART_TENANTS} principais são exibidos.
            </p>
          </header>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tasksTimeseriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                <Legend />
                {taskSeriesKeys.map((seriesKey, index) => (
                  <Line
                    key={seriesKey.key}
                    type="monotone"
                    dataKey={seriesKey.key}
                    name={seriesKey.label}
                    stroke={colorPalette[index % colorPalette.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {overview && (
        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Detalhamento por tenant</h2>
              <p className="text-xs text-muted-foreground">Resumo de métricas operacionais por workspace.</p>
            </div>
          </header>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface dark:border-dark-border/50 dark:bg-dark-surface">
            <table className="min-w-full divide-y divide-border/60 text-sm dark:divide-dark-border/50">
              <thead className="bg-surface-muted/60 dark:bg-dark-surface-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tenant</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Usuários ativos</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tarefas (30d)</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contatos</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Processos</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Receita líquida</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Última atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border/50">
                {overview.tenants.map(item => {
                  const latestActivity = [
                    item.activity.latest_task,
                    item.activity.latest_user,
                    item.activity.latest_contact,
                    item.activity.latest_transaction,
                  ]
                    .filter(Boolean)
                    .map(value => new Date(value as string))
                    .sort((a, b) => b.getTime() - a.getTime())[0];

                  return (
                    <tr key={item.tenant.id} className="hover:bg-surface-muted/50 dark:hover:bg-dark-surface-muted/50">
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex flex-col">
                          <span>{item.tenant.name}</span>
                          <span className="text-xs text-muted-foreground">{item.tenant.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {numberFormatter.format(item.metrics.users_active_24h)} / {numberFormatter.format(item.metrics.users_total)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {numberFormatter.format(item.metrics.tasks_last_30_days)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {numberFormatter.format(item.metrics.contacts_total)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {numberFormatter.format(item.metrics.lawsuits_total)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {currency.format(item.metrics.transactions.net)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {latestActivity ? latestActivity.toLocaleString() : 'Sem atividade recente'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-dark-border/50 dark:bg-dark-surface">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
};

export default AdminDashboard;
