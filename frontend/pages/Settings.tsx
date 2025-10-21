import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useApp } from '../store/AppContext';
import { ApiError } from '../services/api';
import CategoriesManager from '../components/settings/CategoriesManager';
import RolePermissionsManager from '../components/settings/RolePermissionsManager';
import GoalsManager from '../components/settings/GoalsManager';

const Settings: React.FC = () => {
  const {
    users,
    createCollaborator,
    categoryGroups,
    addCategory,
    updateCategory,
    removeCategory,
    permissionsCatalog,
    userRoles,
    addUserRole,
    updateUserRole,
    removeUserRole,
    setRolePermission,
  } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const recentCollaborators = useMemo(() => {
    return [...users]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  }, [users]);

  const handleCreateCollaborator = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);
    try {
      await createCollaborator({ name, email, password });
      setFeedback({
        type: 'success',
        message: 'Colaborador cadastrado com sucesso! Ele já pode acessar o painel.',
      });
      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setFeedback({
          type: 'error',
          message: 'Não foi possível cadastrar. Verifique se o e-mail já não está em uso.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Erro inesperado ao cadastrar colaborador. Tente novamente.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-semibold">Configurações</h1>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Equipe e Colaboradores</CardTitle>
          <CardDescription>
            Cadastre novos integrantes para que possam acessar o Workflow Studio com suas próprias
            credenciais.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[1fr,340px]">
          <form className="space-y-5 rounded-2xl border border-border/60 bg-white px-5 py-6 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70" onSubmit={handleCreateCollaborator}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Novo colaborador
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Envie acesso para alguém do time
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Informe nome, e-mail corporativo e defina uma senha temporária (mínimo 8 caracteres).
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Ex: Ana Ribeiro"
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">E-mail corporativo</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="nome@empresa.com"
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Senha inicial</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
                  autoComplete="new-password"
                />
              </div>
            </div>
            {feedback && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-600'
                }`}
              >
                {feedback.message}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                O colaborador poderá alterar a senha depois de acessar o painel.
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar colaborador'
                )}
              </Button>
            </div>
          </form>
          <div className="space-y-5 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-5 py-6 dark:border-dark-border/60 dark:bg-dark-card/60">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Equipe recente
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Últimos colaboradores registrados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe quem já tem acesso ativo à plataforma.
              </p>
            </div>
            <div className="space-y-3">
              {recentCollaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado ainda.</p>
              ) : (
                recentCollaborators.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-white px-3 py-2 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-9 w-9 rounded-full border border-border/40 object-cover"
                      />
                      <div className="space-y-0">
                        <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                          {user.name}
                        </p>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/70">
                      Ativo
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências do Usuário</CardTitle>
          <CardDescription>
            Gerencie suas preferências de tema, idioma e notificações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tema</label>
              <select className="w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-foreground dark:border-dark-border/60 dark:text-dark-foreground">
                <option>Claro</option>
                <option>Escuro</option>
                <option>Sistema</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Idioma</label>
              <input
                type="text"
                value="Português (Brasil)"
                disabled
                className="w-full rounded-md border border-border/60 bg-gray-100 px-3 py-2 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-border/50"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Biblioteca de Categorias</CardTitle>
          <CardDescription>
            Personalize os rótulos utilizados em tarefas, leads, processos, contatos, documentos e
            finanças para adaptar o sistema ao seu fluxo.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-6 sm:px-6">
          <CategoriesManager
            categoryGroups={categoryGroups}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onRemoveCategory={removeCategory}
          />
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Perfis e Permissões</CardTitle>
          <CardDescription>
            Defina papéis como administrador, advogado, estagiário ou financeiro e escolha o que cada
            perfil pode acessar e editar dentro do CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-6 sm:px-6">
          <RolePermissionsManager
            roles={userRoles}
            permissions={permissionsCatalog}
            onAddRole={addUserRole}
            onUpdateRole={updateUserRole}
            onRemoveRole={removeUserRole}
            onTogglePermission={setRolePermission}
          />
        </CardContent>
      </Card>

      <GoalsManager />
    </div>
  );
};

export default Settings;
