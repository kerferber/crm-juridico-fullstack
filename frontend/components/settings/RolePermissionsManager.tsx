import React, { useEffect, useMemo, useState } from 'react';
import { PermissionDefinition, PermissionKey, RoleDefinition } from '../../types/types';
import { Button } from '../ui/Button';
import { Plus, Trash2, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RolePermissionsManagerProps {
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  onAddRole: (data: {
    name: string;
    description?: string;
    color?: string;
    baseRoleId?: string;
    permissions?: Partial<Record<PermissionKey, boolean>>;
  }) => RoleDefinition | null;
  onUpdateRole: (
    roleId: string,
    updates: Partial<Pick<RoleDefinition, 'name' | 'description' | 'color'>>
  ) => void;
  onRemoveRole: (roleId: string) => void;
  onTogglePermission: (roleId: string, permission: PermissionKey, enabled: boolean) => void;
}

const colorPalette = ['#1D4ED8', '#0EA5E9', '#22C55E', '#F97316', '#6366F1', '#E11D48', '#14B8A6'];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  roles,
  permissions,
  onAddRole,
  onUpdateRole,
  onRemoveRole,
  onTogglePermission,
}) => {
  const [activeRoleId, setActiveRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleColor, setNewRoleColor] = useState(colorPalette[0]);
  const [newRoleBaseId, setNewRoleBaseId] = useState('');
  const [roleForm, setRoleForm] = useState<{ name: string; description: string; color?: string }>({
    name: '',
    description: '',
    color: colorPalette[0],
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!roles.length) {
      setActiveRoleId(null);
      return;
    }
    if (activeRoleId && roles.some(role => role.id === activeRoleId)) {
      return;
    }
    setActiveRoleId(roles[0].id);
  }, [activeRoleId, roles]);

  const activeRole = useMemo(
    () => roles.find(role => role.id === activeRoleId) ?? null,
    [roles, activeRoleId]
  );

  useEffect(() => {
    if (!activeRole) return;
    setRoleForm({
      name: activeRole.name,
      description: activeRole.description ?? '',
      color: activeRole.color,
    });
  }, [activeRole]);

  useEffect(() => {
    if (!isCreating) {
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleColor(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
      setNewRoleBaseId('');
    }
  }, [isCreating]);

  const permissionGroups = useMemo(() => {
    const groups: Record<string, PermissionDefinition[]> = {};
    permissions.forEach(permission => {
      const group = permission.category ?? 'Outros';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(permission);
    });
    return groups;
  }, [permissions]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2200);
  };

  const handleCreateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      showFeedback('Escolha um nome para o novo perfil.');
      return;
    }
    if (
      roles.some(role => normalize(role.name) === normalize(trimmedName))
    ) {
      showFeedback('Já existe um perfil com esse nome.');
      return;
    }
    const created = onAddRole({
      name: trimmedName,
      description: newRoleDescription.trim(),
      color: newRoleColor,
      baseRoleId: newRoleBaseId || undefined,
    });
    if (!created) {
      showFeedback('Não foi possível criar o perfil. Tente outro nome.');
      return;
    }
    setActiveRoleId(created.id);
    setIsCreating(false);
    showFeedback('Perfil criado com sucesso.');
  };

  const handleSaveRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeRole) return;
    const trimmedName = roleForm.name.trim();
    if (!trimmedName) {
      showFeedback('O nome do perfil não pode ficar vazio.');
      return;
    }
    const duplicated = roles.some(
      role => role.id !== activeRole.id && normalize(role.name) === normalize(trimmedName)
    );
    if (duplicated) {
      showFeedback('Já existe outro perfil com esse nome.');
      return;
    }
    onUpdateRole(activeRole.id, {
      name: trimmedName,
      description: roleForm.description.trim(),
      color: roleForm.color,
    });
    showFeedback('Perfil atualizado.');
  };

  const handleRemoveRole = () => {
    if (!activeRole) return;
    if (activeRole.isSystem) {
      showFeedback('Perfis padrão não podem ser removidos.');
      return;
    }
    onRemoveRole(activeRole.id);
    showFeedback('Perfil removido.');
  };

  const togglePermission = (permission: PermissionDefinition) => {
    if (!activeRole) return;
    const enabled = Boolean(activeRole.permissions[permission.id]);
    onTogglePermission(activeRole.id, permission.id, !enabled);
  };

  if (!roles.length || !activeRole) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
        <p>Nenhum perfil configurado ainda. Crie um perfil para começar.</p>
        <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo perfil
        </Button>
        {isCreating && (
          <form
            onSubmit={handleCreateRole}
            className="space-y-3 rounded-xl border border-border/60 bg-white p-4 dark:border-dark-border/60 dark:bg-dark-background/60"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground dark:text-dark-foreground">Nome</span>
                <input
                  value={newRoleName}
                  onChange={event => setNewRoleName(event.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                  placeholder="Ex: Atendimento"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground dark:text-dark-foreground">Cor</span>
                <input
                  type="color"
                  value={newRoleColor}
                  onChange={event => setNewRoleColor(event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-border/60 bg-white p-1 dark:border-dark-border/60 dark:bg-dark-card/80"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">
                Basear permissões em
              </span>
              <select
                value={newRoleBaseId}
                onChange={event => setNewRoleBaseId(event.target.value)}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
              >
                <option value="">Criar do zero</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">Descrição</span>
              <textarea
                rows={2}
                value={newRoleDescription}
                onChange={event => setNewRoleDescription(event.target.value)}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                placeholder="Explique quando usar este perfil."
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="px-4">
                Criar perfil
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="flex w-full flex-row gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-white p-2 dark:border-dark-border/60 dark:bg-dark-card/70 lg:h-full lg:w-72 lg:flex-col">
        {roles.map(role => {
          const isActive = role.id === activeRole.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRoleId(role.id)}
              className={cn(
                'flex flex-1 items-center gap-3 rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:flex-none',
                isActive
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/20 dark:hover:bg-dark-border/40'
              )}
            >
              <span
                className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: role.color || '#CBD5F5' }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{role.name}</p>
                <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  {role.isSystem ? 'Perfil padrão' : 'Personalizado'}
                </span>
              </div>
            </button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="flex h-auto flex-col gap-1 rounded-xl border-dashed px-3 py-4 text-xs text-muted-foreground"
          onClick={() => setIsCreating(prev => !prev)}
        >
          <Plus className="mx-auto h-4 w-4" />
          Novo perfil
        </Button>
      </aside>

      <section className="flex-1 space-y-5 rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Perfis de acesso
            </p>
            <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
              {activeRole.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Ajuste o que cada perfil pode ver e executar dentro da plataforma.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {feedback && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5" />
                {feedback}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveRole}
                disabled={activeRole.isSystem}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 disabled:text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            </div>
          </div>
        </header>

        {isCreating && (
          <form
            onSubmit={handleCreateRole}
            className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4 dark:border-dark-border/60 dark:bg-dark-background/60"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground dark:text-dark-foreground">Nome</span>
                <input
                  value={newRoleName}
                  onChange={event => setNewRoleName(event.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                  placeholder="Ex: Financeiro Júnior"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground dark:text-dark-foreground">Cor</span>
                <input
                  type="color"
                  value={newRoleColor}
                  onChange={event => setNewRoleColor(event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-border/60 bg-white p-1 dark:border-dark-border/60 dark:bg-dark-card/80"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">
                Basear permissões em
              </span>
              <select
                value={newRoleBaseId}
                onChange={event => setNewRoleBaseId(event.target.value)}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
              >
                <option value="">Criar do zero</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">Descrição</span>
              <textarea
                rows={2}
                value={newRoleDescription}
                onChange={event => setNewRoleDescription(event.target.value)}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                placeholder="Ex: acesso restrito ao módulo financeiro."
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="px-4">
                Criar perfil
              </Button>
            </div>
          </form>
        )}

        <form
          onSubmit={handleSaveRole}
          className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4 dark:border-dark-border/60 dark:bg-dark-background/60"
        >
          <div className="grid gap-4 sm:grid-cols-[2fr,120px]">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">
                Nome do perfil
              </span>
              <input
                value={roleForm.name}
                onChange={event =>
                  setRoleForm(prev => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                disabled={activeRole.isSystem}
                maxLength={60}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">Cor</span>
              <input
                type="color"
                value={roleForm.color || '#CBD5F5'}
                onChange={event =>
                  setRoleForm(prev => ({ ...prev, color: event.target.value }))
                }
                className="h-10 w-full cursor-pointer rounded-lg border border-border/60 bg-white p-1 dark:border-dark-border/60 dark:bg-dark-card/80"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground dark:text-dark-foreground">Descrição</span>
            <textarea
              rows={2}
              value={roleForm.description}
              onChange={event =>
                setRoleForm(prev => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
              placeholder="Explique para a equipe como este perfil deve ser usado."
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" size="sm" className="px-4">
              Atualizar perfil
            </Button>
          </div>
        </form>

        <div className="space-y-5">
          {Object.keys(permissionGroups).map(groupName => {
            const groupPermissions = permissionGroups[groupName] ?? [];
            return (
              <div key={groupName} className="rounded-xl border border-border/60 p-4 dark:border-dark-border/60">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                      {groupName}
                    </p>
                  <p className="text-xs text-muted-foreground">
                    Defina o acesso a recursos ligados a {groupName.toLowerCase()}.
                  </p>
                </div>
                {groupName === 'Administração' && activeRole.isSystem && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Crítico
                  </span>
                )}
              </div>
              <ul className="space-y-3">
                {groupPermissions.map(permission => {
                  const enabled = Boolean(activeRole.permissions[permission.id]);
                  return (
                    <li
                      key={permission.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-white p-3 dark:border-dark-border/60 dark:bg-dark-background/60 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground dark:text-dark-foreground">
                          {permission.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePermission(permission)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          enabled ? 'bg-primary' : 'bg-border/60 dark:bg-dark-border/60'
                        )}
                        aria-pressed={enabled}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
                            enabled ? 'right-0.5' : 'left-0.5'
                          )}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default RolePermissionsManager;
