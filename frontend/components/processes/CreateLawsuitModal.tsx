import React, { useEffect, useMemo, useState } from 'react';
import { useProcessModal } from '../../hooks/useProcessModal';
import { useApp } from '../../store/AppContext';
import { Button } from '../ui/Button';
import { Loader2, X, Briefcase } from 'lucide-react';
import ContactSearchInput from '../contacts/ContactSearchInput';
import MentionTextarea from '../inputs/MentionTextarea';
import { MentionReference } from '../../types/types';

const STATUS_OPTIONS: Array<'Ativo' | 'Fechado' | 'Arquivado'> = ['Ativo', 'Fechado', 'Arquivado'];
const FALLBACK_AREAS = ['Cível', 'Trabalhista', 'Previdenciário'];

const CreateLawsuitModal: React.FC = () => {
  const { isOpen, close, defaults } = useProcessModal();
  const { contacts, users, addLawsuit, categoryGroups } = useApp();

  const [internalNumber, setInternalNumber] = useState('');
  const [area, setArea] = useState<string>('Cível');
  const [phase, setPhase] = useState('Inicial');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Fechado' | 'Arquivado'>('Ativo');
  const [clientId, setClientId] = useState<number | ''>('');
  const [responsibleId, setResponsibleId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [mentions, setMentions] = useState<MentionReference[]>([]);

  const defaultClientId = useMemo(
    () => defaults?.clientId ?? contacts[0]?.id ?? '',
    [contacts, defaults]
  );
  const defaultResponsibleId = useMemo(
    () => defaults?.responsibleId ?? users[0]?.id ?? '',
    [users, defaults]
  );

  const areaOptions = useMemo(() => {
    const group = categoryGroups.find(categoryGroup => categoryGroup.id === 'lawsuits');
    if (group && group.items.length > 0) {
      return group.items.map(item => item.name);
    }
    return FALLBACK_AREAS;
  }, [categoryGroups]);

  useEffect(() => {
    if (isOpen) {
      setInternalNumber('');
      setArea(defaults?.area ?? areaOptions[0] ?? 'Cível');
      setPhase('Inicial');
      setDeadline('');
      setStatus('Ativo');
      setClientId(defaultClientId);
      setResponsibleId(defaultResponsibleId);
      setError(null);
      setNotes('');
      setMentions([]);
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
  }, [isOpen, close, defaultClientId, defaultResponsibleId, defaults, areaOptions]);

  useEffect(() => {
    if (!isOpen) return;
    if (!areaOptions.includes(area)) {
      setArea(areaOptions[0] ?? 'Cível');
    }
  }, [areaOptions, area, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!responsibleId && typeof clientId === 'number') {
      const relatedContact = contacts.find(contact => contact.id === clientId);
      if (relatedContact?.ownerId) {
        setResponsibleId(relatedContact.ownerId);
      }
    }
  }, [clientId, contacts, responsibleId, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    close();
  };

  const handleSelectClient = (id: number | '') => {
    setClientId(id);
    if (id) {
      const selected = contacts.find(contact => contact.id === id);
      if (selected?.ownerId) {
        setResponsibleId(selected.ownerId);
      }
    }
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
        notes: notes.trim() || undefined,
        mentions,
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
                onChange={e => setArea(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                {areaOptions.map(option => (
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
            <ContactSearchInput
              label="Cliente"
              contacts={contacts}
              value={clientId}
              onSelect={handleSelectClient}
              helperText="Busque pelo nome, e-mail ou documento do cliente."
            />
            <label className="flex flex-col gap-1 text-xs font-medium">
              Responsável
              <select
                value={responsibleId}
                onChange={e => {
                  const value = e.target.value;
                  setResponsibleId(value ? Number(value) : '');
                }}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              >
                <option value="" disabled>Selecione</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
          </div>

          <MentionTextarea
            label="Notas internas"
            description="Utilize @ para mencionar colegas e # para vincular contatos relevantes."
            placeholder="Ex.: Validar estratégia com @Sofia e solicitar documentos para #Empresa Alpha"
            value={notes}
            onChange={setNotes}
            onMentionsChange={setMentions}
            users={users}
            contacts={contacts}
            initialMentions={mentions}
          />

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
