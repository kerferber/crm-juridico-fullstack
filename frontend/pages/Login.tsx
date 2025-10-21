import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, tenantSlug, setTenantSlug } = useAuth();
  const [email, setEmail] = useState('fernandokerber@gmail.com');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState(() => tenantSlug ?? 'default');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (tenantSlug && (tenant === '' || tenant === 'default')) {
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#050818] via-[#0e1536] to-[#050818] px-4 py-4 text-foreground md:py-6 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-12 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-32 right-8 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
      </div>
      <div className="flex w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-white/10 shadow-[0_28px_70px_-40px_rgba(15,23,42,1)] backdrop-blur-2xl dark:border-white/5 dark:bg-white/5">
        <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-8 text-primary-foreground backdrop-blur-xl dark:from-primary/20 dark:via-primary/10 dark:to-primary/5 lg:flex lg:p-9">
          <div className="space-y-5 text-white">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
              <span className="h-px flex-1 bg-white/30" />
              Argos Lex · CRM Jurídico
              <span className="h-px flex-1 bg-white/30" />
            </div>
            <h1 className="text-[30px] font-semibold leading-snug text-white">
              O CRM jurídico que acompanha o ritmo do seu escritório.
            </h1>
            <p className="max-w-sm text-sm text-white/80">
              Centralize tarefas, prazos e relacionamentos com a precisão que a advocacia exige.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-5 text-white/90 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Destaques Argos Lex</p>
            <ul className="space-y-2 text-sm">
              <li>• Painéis em tempo real para decisões rápidas</li>
              <li>• Automação de tarefas críticas e alertas inteligentes</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center bg-white/75 px-7 py-7 backdrop-blur-xl dark:bg-slate-950/75 sm:px-10 md:px-11">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-[26px] font-semibold text-slate-900 dark:text-white">
              Entre na sua conta Argos Lex
            </h2>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Identificador do workspace
              </label>
              <input
                type="text"
                required
                autoComplete="organization"
                placeholder="default"
                value={tenant}
                onChange={event => setTenant(event.target.value)}
                className="w-full rounded-2xl border border-white/45 bg-white/70 px-4 py-[10px] text-sm text-slate-900 shadow-lg shadow-primary/5 outline-none transition focus:border-primary/70 focus:ring-4 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                E-mail corporativo
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/45 bg-white/70 px-4 py-[10px] text-sm text-slate-900 shadow-lg shadow-primary/5 outline-none transition focus:border-primary/70 focus:ring-4 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="font-medium text-slate-600 dark:text-slate-300">Senha</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary transition hover:brightness-110"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary/80 transition hover:text-primary"
                    onClick={() => setPassword('')}
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/45 bg-white/70 px-4 py-[10px] text-sm text-slate-900 shadow-lg shadow-primary/5 outline-none transition focus:border-primary/70 focus:ring-4 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
              />
            </div>
            {error && (
              <div className="rounded-2xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="relative flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 text-sm font-semibold text-white shadow-[0_16px_38px_-18px_rgba(37,99,235,1)] transition hover:scale-[1.01] focus-visible:ring-4 focus-visible:ring-primary/30"
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
          <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
            <span className="h-px flex-1 bg-slate-300/35" />
            Argos Lex · CRM Jurídico
            <span className="h-px flex-1 bg-slate-300/35" />
          </div>
          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-200 dark:text-slate-100">
            Desenvolvido por Fernando Kerber
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
