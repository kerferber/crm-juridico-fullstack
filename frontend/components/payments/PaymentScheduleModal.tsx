import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Contact, PaymentScheduleInput } from '../../types/types';
import { Button } from '../ui/Button';
import { X, CalendarDays, PiggyBank, Sparkles, Loader2 } from 'lucide-react';
import { ApiError } from '../../services/api';

type FrequencyOption = 'monthly' | 'weekly' | 'custom';

interface PaymentScheduleModalProps {
  open: boolean;
  onClose: () => void;
  contact: Contact;
  onCreate: (payload: PaymentScheduleInput) => Promise<void>;
}

interface InstallmentFormState {
  dueDate: string;
  amount: string;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const DEFAULT_INSTALLMENTS = 3;

const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({
  open,
  onClose,
  contact,
  onCreate,
}) => {
  const initialDueDate = useMemo(() => dayjs().add(1, 'month').format('YYYY-MM-DD'), []);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [installmentsCount, setInstallmentsCount] = useState(DEFAULT_INSTALLMENTS);
  const [installmentAmount, setInstallmentAmount] = useState('0.00');
  const [firstDueDate, setFirstDueDate] = useState(initialDueDate);
  const [frequency, setFrequency] = useState<FrequencyOption>('monthly');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState<InstallmentFormState[]>([
    { dueDate: initialDueDate, amount: '0.00' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTotalAmount = useMemo(
    () => Number.parseFloat(totalAmount.replace(/\s+/g, '').replace(',', '.')) || 0,
    [totalAmount]
  );

  const pendingAmount = useMemo(() => {
    const sum = installments.reduce(
      (acc, installment) => acc + (Number.parseFloat(installment.amount) || 0),
      0
    );
    return Math.max(0, parsedTotalAmount - sum);
  }, [installments, parsedTotalAmount]);

  const payableSummary = useMemo(() => {
    const count = installments.length;
    const amountPerInstallment = count > 0 ? parsedTotalAmount / count : 0;
    return {
      count,
      total: parsedTotalAmount,
      avg: amountPerInstallment,
    };
  }, [installments.length, parsedTotalAmount]);

  const regenerateInstallments = useCallback(
    (
      desiredCount: number,
      total: number,
      referenceDate: string,
      mode: FrequencyOption,
      previous: InstallmentFormState[]
    ): InstallmentFormState[] => {
      const count = Math.max(1, desiredCount);
      if (mode === 'custom') {
        if (previous.length === count) {
          return previous;
        }
        if (previous.length < count) {
          const baseAmount = count > 0 ? (total / count).toFixed(2) : '0.00';
          const templateDate = referenceDate || dayjs().add(1, 'month').format('YYYY-MM-DD');
          const extended = [...previous];
          for (let index = previous.length; index < count; index += 1) {
            const fallbackDate =
              previous[index - 1]?.dueDate ??
              dayjs(templateDate).add(index, 'month').format('YYYY-MM-DD');
            extended.push({
              dueDate: fallbackDate,
              amount: baseAmount,
            });
          }
          return extended;
        }
        return previous.slice(0, count);
      }

      const baseDate = referenceDate
        ? dayjs(referenceDate)
        : mode === 'weekly'
        ? dayjs().add(1, 'week')
        : dayjs().add(1, 'month');
      let accumulated = 0;
      const generated: InstallmentFormState[] = [];
      for (let index = 0; index < count; index += 1) {
        const due =
          index === 0
            ? baseDate
            : baseDate
                .clone()
                .add(index, mode === 'weekly' ? 'week' : 'month');
        let amount = count > 0 ? Number((total / count).toFixed(2)) : 0;
        if (index === count - 1) {
          amount = Number((total - accumulated).toFixed(2));
        } else {
          accumulated = Number((accumulated + amount).toFixed(2));
        }
        generated.push({
          dueDate: due.format('YYYY-MM-DD'),
          amount: amount.toFixed(2),
        });
      }
      return generated;
    },
    []
  );

  const resetForm = useCallback(() => {
    setTitle('');
    setTotalAmount('0.00');
    setInstallmentsCount(DEFAULT_INSTALLMENTS);
    setFirstDueDate(initialDueDate);
    setFrequency('monthly');
    setInstallmentAmount('0.00');
    setNotes('');
    setInstallments([{ dueDate: initialDueDate, amount: '0.00' }]);
    setError(null);
    setIsSubmitting(false);
  }, [initialDueDate]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const generated = regenerateInstallments(
      installmentsCount,
      parsedTotalAmount,
      firstDueDate,
      frequency,
      installments
    );

    setInstallments(generated);
    if (frequency !== 'custom' && installmentsCount > 0) {
      const avg = parsedTotalAmount / installmentsCount;
      setInstallmentAmount(avg ? avg.toFixed(2) : '0.00');
    }
  }, [
    open,
    installmentsCount,
    parsedTotalAmount,
    firstDueDate,
    frequency,
    regenerateInstallments,
  ]);

  const handleChangeInstallment = (index: number, field: keyof InstallmentFormState, value: string) => {
    setInstallments(prev =>
      prev.map((installment, idx) =>
        idx === index
          ? {
              ...installment,
              [field]: value,
            }
          : installment
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const total = parsedTotalAmount;

    if (!total || total <= 0) {
      setError('Informe o valor total do recebimento.');
      return;
    }

    const normalizedInstallments = installments
      .map(installment => ({
        dueDate: installment.dueDate,
        amount: Number.parseFloat(installment.amount),
      }))
      .filter(installment => installment.dueDate);

    if (normalizedInstallments.length === 0) {
      setError('Defina pelo menos uma parcela com data de vencimento.');
      return;
    }

    let running = 0;
    const adjustedInstallments = normalizedInstallments.map((installment, index) => {
      let amount = Number.isFinite(installment.amount) ? installment.amount : 0;
      if (amount <= 0) {
        amount = Number((total / normalizedInstallments.length).toFixed(2));
      }
      if (index === normalizedInstallments.length - 1) {
        amount = Number((total - running).toFixed(2));
      } else {
        running = Number((running + amount).toFixed(2));
      }
      return {
        dueDate: installment.dueDate,
        amount: Number(amount.toFixed(2)),
      };
    });

    const adjustedTotal = adjustedInstallments.reduce((acc, installment) => acc + installment.amount, 0);
    if (Math.abs(adjustedTotal - total) > 0.5) {
      setError('A soma das parcelas não corresponde ao valor total informado.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreate({
        contactId: contact.id,
        title: cleanTitle || `Parcelamento ${contact.name}`,
        notes: notes.trim() || undefined,
        totalAmount: Number(total.toFixed(2)),
        installmentsCount: adjustedInstallments.length,
        installmentAmount:
          adjustedInstallments.length > 0
            ? Number((total / adjustedInstallments.length).toFixed(2))
            : Number(total.toFixed(2)),
        firstDueDate: adjustedInstallments[0]?.dueDate ?? null,
        installments: adjustedInstallments,
      });
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          const message =
            typeof err.data === 'object' && err.data && 'message' in err.data
              ? String((err.data as { message?: string }).message)
              : err.message;
          setError(message || 'Não foi possível salvar o cronograma de pagamentos.');
        } else {
          setError(err.message || 'Não foi possível salvar o cronograma de pagamentos.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível salvar o cronograma de pagamentos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  const averageInstallmentPreview =
    installmentsCount > 0 ? formatCurrency(parsedTotalAmount / installmentsCount || 0) : formatCurrency(0);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="relative flex w-full max-w-3xl max-h-[94vh] flex-col overflow-hidden rounded-3xl border border-border/50 bg-surface shadow-2xl backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-card"
        onClick={event => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 h-24 rounded-t-3xl bg-gradient-to-r from-primary/15 via-primary/10 to-emerald-200/20" />
        <div className="relative flex items-start justify-between gap-4 border-b border-border/40 bg-card/90 px-6 py-5 backdrop-blur dark:border-dark-border/40 dark:bg-dark-card/95">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground dark:text-dark-foreground">
                Programar recebimento
              </h2>
              <p className="text-sm text-muted-foreground">
                Crie um cronograma de parcelas futuras para {contact.name}.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto px-6 pb-8 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Total</p>
              <p className="mt-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
                {formatCurrency(parsedTotalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Distribuído em {payableSummary.count} parcela(s)
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Parcela média
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
                {averageInstallmentPreview}
              </p>
              <p className="text-xs text-muted-foreground">Saldo distribuído automaticamente</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Primeiro vencimento
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
                {firstDueDate ? dayjs(firstDueDate).format('DD/MM/YYYY') : '--'}
              </p>
              <p className="text-xs text-muted-foreground">
                Frequência {frequency === 'monthly' ? 'mensal' : frequency === 'weekly' ? 'semanal' : 'personalizada'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Saldo a distribuir
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
                {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Ajuste valores das parcelas se necessário</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Título do plano</label>
              <input
                type="text"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Ex.: Parcelamento contrato julho/2025"
                className="w-full rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Valor total</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={event => setTotalAmount(event.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Número de parcelas</label>
              <input
                type="number"
                min={1}
                max={120}
                value={installmentsCount}
                onChange={event => setInstallmentsCount(Math.max(1, Number(event.target.value) || 1))}
                className="w-full rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Valor da parcela</label>
              <input
                type="text"
                value={installmentAmount}
                onChange={event => setInstallmentAmount(event.target.value)}
                disabled={frequency !== 'custom'}
                className="w-full rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-border/60 dark:bg-dark-background/70"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr,1fr] lg:grid-cols-[1fr,1fr,1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Data do primeiro vencimento</label>
              <input
                type="date"
                value={firstDueDate}
                onChange={event => setFirstDueDate(event.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Frequência</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'monthly', label: 'Mensal' },
                  { value: 'weekly', label: 'Semanal' },
                  { value: 'custom', label: 'Personalizado' },
                ] as { value: FrequencyOption; label: string }[]).map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      frequency === option.value
                        ? 'border-primary/60 bg-primary/10 text-primary dark:border-dark-primary/60 dark:bg-dark-primary/15 dark:text-dark-primary'
                        : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-background/70 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 lg:col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Observações internas</label>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                rows={frequency === 'custom' ? 4 : 3}
                placeholder="Inclua detalhes relevantes para o time financeiro."
                className="w-full rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4 shadow-inner dark:border-dark-border/60 dark:bg-dark-card/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Cronograma de parcelas
              </div>
              <span className="text-xs text-muted-foreground">
                Ajuste datas ou valores conforme necessário
              </span>
            </div>
            <div className="space-y-3">
              {installments.map((installment, index) => {
                const dueLabel = installment.dueDate
                  ? dayjs(installment.dueDate).format('DD/MM/YYYY')
                  : 'Sem data';
                return (
                  <div
                    key={`installment-${index}`}
                    className="grid gap-3 rounded-lg border border-border/40 bg-card/70 px-3 py-3 text-sm dark:border-dark-border/50 dark:bg-dark-card/70 md:grid-cols-[0.6fr,0.6fr,auto]"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Parcela #{index + 1}
                      </span>
                      <input
                        type="date"
                        value={installment.dueDate}
                        onChange={event => handleChangeInstallment(index, 'dueDate', event.target.value)}
                        className="rounded-md border border-border/60 bg-background/70 p-2 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
                      />
                      <span className="text-xs text-muted-foreground">
                        {dueLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Valor
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={installment.amount}
                        onChange={event => handleChangeInstallment(index, 'amount', event.target.value)}
                        className="rounded-md border border-border/60 bg-background/70 p-2 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-border/60 dark:bg-dark-background/70"
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(Number.parseFloat(installment.amount) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                        {frequency === 'custom' ? 'Personalizado' : 'Automático'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Valores serão integrados ao financeiro assim que marcados como pagos.
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Registrar cronograma'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentScheduleModal;
