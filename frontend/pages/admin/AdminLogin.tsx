import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useAdminAuth } from '../../store/AdminAuthContext';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated } = useAdminAuth();
  const [email, setEmail] = useState('fernandokerber@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          setError('Credenciais inválidas.');
        } else {
          setError(err.message || 'Falha ao autenticar.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro inesperado ao autenticar.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 dark:bg-dark-background">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-surface p-8 shadow-xl dark:border-dark-border/60 dark:bg-dark-surface">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            Painel Administrativo
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">Entrar no dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Autentique-se para acompanhar os tenants e estatísticas globais do CRM.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">E-mail do administrador</label>
            <input
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-surface"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/50"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" /> Entrando...
              </>
            ) : (
              'Entrar no painel'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
