import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('fernandokerber@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0e7ff] px-4 py-10">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl border border-border/30 bg-white/90 shadow-2xl backdrop-blur-xl">
        <div className="relative hidden flex-1 flex-col justify-between bg-primary text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_55%)] opacity-80" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-white/70">
                <span className="h-px flex-1 bg-white/30" />
                CRM Jurídico
                <span className="h-px flex-1 bg-white/30" />
              </div>
              <h1 className="text-3xl font-bold leading-tight text-white">
                Workflow Studio <br /> para equipes jurídicas modernas.
              </h1>
              <p className="max-w-sm text-sm text-white/80">
                Centralize tarefas, acompanhe processos em tempo real e colabore com o time em um
                único painel de controle.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Destaques</p>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Kanban intuitivo para gestão de processos</li>
                <li>• Automatizações e alertas de prazos críticos</li>
                <li>• Indicadores para acompanhar metas e receitas</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center bg-white px-6 py-10 sm:px-12">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/80">
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
              <label className="text-sm font-medium text-muted-foreground">E-mail corporativo</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border/60 bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="font-medium text-muted-foreground">Senha</label>
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80 transition hover:text-primary"
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
                className="w-full rounded-xl border border-border/60 bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
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
        </div>
      </div>
    </div>
  );
};

export default Login;
