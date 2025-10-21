import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiClient } from '../../services/adminApi';
import { ApiError } from '../../services/api';
import { useAdminAuth } from '../../store/AdminAuthContext';
import { Tenant } from '../../types/types';
import { Button } from '../../components/ui/Button';

type StatusOption = 'active' | 'inactive';

type TenantAdminSummary = {
  id: number;
  name: string;
  email: string;
};

type TenantCreationResponse = Tenant | {
  tenant: Tenant;
  admin?: TenantAdminSummary | null;
};

const isTenantCreationWrapper = (
  value: unknown
): value is { tenant: Tenant; admin?: TenantAdminSummary | null } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'tenant' in value && typeof (value as { tenant?: unknown }).tenant === 'object';
};

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
  const [createAdminAccount, setCreateAdminAccount] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirmation, setAdminPasswordConfirmation] = useState('');

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

    if (createAdminAccount) {
      if (!adminName.trim() || !adminEmail.trim() || !adminPassword || !adminPasswordConfirmation) {
        setError('Informe nome, e-mail e senha para o administrador do tenant.');
        return;
      }

      if (adminPassword.length < 8) {
        setError('A senha do administrador deve conter pelo menos 8 caracteres.');
        return;
      }

      if (adminPassword !== adminPasswordConfirmation) {
        setError('A confirmação da senha do administrador não confere.');
        return;
      }
    }

    try {
      setLoading(true);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        status,
      };

      if (finalSlug) {
        payload.slug = finalSlug;
      }

      if (createAdminAccount) {
        payload.admin_name = adminName.trim();
        payload.admin_email = adminEmail.trim().toLowerCase();
        payload.admin_password = adminPassword;
        payload.admin_password_confirmation = adminPasswordConfirmation;
      }

      const createdResponse = await adminApiClient.post<TenantCreationResponse>('tenants', payload, token);
      const createdTenant = isTenantCreationWrapper(createdResponse)
        ? mapTenantFromApi(createdResponse.tenant)
        : mapTenantFromApi(createdResponse);
      const createdAdmin = isTenantCreationWrapper(createdResponse) ? createdResponse.admin ?? null : null;

      const adminInfo = createdAdmin ? ` Administrador criado: ${createdAdmin.email}.` : '';
      setSuccess(`Tenant "${createdTenant.name}" criado com sucesso (${createdTenant.slug}).${adminInfo}`);
      setName('');
      setSlugInput('');
      setStatus('active');
      if (createAdminAccount) {
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        setAdminPasswordConfirmation('');
      }

      await fetchTenants();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }
        let validationMessage = '';

        if (typeof err.data === 'object' && err.data) {
          if ('message' in (err.data as Record<string, unknown>)) {
            validationMessage = String((err.data as Record<string, unknown>).message ?? '');
          }

          if (!validationMessage && 'errors' in (err.data as Record<string, unknown>)) {
            const errors = (err.data as { errors?: Record<string, string[] | string> }).errors;
            if (errors) {
              const firstError = Object.values(errors).flat().find(Boolean);
              if (typeof firstError === 'string') {
                validationMessage = firstError;
              }
            }
          }
        }

        if (!validationMessage) {
          validationMessage = err.message;
        }
        setError(validationMessage || 'Não foi possível criar o tenant.');
      } else {
        setError('Não foi possível criar o tenant. Tente novamente.');
      }
    } finally {
      setLoading(false);
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
        <div className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50/70 p-4 text-sm text-slate-700 shadow-sm dark:border-sky-500/40 dark:bg-sky-900/30 dark:text-slate-100">
          <p className="font-semibold text-slate-800 dark:text-white">Precisa publicar o CRM em produção?</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-200">
            Consulte o passo a passo completo de deploy (Laravel + React + Nginx + HTTPS) para subir um novo workspace em uma VPS.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/instructions.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Abrir guia de deploy
            </a>
          </div>
        </div>

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

          <div className="space-y-4 rounded-2xl border border-dashed border-border/60 bg-surface/60 p-4 dark:border-dark-border/50 dark:bg-dark-surface/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Conta de administrador</p>
                <p className="text-xs text-muted-foreground">
                  Gere credenciais iniciais para acessar o workspace recém-criado.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border/70 text-primary focus:ring-primary/40 dark:border-dark-border/60"
                  checked={createAdminAccount}
                  onChange={event => setCreateAdminAccount(event.target.checked)}
                />
                Gerar credenciais
              </label>
            </div>

            {createAdminAccount && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">Nome completo</span>
                  <input
                    type="text"
                    value={adminName}
                    onChange={event => setAdminName(event.target.value)}
                    placeholder="Ex: Diego Carvalho"
                    autoComplete="name"
                    className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">E-mail</span>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={event => setAdminEmail(event.target.value)}
                    placeholder="admin@empresa.com"
                    autoComplete="username"
                    className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">Senha</span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={event => setAdminPassword(event.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">Confirmar senha</span>
                  <input
                    type="password"
                    value={adminPasswordConfirmation}
                    onChange={event => setAdminPasswordConfirmation(event.target.value)}
                    placeholder="Repita a senha"
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
                  />
                </label>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              O administrador criado terá acesso total ao workspace e poderá convidar novos usuários.
            </p>
          </div>

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
