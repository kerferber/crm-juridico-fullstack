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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApiClient } from '../../services/adminApi';
import { ApiError } from '../../services/api';
import { useAdminAuth } from '../../store/AdminAuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { ArrowDownRight, ArrowUpRight, Building2, Activity, Trash2, RefreshCcw } from 'lucide-react';

interface OverviewTotals {
  tasks_total: number;
  tasks_last_30_days: number;
  users_total: number;
  users_active_24h: number;
  sessions_active_5m: number;
  contacts_total: number;
  lawsuits_total: number;
  tenants_total: number;
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
    sessions_active_5m: number;
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
const MAX_CHART_TENANTS = 5;
const REFRESH_INTERVAL = 45_000;

const formatDateLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const colorPalette = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#EC4899', '#0EA5E9', '#16A34A', '#A855F7'];

const AdminDashboard: React.FC = () => {
  const { token, logout } = useAdminAuth();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);

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
    const interval = window.setInterval(() => {
      fetchMetrics();
    }, REFRESH_INTERVAL);

    return () => window.clearInterval(interval);
  }, [fetchMetrics]);

  const handleDeleteTenant = useCallback(
    async (tenantId: number, tenantName: string) => {
      if (!token) return;
      const confirmed = window.confirm(
        `Excluir o tenant "${tenantName}"? Esta ação remove usuários, processos, tarefas e contatos associados.`
      );
      if (!confirmed) return;

      setDeletingTenantId(tenantId);
      try {
        await adminApiClient.delete(`tenants/${tenantId}`, token);
        await fetchMetrics();
      } catch (err) {
        console.error(err);
        if (err instanceof ApiError) {
          setError(err.message || 'Não foi possível excluir o tenant.');
        } else {
          setError('Falha inesperada ao excluir o tenant.');
        }
      } finally {
        setDeletingTenantId(null);
      }
    },
    [fetchMetrics, token]
  );

  const tasksPerTenantData = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.tenants
      .map(item => ({
        name: item.tenant.name,
        total: item.metrics.tasks_total,
        last30: item.metrics.tasks_last_30_days,
      }))
      .sort((a, b) => b.last30 - a.last30)
      .slice(0, MAX_CHART_TENANTS);
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

  const tenantRevenueShare = useMemo(() => {
    if (!overview) return [];
    return overview.tenants
      .map(t => ({ name: t.tenant.name, value: t.metrics.transactions.net }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [overview]);

  const tenantCount = overview?.totals.tenants_total ?? overview?.tenants.length ?? 0;
  const sessionsActive = overview?.totals.sessions_active_5m ?? 0;
  const tasksLast30 = overview?.totals.tasks_last_30_days ?? 0;
  const usersActive = overview?.totals.users_active_24h ?? 0;
  const contactsTotal = overview?.totals.contacts_total ?? 0;
  const tasksPerActiveUser = usersActive ? tasksLast30 / usersActive : 0;
  const tasksPerTenant = tenantCount ? tasksLast30 / tenantCount : 0;
  const contactsPerTenant = tenantCount ? contactsTotal / tenantCount : 0;
  const avgRevenuePerTenant = tenantCount ? (overview?.totals.transactions.net ?? 0) / tenantCount : 0;

  return (
    <div className="space-y-10 pb-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#0f172a] p-6 text-white shadow-[0_35px_90px_-60px_rgba(30,64,175,0.7)] sm:p-8">
        <div className="absolute inset-0 opacity-60" aria-hidden>
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-[140px]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Painel SaaS</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Inteligência operacional dos tenants</h1>
            <p className="max-w-xl text-sm text-white/70">
              Acompanhe métricas de adoção, engajamento e resultados financeiros em tempo real. Dados são atualizados automaticamente a cada 45 segundos.
            </p>
            <div className="flex flex-wrap gap-3">
              <HeroStat
                label="Tenants ativos"
                value={tenantCount}
                icon={<Building2 className="h-4 w-4" />}
              />
              <HeroStat
                label="Sessões simultâneas (5 min)"
                value={sessionsActive}
                icon={<Activity className="h-4 w-4" />}
              />
              <HeroStat
                label="Receita líquida"
                value={currency.format(overview?.totals.transactions.net ?? 0)}
              />
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-5 text-sm shadow-inner backdrop-blur lg:items-end">
            <span className="text-xs uppercase tracking-[0.3em] text-white/70">Última atualização</span>
            <span className="text-lg font-semibold">
              {overview ? new Date(overview.generated_at).toLocaleString('pt-BR') : '—'}
            </span>
            <Button
              onClick={fetchMetrics}
              variant="ghost"
              className="mt-2 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40"
              disabled={loading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar agora
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-surface dark:border-dark-border/50 dark:bg-dark-surface">
          <Spinner size="lg" />
        </div>
      ) : null}

      {overview && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tarefas (30 dias)"
            value={numberFormatter.format(tasksLast30)}
            subtitle={`Média por tenant: ${tasksPerTenant.toFixed(1)}`}
            trend={tasksPerActiveUser}
            trendLabel="por usuário ativo"
            positive
          />
          <StatCard
            title="Usuários ativos 24h"
            value={numberFormatter.format(usersActive)}
            subtitle={`Sessões simultâneas: ${numberFormatter.format(sessionsActive)}`}
            trend={sessionsActive}
            trendLabel="sessões"
            positive
          />
          <StatCard
            title="Receita líquida"
            value={currency.format(overview.totals.transactions.net)}
            subtitle={`${currency.format(overview.totals.transactions.revenue)} receita / ${currency.format(
              overview.totals.transactions.expense
            )} despesas`}
            trend={avgRevenuePerTenant}
            trendLabel="média por tenant"
            positive={avgRevenuePerTenant >= 0}
          />
          <StatCard
            title="Base de contatos"
            value={numberFormatter.format(contactsTotal)}
            subtitle={`Média por tenant: ${contactsPerTenant.toFixed(1)}`}
            trend={contactsPerTenant}
            trendLabel="por tenant"
            positive
          />
        </section>
      )}

      {overview && (
        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
            <header className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">Produção por tenant</h2>
              <p className="text-xs text-muted-foreground">Comparativo de tarefas totais e dos últimos 30 dias.</p>
            </header>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksPerTenantData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Total" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="last30" name="Últimos 30 dias" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
            <header className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">Participação na receita</h2>
              <p className="text-xs text-muted-foreground">Top tenants por contribuição líquida.</p>
            </header>
            <div className="flex flex-col gap-3">
              <div className="mx-auto h-48 w-full max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tenantRevenueShare} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                      {tenantRevenueShare.map((entry, index) => (
                        <Cell key={entry.name} fill={colorPalette[index % colorPalette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {tenantRevenueShare.map((tenant, index) => (
                  <li key={tenant.name} className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-muted px-3 py-2 dark:border-dark-border/40 dark:bg-dark-surface-muted">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                      />
                      <span className="font-medium text-foreground">{tenant.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currency.format(tenant.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {timeseries && (
        <section className="space-y-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
          <header className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Evolução de tarefas por tenant</h2>
            <p className="text-xs text-muted-foreground">Comparativo diário dos principais workspaces.</p>
          </header>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tasksTimeseriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
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
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Detalhamento por tenant</h2>
              <p className="text-xs text-muted-foreground">Resumo operacional e ações rápidas por workspace.</p>
            </div>
          </header>

          <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm dark:border-dark-border/50 dark:bg-dark-surface lg:block">
            <table className="min-w-full divide-y divide-border/60 text-sm dark:divide-dark-border/50">
              <thead className="bg-surface-muted/60 dark:bg-dark-surface-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tenant</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Usuários ativos</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sessões (5 min)</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tarefas (30d)</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contatos</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Processos</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Receita líquida</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Última atividade</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Ações</th>
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
                    <tr key={item.tenant.id} className="hover:bg-surface-muted/50 dark:hover:bg-dark-surface-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{item.tenant.name}</span>
                          <span className="text-xs text-muted-foreground">{item.tenant.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {numberFormatter.format(item.metrics.users_active_24h)} / {numberFormatter.format(item.metrics.users_total)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {numberFormatter.format(item.metrics.sessions_active_5m)}
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
                        {latestActivity ? latestActivity.toLocaleString('pt-BR') : 'Sem atividade recente'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-2 rounded-full border-border/60 px-3 text-xs text-muted-foreground hover:border-red-400 hover:text-red-500"
                          onClick={() => handleDeleteTenant(item.tenant.id, item.tenant.name)}
                          disabled={deletingTenantId === item.tenant.id}
                        >
                          {deletingTenantId === item.tenant.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {overview.tenants.map(item => (
              <TenantMobileCard
                key={item.tenant.id}
                tenant={item}
                onDelete={handleDeleteTenant}
                deleting={deletingTenantId === item.tenant.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  positive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, trendLabel, positive }) => {
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-dark-border/50 dark:bg-dark-surface">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{typeof value === 'number' ? numberFormatter.format(value) : value}</p>
      {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
      {trend !== undefined && trendLabel && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span className="text-muted-foreground">
            {positive ? '↑' : '↓'} {trend.toFixed(1)} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
};

interface HeroStatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

const HeroStat: React.FC<HeroStatProps> = ({ label, value, icon }) => (
  <div className="min-w-[160px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm shadow-inner backdrop-blur">
    <span className="text-xs uppercase tracking-[0.3em] text-white/70">{label}</span>
    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
      {icon}
      <span>{typeof value === 'number' ? numberFormatter.format(value) : value}</span>
    </div>
  </div>
);

interface TenantMobileCardProps {
  tenant: OverviewTenantMetrics;
  deleting: boolean;
  onDelete: (id: number, name: string) => void;
}

const TenantMobileCard: React.FC<TenantMobileCardProps> = ({ tenant, deleting, onDelete }) => {
  const latestActivity = [
    tenant.activity.latest_task,
    tenant.activity.latest_user,
    tenant.activity.latest_contact,
    tenant.activity.latest_transaction,
  ]
    .filter(Boolean)
    .map(value => new Date(value as string))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <div className="rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{tenant.tenant.name}</p>
          <p className="text-[12px] text-muted-foreground">{tenant.tenant.slug}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:hover:bg-red-500/15"
          onClick={() => onDelete(tenant.tenant.id, tenant.tenant.name)}
          disabled={deleting}
          aria-label="Excluir tenant"
        >
          {deleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">Usuários ativos</p>
          <p>
            {numberFormatter.format(tenant.metrics.users_active_24h)} / {numberFormatter.format(tenant.metrics.users_total)}
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Sessões recentes</p>
          <p>{numberFormatter.format(tenant.metrics.sessions_active_5m)}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Tarefas (30d)</p>
          <p>{numberFormatter.format(tenant.metrics.tasks_last_30_days)}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Receita</p>
          <p>{currency.format(tenant.metrics.transactions.net)}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Última atividade: {latestActivity ? latestActivity.toLocaleString('pt-BR') : 'Sem atividade recente'}
      </p>
    </div>
  );
};

export default AdminDashboard;
