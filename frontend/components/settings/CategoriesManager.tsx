import React, { useEffect, useMemo, useState } from 'react';
import { CategoryGroup, CategoryGroupType, CategoryItem } from '../../types/types';
import { Button } from '../ui/Button';
import { Plus, Pencil, X, Check, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CategoriesManagerProps {
  categoryGroups: CategoryGroup[];
  onAddCategory: (
    groupId: CategoryGroupType,
    data: { name: string; color?: string; description?: string }
  ) => CategoryItem | null;
  onUpdateCategory: (
    groupId: CategoryGroupType,
    categoryId: string,
    updates: Partial<Omit<CategoryItem, 'id'>>
  ) => void;
  onRemoveCategory: (groupId: CategoryGroupType, categoryId: string) => void;
}

const colorPalette = ['#0EA5E9', '#22C55E', '#F97316', '#6366F1', '#F43F5E', '#14B8A6', '#E11D48'];

const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categoryGroups,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
}) => {
  const [activeGroup, setActiveGroup] = useState<CategoryGroupType | null>(
    categoryGroups[0]?.id ?? null
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(colorPalette[0]);
  const [newDescription, setNewDescription] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; color?: string; description?: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryGroups.length) {
      setActiveGroup(null);
      return;
    }
    if (activeGroup && categoryGroups.some(group => group.id === activeGroup)) {
      return;
    }
    setActiveGroup(categoryGroups[0].id);
  }, [activeGroup, categoryGroups]);

  useEffect(() => {
    if (!isAdding) {
      setNewName('');
      setNewDescription('');
      setNewColor(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
    }
  }, [isAdding]);

  const currentGroup = useMemo(() => {
    return categoryGroups.find(group => group.id === activeGroup) ?? null;
  }, [activeGroup, categoryGroups]);

  const handleAddCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentGroup) return;
    const created = onAddCategory(currentGroup.id, {
      name: newName.trim(),
      color: newColor,
      description: newDescription.trim(),
    });
    if (!created) {
      setFeedback('Não foi possível criar a categoria. Verifique se o nome já está em uso.');
      return;
    }
    setFeedback('Categoria adicionada com sucesso.');
    setIsAdding(false);
    setNewName('');
    setNewDescription('');
    setNewColor(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleEditStart = (item: CategoryItem) => {
    setEditing({
      id: item.id,
      name: item.name,
      color: item.color,
      description: item.description,
    });
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentGroup || !editing) return;
    if (!editing.name.trim()) {
      return;
    }
    onUpdateCategory(currentGroup.id, editing.id, {
      name: editing.name.trim(),
      color: editing.color,
      description: editing.description?.trim(),
    });
    setFeedback('Categoria atualizada.');
    setEditing(null);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleDelete = (item: CategoryItem) => {
    if (!currentGroup) return;
    if (item.isDefault) {
      setFeedback('Categorias padrão não podem ser removidas.');
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    onRemoveCategory(currentGroup.id, item.id);
  };

  if (!currentGroup) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
        Nenhuma categoria disponível no momento.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="flex w-full flex-row gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-white p-2 dark:border-dark-border/60 dark:bg-dark-card/70 lg:h-full lg:w-64 lg:flex-col">
        {categoryGroups.map(group => {
          const isActive = group.id === activeGroup;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroup(group.id)}
              className={cn(
                'flex flex-1 flex-col rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:flex-none',
                isActive
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/20 dark:hover:bg-dark-border/40'
              )}
            >
              <span className="text-sm font-semibold">{group.label}</span>
              <span className="mt-1 text-xs leading-tight text-muted-foreground">
                {group.description}
              </span>
            </button>
          );
        })}
      </nav>
      <section className="flex-1 space-y-4 rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
              {currentGroup.label}
            </h3>
            <p className="text-sm text-muted-foreground">{currentGroup.description}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Button
              variant={isAdding ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => setIsAdding(prev => !prev)}
            >
              {isAdding ? (
                <>
                  <X className="mr-1.5 h-4 w-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nova categoria
                </>
              )}
            </Button>
            {feedback && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                {feedback}
              </span>
            )}
          </div>
        </header>

        {isAdding && (
          <form
            onSubmit={handleAddCategory}
            className="space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4 dark:border-dark-border/60 dark:bg-dark-background/60"
          >
            <div className="grid gap-4 sm:grid-cols-[1fr,140px]">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground dark:text-dark-foreground">
                  Nome da categoria
                </span>
                <input
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                  placeholder="Ex: Audiência estratégica"
                  value={newName}
                  onChange={event => setNewName(event.target.value)}
                  required
                  maxLength={60}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground dark:text-dark-foreground">Cor</span>
                <input
                  type="color"
                  aria-label="Selecionar cor"
                  value={newColor}
                  onChange={event => setNewColor(event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-border/60 bg-white p-1 dark:border-dark-border/60 dark:bg-dark-card/80"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground dark:text-dark-foreground">
                Descrição (opcional)
              </span>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                placeholder="Ajuda a equipe a entender quando usar esta categoria."
                value={newDescription}
                onChange={event => setNewDescription(event.target.value)}
              />
            </label>
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="px-4">
                Salvar categoria
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {currentGroup.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-background/60">
              Nenhuma categoria cadastrada para este módulo.
            </div>
          ) : (
            currentGroup.items.map(item => {
              const isEditing = editing?.id === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-white px-4 py-3 shadow-sm transition hover:border-primary/40 dark:border-dark-border/60 dark:bg-dark-background/60"
                >
                  {isEditing ? (
                    <form className="flex flex-col gap-3 lg:flex-row lg:items-center" onSubmit={handleEditSubmit}>
                      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                        <span
                          className="h-8 w-8 flex-shrink-0 rounded-full border border-border/50"
                          style={{ backgroundColor: editing.color || '#E2E8F0' }}
                        />
                        <input
                          className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                          value={editing.name}
                          onChange={event =>
                            setEditing(prev =>
                              prev ? { ...prev, name: event.target.value } : prev
                            )
                          }
                          required
                        />
                        <input
                          type="color"
                          value={editing.color || '#E2E8F0'}
                          onChange={event =>
                            setEditing(prev =>
                              prev ? { ...prev, color: event.target.value } : prev
                            )
                          }
                          className="h-9 w-16 flex-shrink-0 cursor-pointer rounded-lg border border-border/60 dark:border-dark-border/60"
                        />
                      </div>
                      <textarea
                        rows={2}
                        className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-card/60 dark:text-dark-foreground"
                        placeholder="Descrição opcional"
                        value={editing.description ?? ''}
                        onChange={event =>
                          setEditing(prev =>
                            prev ? { ...prev, description: event.target.value } : prev
                          )
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                          Cancelar
                        </Button>
                        <Button type="submit" size="sm" className="flex items-center gap-1 px-4">
                          <Check className="h-3.5 w-3.5" />
                          Salvar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <span
                          className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full border border-border/50"
                          style={{ backgroundColor: item.color || '#E2E8F0' }}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold capitalize text-foreground dark:text-dark-foreground">
                              {item.name}
                            </p>
                            {item.isDefault && (
                              <span className="rounded-full bg-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Padrão
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(item)}
                          className="flex items-center gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={item.isDefault}
                          className="flex items-center gap-1 text-red-500 hover:text-red-600 disabled:text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoriesManager;
