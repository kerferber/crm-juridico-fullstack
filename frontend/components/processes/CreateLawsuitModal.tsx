import React, { useEffect, useMemo, useState } from 'react';
import { useProcessModal } from '../../hooks/useProcessModal';
import { useApp } from '../../store/AppContext';
import { Button } from '../ui/Button';
import { Loader2, X, Briefcase } from 'lucide-react';

const AREA_OPTIONS: Array<'Cível' | 'Trabalhista' | 'Previdenciário'> = ['Cível', 'Trabalhista', 'Previdenciário'];
const STATUS_OPTIONS: Array<'Ativo' | 'Fechado' | 'Arquivado'> = ['Ativo', 'Fechado', 'Arquivado'];

const CreateLawsuitModal: React.FC = () => {
  const { isOpen, close } = useProcessModal();
  const { contacts, users, addLawsuit } = useApp();

  const [internalNumber, setInternalNumber] = useState('');
  const [area, setArea] = useState<'Cível' | 'Trabalhista' | 'Previdenciário'>('Cível');
  const [phase, setPhase] = useState('Inicial');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Fechado' | 'Arquivado'>('Ativo');
  const [clientId, setClientId] = useState<number | ''>('');
  const [responsibleId, setResponsibleId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultClientId = useMemo(() => contacts[0]?.id ?? '', [contacts]);
  const defaultResponsibleId = useMemo(() => users[0]?.id ?? '', [users]);

  useEffect(() => {
    if (isOpen) {
      setInternalNumber('');
      setArea('Cível');
      setPhase('Inicial');
      setDeadline('');
      setStatus('Ativo');
      setClientId(defaultClientId);
      setResponsibleId(defaultResponsibleId);
      setError(null);
      document.body.classList.add('overflow-hidden');
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.classList.remove('overflow-hidden');
      };
    }
    return undefined;
  }, [isOpen, close, defaultClientId, defaultResponsibleId]);

  if (!isOpen) return null;

  const handleClose = () => {
    close();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!internalNumber.trim()) {
      setError('Informe o número interno do processo.');
      return;
    }
    if (!clientId) {
      setError('Selecione o cliente.');
      return;
    }
    if (!responsibleId) {
      setError('Selecione o responsável.');
      return;
    }
    if (!deadline) {
      setError('Informe o prazo fatal.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await addLawsuit({
        internalNumber: internalNumber.trim(),
        area,
        phase: phase.trim() || 'Inicial',
        deadline,
        status,
        clientId: Number(clientId),
        responsibleId: Number(responsibleId),
        kanbanColumn: 'Backlog',
        kanbanPhase: 'Judicial',
      });
      close();
    } catch (err) {
      setError('Falha ao salvar o processo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" onClick={handleClose}>
      <div
        className="relative flex w-full max-w-3xl flex-col rounded-xl border border-border/60 bg-white shadow-xl dark:border-dark-border/70 dark:bg-dark-card"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 dark:border-dark-border/70">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold">Novo Processo</h2>
              <p className="text-xs text-muted-foreground">Cadastre um processo completo e mantenha o pipeline atualizado.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col overflow-y-auto px-5 py-4 gap-5">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium">
              Número interno
              <input
                type="text"
                value={internalNumber}
                onChange={e => setInternalNumber(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
                placeholder="Ex.: 2025/004-CIV"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Área
              <select
                value={area}
                onChange={e => setArea(e.target.value as typeof area)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                {AREA_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Fase atual
              <input
                type="text"
                value={phase}
                onChange={e => setPhase(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
                placeholder="Ex.: Inicial, Audiência"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Prazo fatal
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Status
              <select
                value={status}
                onChange={e => setStatus(e.target.value as typeof status)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Cliente
              <select
                value={clientId}
                onChange={e => setClientId(Number(e.target.value))}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                <option value="" disabled>Selecione</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Responsável
              <select
                value={responsibleId}
                onChange={e => setResponsibleId(Number(e.target.value))}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                <option value="" disabled>Selecione</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 dark:border-dark-border/60 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" type="button" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : 'Salvar processo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLawsuitModal;
