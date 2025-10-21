import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, tenantSlug, setTenantSlug } = useAuth();
  const [email, setEmail] = useState('fernandokerber@gmail.com');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState(() => tenantSlug ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (tenantSlug && !tenant) {
      setTenant(tenantSlug);
    }
  }, [tenant, tenantSlug]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const normalizedTenant = tenant.trim();

      if (!normalizedTenant) {
        setError('Informe o identificador do workspace (tenant).');
        return;
      }

      setTenantSlug(normalizedTenant);
      await login(email, password, normalizedTenant);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
          setError(err.message || 'Falha ao autenticar. Tente novamente.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 dark:bg-dark-background">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-xl dark:border-dark-border/60 dark:bg-dark-surface">
        <div className="hidden flex-1 flex-col justify-between bg-primary text-primary-foreground lg:flex">
          <div className="flex h-full flex-col justify-between p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary-foreground/80">
                <span className="h-px flex-1 bg-primary-foreground/30" />
                CRM Jurídico
                <span className="h-px flex-1 bg-primary-foreground/30" />
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-primary-foreground">
                Workflow Studio para equipes jurídicas modernas.
              </h1>
              <p className="max-w-sm text-sm text-primary-foreground/80">
                Centralize tarefas, acompanhe processos em tempo real e colabore com o time em um
                único painel de controle.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl bg-primary-foreground/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-foreground/70">
                Destaques
              </p>
              <ul className="space-y-2 text-sm text-primary-foreground/90">
                <li>• Kanban intuitivo para gestão de processos</li>
                <li>• Automatizações e alertas de prazos críticos</li>
                <li>• Indicadores para acompanhar metas e receitas</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center bg-surface px-6 py-10 dark:bg-dark-surface sm:px-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-[28px] font-semibold text-foreground">
              Entre com sua conta
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bem-vindo de volta! Use suas credenciais para acessar o Workflow Studio.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Identificador do workspace
              </label>
              <input
                type="text"
                required
                autoComplete="organization"
                placeholder="ex: meu-escritorio"
                value={tenant}
                onChange={event => setTenant(event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">E-mail corporativo</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="font-medium text-muted-foreground">Senha</label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition hover:brightness-110"
                  onClick={() => setPassword('')}
                >
                  Limpar
                </button>
              </div>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="relative flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-lg transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/50"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Entrando...
                </div>
              ) : (
                'Acessar painel'
              )}
            </Button>
          </form>
          <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span className="h-px flex-1 bg-border/60" />
            CRM Jurídico · Workflow Studio
            <span className="h-px flex-1 bg-border/60" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Precisa criar um workspace?{' '}
            <Link to="/admin/login" className="font-semibold text-primary hover:underline">
              Abrir painel de tenants
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
