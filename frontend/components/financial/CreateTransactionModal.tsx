import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Loader2, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { useApp } from '../../store/AppContext';
import { TransactionType } from '../../types/types';

const CreateTransactionModal: React.FC = () => {
  const { isOpen, type, close, open } = useTransactionModal();
  const { addTransaction } = useApp();

  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('Conta Principal');
  const [value, setValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setDescription('');
      setCategory('');
      setAccount('Conta Principal');
      setValue(0);
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
  }, [isOpen, close]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição.');
      return;
    }
    if (!date) {
      setError('Informe a data da movimentação.');
      return;
    }
    if (!value || value <= 0) {
      setError('Informe um valor positivo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addTransaction({
        date,
        description: description.trim(),
        category: category.trim() || (type === TransactionType.Receita ? 'Receitas Diversas' : 'Despesas Gerais'),
        account: account.trim() || 'Conta Principal',
        value,
        type,
      });
      close();
    } catch (err) {
      setError('Não foi possível registrar a transação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === TransactionType.Receita ? 'Nova Receita' : 'Nova Despesa';
  const AccentIcon = type === TransactionType.Receita ? ArrowUpCircle : ArrowDownCircle;
  const accentColor = type === TransactionType.Receita ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" onClick={close}>
      <div
        className="relative flex w-full max-w-lg flex-col rounded-xl border border-border/60 bg-white shadow-xl dark:border-dark-border/70 dark:bg-dark-card"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 dark:border-dark-border/70">
          <div className="flex items-center gap-3">
            <AccentIcon className={`${accentColor} h-6 w-6`} />
            <div>
              <h2 className="text-[18px] font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">Registre movimentações financeiras para acompanhar o caixa.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-5 py-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
          <label className="flex flex-col gap-1 text-xs font-medium">
            Data
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Descrição
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              placeholder={type === TransactionType.Receita ? 'Ex.: Honorários processo 2025/004' : 'Ex.: Custas processuais'}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium">
              Categoria
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
                placeholder="Ex.: Honorários"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Conta
              <input
                type="text"
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
                placeholder="Ex.: Conta Principal"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Valor (R$)
              <input
                type="number"
                min={0}
                step={0.01}
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 dark:border-dark-border/60 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" type="button" onClick={close} disabled={isSubmitting}>Cancelar</Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => open(type === TransactionType.Receita ? TransactionType.Despesa : TransactionType.Receita)}
                disabled={isSubmitting}
              >
                Converter para {type === TransactionType.Receita ? 'Despesa' : 'Receita'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : 'Registrar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTransactionModal;
