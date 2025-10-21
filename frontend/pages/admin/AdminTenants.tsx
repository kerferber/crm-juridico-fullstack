import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiClient } from '../../services/adminApi';
import { ApiError } from '../../services/api';
import { useAdminAuth } from '../../store/AdminAuthContext';
import { Tenant } from '../../types/types';
import { Button } from '../../components/ui/Button';

type StatusOption = 'active' | 'inactive';

const toSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const mapTenantFromApi = (raw: any): Tenant => ({
  id: Number(raw?.id) ?? 0,
  name: typeof raw?.name === 'string' ? raw.name : 'Tenant',
  slug: typeof raw?.slug === 'string' ? raw.slug : '',
  status: typeof raw?.status === 'string' ? raw.status : 'active',
  createdAt: typeof raw?.created_at === 'string' ? raw.created_at : undefined,
  updatedAt: typeof raw?.updated_at === 'string' ? raw.updated_at : undefined,
  usersCount: typeof raw?.users_count === 'number' ? raw.users_count : undefined,
});

const AdminTenants: React.FC = () => {
  const { token, logout } = useAdminAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [status, setStatus] = useState<StatusOption>('active');

  const fetchTenants = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.get<any[]>('tenants', token);
      const mapped = Array.isArray(response) ? response.map(mapTenantFromApi) : [];
      setTenants(mapped);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }
        setError(err.message || 'Falha ao carregar a lista de tenants.');
      } else {
        setError('Não foi possível carregar a lista de tenants.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const derivedSlug = useMemo(() => {
    if (slugInput.trim().length > 0) {
      return toSlug(slugInput);
    }
    return toSlug(name);
  }, [name, slugInput]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Sessão administrativa inválida.');
      return;
    }

    const finalSlug = derivedSlug;

    if (!finalSlug) {
      setError('Informe um nome ou slug válido para o tenant.');
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        status,
      };

      if (finalSlug) {
        payload.slug = finalSlug;
      }

      const created = await adminApiClient.post<Tenant>('tenants', payload, token);

      setSuccess(`Tenant "${created?.name ?? name}" criado com sucesso (${created?.slug ?? finalSlug}).`);
      setName('');
      setSlugInput('');
      setStatus('active');

      await fetchTenants();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }
        const validationMessage =
          typeof err.data === 'object' && err.data && 'message' in (err.data as any)
            ? String((err.data as any).message)
            : err.message;
        setError(validationMessage || 'Não foi possível criar o tenant.');
      } else {
        setError('Não foi possível criar o tenant. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Gestão de Tenants</h1>
        <p className="text-sm text-muted-foreground">
          Provisione novos workspaces e acompanhe o catálogo de tenants ativos do CRM.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm dark:border-dark-border/40 dark:bg-dark-surface">
        <h2 className="text-lg font-semibold text-foreground">Cadastrar novo tenant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe um nome amigável e, opcionalmente, um slug fixo para integrações e automações.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-muted-foreground">Nome do tenant</span>
              <input
                type="text"
                required
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Ex: Escritório Aurora"
                className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-muted-foreground">Slug (opcional)</span>
              <input
                type="text"
                value={slugInput}
                onChange={event => setSlugInput(event.target.value)}
                placeholder="ex: escritorio-aurora"
                className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
              />
              <span className="block text-xs text-muted-foreground">
                Identificador sugerido:{' '}
                <span className="font-semibold text-primary">{derivedSlug || '—'}</span>
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Status inicial</span>
            <select
              value={status}
              onChange={event => setStatus(event.target.value as StatusOption)}
              className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Tenants são usados em integrações externas (billing, automações, etc.).
            </p>
            <Button type="submit" disabled={loading || !token}>
              {loading ? 'Processando...' : 'Criar tenant'}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm dark:border-dark-border/40 dark:bg-dark-surface">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tenants cadastrados</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Carregando...' : `${tenants.length} tenant(s) disponíveis.`}
            </p>
          </div>
          <Button variant="secondary" type="button" onClick={fetchTenants} disabled={loading}>
            Atualizar lista
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-border/70 text-left text-sm dark:divide-dark-border/60">
            <thead className="bg-surface-muted dark:bg-dark-surface-muted">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Slug</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Usuários</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 dark:divide-dark-border/60">
              {tenants.map(tenantItem => (
                <tr key={tenantItem.id} className="hover:bg-surface-muted/60 dark:hover:bg-dark-surface-muted/60">
                  <td className="px-4 py-3 font-medium">{tenantItem.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <code className="rounded bg-surface-muted px-2 py-1 text-xs dark:bg-dark-surface-muted">
                      {tenantItem.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        tenantItem.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-600/20 dark:text-slate-300'
                      }`}
                    >
                      {tenantItem.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tenantItem.usersCount ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tenantItem.createdAt ? new Date(tenantItem.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhum tenant cadastrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminTenants;
