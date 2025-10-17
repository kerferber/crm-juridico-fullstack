import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { X, LayoutDashboard, Loader2, CalendarDays, ClipboardList, Paperclip, Bell } from 'lucide-react';
import { useKanbanCardModal } from '../../hooks/useKanbanCardModal';
import { useApp } from '../../store/AppContext';
import { Button } from '../ui/Button';
import { KanbanCard, KanbanColumn, KanbanPhase } from '../../types/types';
import { cn } from '../../lib/utils';

type FormState = {
  title: string;
  description: string;
  column: KanbanColumn;
  phase: KanbanPhase;
  area: KanbanCard['area'];
  responsibleId: string;
  deadline: string;
  hasAttachments: boolean;
  hasReminder: boolean;
};

const areaOptions: KanbanCard['area'][] = ['Cível', 'Trabalhista', 'Previdenciário', 'Não definido'];
const columnOptions = Object.values(KanbanColumn);
const phaseOptions = Object.values(KanbanPhase);

const getInitialState = (defaults?: { column: KanbanColumn; phase: KanbanPhase }, responsibleFallback = ''): FormState => ({
  title: '',
  description: '',
  column: defaults?.column ?? KanbanColumn.Prospeccao,
  phase: defaults?.phase ?? KanbanPhase.Judicial,
  area: 'Não definido',
  responsibleId: responsibleFallback,
  deadline: '',
  hasAttachments: false,
  hasReminder: false,
});

const KanbanCardModal: React.FC = () => {
  const { isOpen, mode, card, defaults, close } = useKanbanCardModal();
  const { users, addKanbanCard, updateKanbanCardColumn, updateKanbanCardDetails } = useApp();

  const defaultResponsible = useMemo(
    () => (users.length > 0 ? String(users[0].id) : ''),
    [users]
  );

  const [form, setForm] = useState<FormState>(getInitialState(defaults, defaultResponsible));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(getInitialState(defaults, defaultResponsible));
      setError(null);
      document.body.classList.remove('overflow-hidden');
      return;
    }

    document.body.classList.add('overflow-hidden');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (mode === 'edit' && card) {
      setForm({
        title: card.title,
        description: card.description ?? '',
        column: card.column,
        phase: card.phase,
        area: card.area,
        responsibleId: card.responsibleId ? String(card.responsibleId) : defaultResponsible,
        deadline: card.deadline ? dayjs(card.deadline).format('YYYY-MM-DD') : '',
        hasAttachments: card.hasAttachments,
        hasReminder: card.hasReminder,
      });
    } else {
      setForm(getInitialState(defaults, defaultResponsible));
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, mode, card, defaults, defaultResponsible, close]);

  const handleClose = () => {
    setForm(getInitialState(defaults, defaultResponsible));
    setError(null);
    close();
  };

  const handleChange = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setError('Informe um título para o card.');
      return;
    }
    const trimmedDescription = form.description.trim();

    const responsibleId = form.responsibleId
      ? Number(form.responsibleId)
      : users[0]?.id ?? 0;

    const deadlineIso = form.deadline ? dayjs(form.deadline).toISOString() : '';
    const computedIsDelayed = deadlineIso ? dayjs(deadlineIso).isBefore(dayjs(), 'day') : false;

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        await addKanbanCard({
          title: trimmedTitle,
          description: trimmedDescription,
          column: form.column,
          phase: form.phase,
          area: form.area,
          responsibleId,
          hasAttachments: form.hasAttachments,
          hasReminder: form.hasReminder,
          commentsCount: 0,
          isDelayed: computedIsDelayed,
          deadline: deadlineIso || undefined,
        });
      } else if (mode === 'edit' && card) {
        const updates: Partial<Omit<KanbanCard, 'id'>> = {
          title: trimmedTitle,
          description: trimmedDescription,
          area: form.area,
          responsibleId,
          hasAttachments: form.hasAttachments,
          hasReminder: form.hasReminder,
        };

        const previousDeadline = card.deadline ? dayjs(card.deadline).format('YYYY-MM-DD') : '';
        if (previousDeadline !== form.deadline) {
          updates.deadline = deadlineIso || undefined;
          updates.isDelayed = computedIsDelayed;
        }

        if (form.column !== card.column || form.phase !== card.phase) {
          await updateKanbanCardColumn(card.id, form.column, form.phase);
        }

        await updateKanbanCardDetails(card.id, updates);
      }

      handleClose();
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar o card. Tente novamente.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  if (!isOpen) {
    return null;
  }

  const title = mode === 'edit' ? 'Editar card' : 'Novo card';
  const submitLabel = mode === 'edit' ? 'Salvar alterações' : 'Criar card';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative flex w-full max-w-3xl max-h-[94vh] flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-card/95"
        onClick={event => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 h-20 rounded-t-3xl bg-gradient-to-r from-primary/25 via-primary/10 to-indigo-400/20" />
        <header className="relative flex items-center justify-between border-b border-border/50 px-6 py-5 dark:border-dark-border/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              {mode === 'edit' ? <ClipboardList className="h-6 w-6" /> : <LayoutDashboard className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                Organize as informações principais do lead antes de avançar no pipeline.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Fechar modal">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={event => handleChange('title', event.target.value)}
                  placeholder="Ex.: Reunião com cliente - Proposta inicial"
                  className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={event => handleChange('description', event.target.value)}
                  placeholder="Adicione detalhes importantes, próximos passos ou observações."
                  rows={5}
                  className="w-full rounded-2xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável</label>
                <select
                  value={form.responsibleId}
                  onChange={event => handleChange('responsibleId', event.target.value)}
                  className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                >
                  <option value="">Definir depois</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Área</label>
                <select
                  value={form.area}
                  onChange={event => handleChange('area', event.target.value as KanbanCard['area'])}
                  className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                >
                  {areaOptions.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Prazo
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={event => handleChange('deadline', event.target.value)}
                  className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleChange('hasAttachments', !form.hasAttachments)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm transition',
                    form.hasAttachments
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background/70 text-muted-foreground dark:border-dark-border dark:bg-dark-background/70'
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                  {form.hasAttachments ? 'Com anexos' : 'Sem anexos'}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('hasReminder', !form.hasReminder)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm transition',
                    form.hasReminder
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background/70 text-muted-foreground dark:border-dark-border dark:bg-dark-background/70'
                  )}
                >
                  <Bell className="h-4 w-4" />
                  {form.hasReminder ? 'Lembrete ativo' : 'Sem lembrete'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fase</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {phaseOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChange('phase', option)}
                    className={cn(
                      'rounded-xl border p-3 text-sm transition',
                      form.phase === option
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background/70 text-muted-foreground hover:border-border/80 dark:border-dark-border dark:bg-dark-background/70 dark:hover:border-dark-border/80'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Coluna</label>
              <select
                value={form.column}
                onChange={event => handleChange('column', event.target.value as KanbanColumn)}
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              >
                {columnOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <footer className="flex items-center justify-between border-t border-border/40 pt-4 dark:border-dark-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Cards atualizados aqui refletem instantaneamente no pipeline.
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default KanbanCardModal;
