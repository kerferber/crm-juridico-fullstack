import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useApp } from '../store/AppContext';
import { ApiError } from '../services/api';
import CategoriesManager from '../components/settings/CategoriesManager';
import RolePermissionsManager from '../components/settings/RolePermissionsManager';
import GoalsManager from '../components/settings/GoalsManager';

type SettingsSection = 'collaborators' | 'preferences' | 'categories' | 'permissions' | 'goals';

const Settings: React.FC = () => {
  const {
    users,
    createCollaborator,
    updateCollaborator,
    deleteCollaborator,
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<SettingsSection, boolean>>({
    collaborators: false,
    preferences: false,
    categories: false,
    permissions: false,
    goals: false,
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRoleId && userRoles.length > 0) {
      const firstAvailable = userRoles[0]?.id ?? '';
      setSelectedRoleId(firstAvailable);
    }
  }, [userRoles, selectedRoleId]);

  const recentCollaborators = useMemo(() => {
    return [...users]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  }, [users]);

  const roleNameById = useMemo(() => {
    return new Map(userRoles.map(role => [role.id, role.name]));
  }, [userRoles]);

  const toggleSection = (section: SettingsSection) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleOpenEditCollaborator = (userId: number) => {
    const target = users.find(user => user.id === userId);
    if (!target) return;
    setEditingUserId(userId);
    setEditName(target.name);
    setEditEmail(target.email);
    setEditPassword('');
    setEditRoleId(target.roleId ?? userRoles[0]?.id ?? '');
    setEditError(null);
  };

  const handleCloseEditCollaborator = () => {
    setEditingUserId(null);
    setEditName('');
    setEditEmail('');
    setEditPassword('');
    setEditRoleId(userRoles[0]?.id ?? '');
    setEditError(null);
    setEditSubmitting(false);
  };

  const handleDeleteCollaborator = async (userId: number) => {
    const target = users.find(user => user.id === userId);
    if (!target) {
      return;
    }

    const confirmed = window.confirm(`Remover o acesso de ${target.name}?`);
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingUserId(userId);
    try {
      await deleteCollaborator(userId);
      setFeedback({
        type: 'success',
        message: 'Colaborador removido com sucesso.',
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: 'error',
        message: 'Não foi possível remover o colaborador. Tente novamente.',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUpdateCollaborator = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingUserId === null) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      await updateCollaborator(editingUserId, {
        name: editName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() ? editPassword.trim() : undefined,
        roleId: editRoleId || undefined,
      });
      handleCloseEditCollaborator();
      setFeedback({
        type: 'success',
        message: 'Colaborador atualizado com sucesso.',
      });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError && error.status === 422) {
        setEditError('Dados inválidos. Verifique se o e-mail já está em uso.');
      } else {
        setEditError('Não foi possível atualizar o colaborador. Tente novamente.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateCollaborator = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (!selectedRoleId) {
      setFeedback({ type: 'error', message: 'Selecione um perfil para o colaborador.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createCollaborator({ name, email, password, roleId: selectedRoleId || undefined });
      setFeedback({
        type: 'success',
        message: 'Colaborador cadastrado com sucesso! Ele já pode acessar o painel.',
      });
      setName('');
      setEmail('');
      setPassword('');
      setShowNewPassword(false);
      if (userRoles.length > 0) {
        setSelectedRoleId(userRoles[0]?.id ?? '');
      }
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

      <Card className="border border-border/40 shadow-sm dark:border-dark-border/40">
        <CardHeader>
          <button
            type="button"
            onClick={() => toggleSection('collaborators')}
            className="flex w-full items-start justify-between gap-3 text-left"
            aria-expanded={expandedSections.collaborators}
          >
            <div className="space-y-1">
              <CardTitle>Equipe e acessos</CardTitle>
              <CardDescription>Convide e gerencie quem pode usar o Argos Lex.</CardDescription>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-primary/10 text-primary transition dark:border-white/10 dark:bg-white/10">
              <ChevronDown
                className={`h-4 w-4 transform transition-transform ${
                  expandedSections.collaborators ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </span>
          </button>
        </CardHeader>
        {expandedSections.collaborators && (
          <CardContent className="grid gap-8 pt-4 lg:grid-cols-[1fr,320px]">
            <form
              className="space-y-5 rounded-2xl border border-border/35 bg-white px-5 py-6 shadow-sm dark:border-dark-border/40 dark:bg-dark-card/70"
              onSubmit={handleCreateCollaborator}
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Novo colaborador
                </p>
                <h3 className="text-lg font-semibold text-foreground">Envie acesso ao time</h3>
                <p className="text-sm text-muted-foreground">Defina nome, e-mail e uma senha inicial.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Ex: Ana Ribeiro"
                    className="w-full rounded-lg border border-border/35 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-foreground"
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
                    className="w-full rounded-lg border border-border/35 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-foreground"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="font-medium text-muted-foreground">Senha inicial</label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="text-xs font-semibold text-primary transition hover:brightness-110"
                    >
                      {showNewPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-lg border border-border/35 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-foreground"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Perfil de acesso</label>
                  <select
                    value={selectedRoleId}
                    onChange={event => setSelectedRoleId(event.target.value)}
                    className="w-full rounded-lg border border-border/35 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-foreground"
                    required
                  >
                    {userRoles.length === 0 ? (
                      <option value="" disabled>
                        Cadastre um perfil em "Perfis e permissões"
                      </option>
                    ) : null}
                    {userRoles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
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
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>A senha pode ser alterada após o primeiro acesso.</span>
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
            <div className="space-y-5 rounded-2xl border border-dashed border-border/35 bg-muted/10 px-5 py-6 dark:border-dark-border/40 dark:bg-dark-card/60">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Equipe recente
                </p>
                <h3 className="text-lg font-semibold text-foreground">Últimas entradas</h3>
                <p className="text-sm text-muted-foreground">Acompanhe quem recebeu acesso.</p>
              </div>
              <div className="space-y-3">
                {recentCollaborators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado ainda.</p>
                ) : (
                  recentCollaborators.map(user => (
                    <div
                      key={user.id}
                      className="flex items-stretch justify-between gap-3 rounded-lg border border-border/40 bg-white px-3 py-2 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 dark:border-dark-border/60 dark:bg-dark-card/80 dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-9 w-9 rounded-full border border-border/40 object-cover"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                            {user.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{user.email}</span>
                            {user.roleId && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-[2px] font-semibold uppercase tracking-[0.3em] text-primary dark:border-dark-primary/30 dark:bg-dark-primary/15 dark:text-dark-primary">
                                {roleNameById.get(user.roleId) ?? 'Perfil'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-stretch">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-border/60 text-primary hover:border-primary/40 hover:bg-primary/10 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
                          aria-label={`Editar ${user.name}`}
                          onClick={() => handleOpenEditCollaborator(user.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:hover:bg-red-500/15"
                          onClick={() => handleDeleteCollaborator(user.id)}
                          disabled={deletingUserId === user.id}
                          aria-label={`Remover ${user.name}`}
                        >
                          {deletingUserId === user.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border border-border/40 shadow-sm dark:border-dark-border/40">
        <CardHeader>
          <button
            type="button"
            onClick={() => toggleSection('preferences')}
            className="flex w-full items-start justify-between gap-3 text-left"
            aria-expanded={expandedSections.preferences}
          >
            <div className="space-y-1">
              <CardTitle>Preferências pessoais</CardTitle>
              <CardDescription>Ajuste tema e idioma do painel.</CardDescription>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-primary/10 text-primary transition dark:border-white/10 dark:bg-white/10">
              <ChevronDown
                className={`h-4 w-4 transform transition-transform ${
                  expandedSections.preferences ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </span>
          </button>
        </CardHeader>
        {expandedSections.preferences && (
          <CardContent className="pt-4">
            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tema</label>
                <select className="w-full rounded-md border border-border/35 bg-transparent px-3 py-2 text-sm text-foreground dark:border-dark-border/50 dark:text-dark-foreground">
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
                  className="w-full rounded-md border border-border/35 bg-gray-100 px-3 py-2 text-sm text-muted-foreground dark:border-dark-border/50 dark:bg-dark-border/50"
                />
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {editingUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/40 bg-white shadow-2xl dark:border-dark-border/60 dark:bg-dark-card">
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 dark:border-dark-border/60">
              <div>
                <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                  Editar colaborador
                </h3>
                <p className="text-xs text-muted-foreground dark:text-dark-muted">
                  Atualize os dados e o perfil de acesso do usuário.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseEditCollaborator}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar modal de edição"
              >
                ✕
              </Button>
            </div>
            <form className="space-y-4 px-6 py-6" onSubmit={handleUpdateCollaborator}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={event => setEditName(event.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">E-mail corporativo</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={event => setEditEmail(event.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span>Nova senha</span>
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editPassword}
                  onChange={event => setEditPassword(event.target.value)}
                  placeholder="Deixe em branco para manter"
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Perfil de acesso</label>
                <select
                  value={editRoleId}
                  onChange={event => setEditRoleId(event.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
                  required
                >
                  {userRoles.length === 0 ? (
                    <option value="" disabled>
                      Cadastre um perfil em \"Perfis e permissões\"
                    </option>
                  ) : null}
                  {userRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {editError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {editError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={handleCloseEditCollaborator} className="text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
                <Button type="submit" disabled={editSubmitting} className="flex items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/50">
                  {editSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="border border-border/40 shadow-sm dark:border-dark-border/40">
        <CardHeader>
          <button
            type="button"
            onClick={() => toggleSection('categories')}
            className="flex w-full items-start justify-between gap-3 text-left"
            aria-expanded={expandedSections.categories}
          >
            <div className="space-y-1">
              <CardTitle>Categorias personalizadas</CardTitle>
              <CardDescription>Organize etiquetas usadas nas rotinas.</CardDescription>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-primary/10 text-primary transition dark:border-white/10 dark:bg-white/10">
              <ChevronDown
                className={`h-4 w-4 transform transition-transform ${
                  expandedSections.categories ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </span>
          </button>
        </CardHeader>
        {expandedSections.categories && (
          <CardContent className="px-2 pb-6 pt-4 sm:px-6">
            <CategoriesManager
              categoryGroups={categoryGroups}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onRemoveCategory={removeCategory}
            />
          </CardContent>
        )}
      </Card>

      <Card className="border border-border/40 shadow-sm dark:border-dark-border/40">
        <CardHeader>
          <button
            type="button"
            onClick={() => toggleSection('permissions')}
            className="flex w-full items-start justify-between gap-3 text-left"
            aria-expanded={expandedSections.permissions}
          >
            <div className="space-y-1">
              <CardTitle>Perfis e permissões</CardTitle>
              <CardDescription>Controle o que cada cargo pode acessar.</CardDescription>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-primary/10 text-primary transition dark:border-white/10 dark:bg-white/10">
              <ChevronDown
                className={`h-4 w-4 transform transition-transform ${
                  expandedSections.permissions ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </span>
          </button>
        </CardHeader>
        {expandedSections.permissions && (
          <CardContent className="px-2 pb-6 pt-4 sm:px-6">
            <RolePermissionsManager
              roles={userRoles}
              permissions={permissionsCatalog}
              onAddRole={addUserRole}
              onUpdateRole={updateUserRole}
              onRemoveRole={removeUserRole}
              onTogglePermission={setRolePermission}
            />
          </CardContent>
        )}
      </Card>

      <Card className="border border-border/40 shadow-sm dark:border-dark-border/40">
        <CardHeader>
          <button
            type="button"
            onClick={() => toggleSection('goals')}
            className="flex w-full items-start justify-between gap-3 text-left"
            aria-expanded={expandedSections.goals}
          >
            <div className="space-y-1">
              <CardTitle>Metas e programas</CardTitle>
              <CardDescription>Acompanhe objetivos e OKRs do time.</CardDescription>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-primary/10 text-primary transition dark:border-white/10 dark:bg-white/10">
              <ChevronDown
                className={`h-4 w-4 transform transition-transform ${
                  expandedSections.goals ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </span>
          </button>
        </CardHeader>
        {expandedSections.goals && (
          <CardContent className="px-0 pb-6 pt-4 sm:px-4">
            <GoalsManager />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Settings;
