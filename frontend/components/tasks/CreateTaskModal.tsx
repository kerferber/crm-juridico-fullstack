import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '../ui/Button';
import { Loader2, ClipboardList, X, CheckCircle } from 'lucide-react';
import { useTaskModal } from '../../hooks/useTaskModal';
import { useApp } from '../../store/AppContext';
import { TaskStatus } from '../../types/types';

const STATUS_OPTIONS = [TaskStatus.Pendente, TaskStatus.Atrasada, TaskStatus.Concluida];

const CreateTaskModal: React.FC = () => {
  const { isOpen, mode, task, defaults, close } = useTaskModal();
  const { users, lawsuits, contacts, addTask, updateTask, updateTaskStatus } = useApp();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.Pendente);
  const [responsibleId, setResponsibleId] = useState<number | ''>('');
  const [lawsuitId, setLawsuitId] = useState<number | ''>('');
  const [contactId, setContactId] = useState<number | ''>('');
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultResponsibleId = useMemo(() => users[0]?.id ?? '', [users]);
  const filteredLawsuits = useMemo(() => {
    if (typeof contactId === 'number') {
      return lawsuits.filter(lawsuit => lawsuit.clientId === contactId);
    }
    return lawsuits;
  }, [lawsuits, contactId]);
  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const formatInputDate = (value?: string) =>
      value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : today;

    if (mode === 'edit' && task) {
      setTitle(task.title);
      setDueDate(formatInputDate(task.dueDate));
      setDeadline(formatInputDate(task.deadline));
      setStatus(task.status);
      setResponsibleId(task.responsibleId ?? defaultResponsibleId ?? '');
      setLawsuitId(task.lawsuitId ?? '');
      setContactId(task.clientId ?? '');
      setScore(task.score ?? 0);
    } else {
      setTitle(defaults?.title ?? '');
      setDueDate(formatInputDate(defaults?.dueDate));
      setDeadline(formatInputDate(defaults?.deadline));
      setStatus(defaults?.status ?? TaskStatus.Pendente);
      setResponsibleId(defaults?.responsibleId ?? defaultResponsibleId ?? '');
      setLawsuitId(defaults?.lawsuitId ?? '');
      setContactId(defaults?.clientId ?? '');
      setScore(defaults?.score ?? 0);
    }

    setError(null);
    setIsSubmitting(false);
    setIsCompleting(false);
    document.body.classList.add('overflow-hidden');

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, mode, task, defaults, close, defaultResponsibleId, today]);

  useEffect(() => {
    if (!isOpen) return;
    if (lawsuitId) {
      const selected = lawsuits.find(l => l.id === lawsuitId);
      if (selected?.clientId && contactId !== selected.clientId) {
        setContactId(selected.clientId);
      }
    }
  }, [lawsuitId, lawsuits, contactId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof contactId === 'number' && lawsuitId) {
      const selected = lawsuits.find(l => l.id === lawsuitId);
      if (selected && selected.clientId !== contactId) {
        setLawsuitId('');
      }
    }
  }, [contactId, lawsuits, lawsuitId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!responsibleId && typeof contactId === 'number') {
      const relatedContact = contacts.find(contact => contact.id === contactId);
      if (relatedContact?.ownerId) {
        setResponsibleId(relatedContact.ownerId);
      }
    }
  }, [contactId, contacts, responsibleId, isOpen]);

  if (!isOpen) return null;

  const modalTitle = mode === 'edit' ? 'Editar tarefa' : 'Nova tarefa';
  const modalDescription =
    mode === 'edit'
      ? 'Atualize os detalhes ou conclua a tarefa rapidamente.'
      : 'Defina os detalhes para acompanhar suas entregas.';
  const submitLabel = mode === 'edit' ? 'Salvar alterações' : 'Salvar tarefa';
  const isActionDisabled = isSubmitting || isCompleting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe o título da tarefa.');
      return;
    }
    if (!responsibleId) {
      setError('Selecione o responsável.');
      return;
    }
    if (!dueDate) {
      setError('Informe a data prevista.');
      return;
    }
    if (!deadline) {
      setError('Informe a data limite.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: trimmedTitle,
        dueDate,
        deadline,
        responsibleId: Number(responsibleId),
        lawsuitId: lawsuitId ? Number(lawsuitId) : undefined,
        clientId: contactId ? Number(contactId) : undefined,
        score,
        status,
      };

      if (mode === 'edit' && task) {
        await updateTask(task.id, payload);
      } else {
        await addTask(payload);
      }
      close();
    } catch (err) {
      setError(mode === 'edit' ? 'Não foi possível atualizar a tarefa.' : 'Não foi possível criar a tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsDone = async () => {
    if (!task) return;
    setIsCompleting(true);
    setError(null);
    try {
      await updateTaskStatus(task.id, TaskStatus.Concluida);
      close();
    } catch (err) {
      setError('Não foi possível concluir a tarefa.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => close();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" onClick={handleClose}>
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-xl border border-border/60 bg-white shadow-xl dark:border-dark-border/70 dark:bg-dark-card"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 dark:border-dark-border/70">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold capitalize">{modalTitle}</h2>
              <p className="text-xs text-muted-foreground">{modalDescription}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-5 py-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
          <label className="flex flex-col gap-1 text-xs font-medium">
            Título
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              placeholder="Ex.: Elaborar peça inicial"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium">
              Data prevista
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Prazo limite
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              />
            </label>
          </div>

          <ContactSearchInput
            label="Cliente relacionado"
            contacts={contacts}
            value={contactId}
            onSelect={selectedId => {
              setContactId(selectedId);
              if (selectedId) {
                const relatedLawsuits = lawsuits.filter(l => l.clientId === selectedId);
                if (relatedLawsuits.length === 1) {
                  setLawsuitId(relatedLawsuits[0].id);
                }
                const contactOwner = contacts.find(contact => contact.id === selectedId)?.ownerId;
                if (contactOwner) {
                  setResponsibleId(contactOwner);
                }
              } else {
                setLawsuitId('');
              }
            }}
            helperText="Conecte a tarefa ao cliente correto. Digite pelo menos duas letras para pesquisar."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium">
              Status inicial
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Responsável
              <select
                value={responsibleId}
                onChange={e => setResponsibleId(e.target.value ? Number(e.target.value) : '')}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                <option value="" disabled>Selecione</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Processo vinculado (opcional)
              <select
                value={lawsuitId}
                onChange={e => setLawsuitId(e.target.value ? Number(e.target.value) : '')}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                <option value="">Sem vínculo</option>
                {filteredLawsuits.map(lawsuit => (
                  <option key={lawsuit.id} value={lawsuit.id}>
                    {lawsuit.internalNumber}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Pontuação
              <input
                type="number"
                min={0}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 dark:border-dark-border/60 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" type="button" onClick={handleClose} disabled={isActionDisabled}>
              Cancelar
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
              {mode === 'edit' && task?.status !== TaskStatus.Concluida && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarkAsDone}
                  disabled={isActionDisabled}
                  className="flex items-center gap-2"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Concluindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Concluir tarefa
                    </>
                  )}
                </Button>
              )}
              <Button type="submit" disabled={isActionDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
