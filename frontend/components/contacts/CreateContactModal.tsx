import React, { useEffect, useMemo, useState } from 'react';
import { X, UserPlus2, Loader2, Sparkles } from 'lucide-react';
import { useContactModal } from '../../hooks/useContactModal';
import { useApp } from '../../store/AppContext';
import { Button } from '../ui/Button';

type FormState = {
  name: string;
  document: string;
  origin: string;
  status: string;
  ownerId: string;
  lastInteraction: string;
  email: string;
  phone: string;
  profession: string;
};

const initialState: FormState = {
  name: '',
  document: '',
  origin: '',
  status: 'Lead',
  ownerId: '',
  lastInteraction: '',
  email: '',
  phone: '',
  profession: '',
};

const statusOptions = ['Lead', 'Cliente', 'Prospect'];

const CreateContactModal: React.FC = () => {
  const { isOpen, close } = useContactModal();
  const { addContact, contacts, users } = useApp();
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerOptions = useMemo(() => users.map(u => ({ value: String(u.id), label: u.name })), [users]);
  const originSuggestions = useMemo(() => {
    const values = new Set<string>();
    contacts.forEach(contact => {
      if (contact.origin) values.add(contact.origin);
    });
    return Array.from(values);
  }, [contacts]);

  const resetForm = () => {
    const defaultOwner = ownerOptions[0]?.value ?? '';
    setForm({ ...initialState, ownerId: defaultOwner });
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      const defaultOwner = ownerOptions[0]?.value ?? '';
      setForm(prev => ({ ...initialState, ownerId: prev.ownerId || defaultOwner }));
      document.body.classList.add('overflow-hidden');
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('overflow-hidden');
      };
    }
    return undefined;
  }, [isOpen, ownerOptions, close]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Informe o nome do contato.');
      return;
    }
    if (!form.ownerId) {
      setError('Selecione o responsável pelo contato.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await addContact({
        name: form.name.trim(),
        document: form.document.trim(),
        origin: form.origin.trim() || 'Indicação',
        status: form.status || 'Lead',
        ownerId: Number(form.ownerId),
        email: form.email.trim(),
        phone: form.phone.trim(),
        profession: form.profession.trim(),
        lastInteraction: form.lastInteraction ? new Date(form.lastInteraction).toISOString() : undefined,
      });
      resetForm();
      close();
    } catch (err) {
      setError('Não foi possível salvar o contato. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    close();
  };

  const handleClear = () => {
    resetForm();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6"
      onClick={handleClose}
    >
      <div
        className="relative flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-3xl border border-border/50 bg-card/90 shadow-2xl backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-card/90"
        onClick={event => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 h-24 rounded-t-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-blue-400/20" />
        <div className="relative flex items-center justify-between border-b border-border/40 bg-card/95 p-6 backdrop-blur-sm dark:border-dark-border/40 dark:bg-dark-card/95 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <UserPlus2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Novo Contato</h2>
              <p className="text-sm text-muted-foreground">
                Cadastre rapidamente um novo relacionamento e defina responsabilidades.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Fechar modal">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-8 overflow-y-auto px-6 pb-8"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome completo</label>
              <input
                type="text"
                value={form.name}
                onChange={event => handleChange('name', event.target.value)}
                placeholder="Ex.: Beatriz Costa"
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF/CNPJ</label>
              <input
                type="text"
                value={form.document}
                onChange={event => handleChange('document', event.target.value)}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={event => handleChange('email', event.target.value)}
                placeholder="contato@empresa.com"
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={event => handleChange('phone', event.target.value)}
                placeholder="(11) 99999-0000"
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Origem</label>
              <input
                list="contact-origin-options"
                value={form.origin}
                onChange={event => handleChange('origin', event.target.value)}
                placeholder="Ex.: Indicação, Website, Evento..."
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              />
              <datalist id="contact-origin-options">
                {originSuggestions.map(origin => (
                  <option key={origin} value={origin} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={event => handleChange('status', event.target.value)}
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <select
                value={form.ownerId}
                onChange={event => handleChange('ownerId', event.target.value)}
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
                required
              >
                <option value="">Selecione um responsável</option>
                {ownerOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Última interação</label>
              <input
                type="date"
                value={form.lastInteraction}
                onChange={event => handleChange('lastInteraction', event.target.value)}
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Profissão / Segmento</label>
              <input
                type="text"
                value={form.profession}
                onChange={event => handleChange('profession', event.target.value)}
                placeholder="Ex.: Diretor Financeiro, Advogada, Indústria Têxtil..."
                className="w-full rounded-xl border bg-background/70 p-3 text-sm shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-dark-border dark:bg-dark-background/70"
              />
            </div>
            <div className="md:col-span-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                <p>
                  Utilize campos completos para personalizar mensagens e campanhas. Você pode editar o contato depois
                  com mais informações relevantes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
            <Button type="button" variant="ghost" onClick={handleClear} disabled={isSubmitting}>
              Limpar formulário
            </Button>
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
                  'Salvar contato'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContactModal;
