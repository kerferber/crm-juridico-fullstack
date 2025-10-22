import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';

type InstallmentStatusFilter = 'all' | 'pending' | 'overdue' | 'paid';

interface FlattenedInstallment {
  id: number;
  scheduleId: number;
  scheduleTitle: string;
  contactId: number;
  contactName: string;
  dueDate: string | null;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: string | null;
  isOverdue: boolean;
}

const Payments: React.FC = () => {
  const {
    paymentSchedules,
    contacts,
    markPaymentInstallmentAsPaid,
  } = useApp();
  const [statusFilter, setStatusFilter] = useState<InstallmentStatusFilter>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const installments = useMemo<FlattenedInstallment[]>(() => {
    return paymentSchedules.flatMap(schedule => {
      const contact = schedule.contact ?? contacts.find(item => item.id === schedule.contactId) ?? null;
      const scheduleTitle = schedule.title || `Cronograma ${dayjs(schedule.createdAt ?? schedule.firstDueDate ?? new Date()).format('DD/MM/YYYY')}`;
      return schedule.installments.map(installment => {
        const dueDate = installment.dueDate ?? null;
        const isOverdue =
          installment.status === 'pending' &&
          dueDate !== null &&
          dayjs(dueDate).isBefore(dayjs(), 'day');
        return {
          id: installment.id,
          scheduleId: schedule.id,
          scheduleTitle,
          contactId: contact?.id ?? schedule.contactId,
          contactName: contact?.name ?? 'Contato não identificado',
          dueDate,
          amount: installment.amount ?? 0,
          status: installment.status,
          paidAt: installment.paidAt ?? null,
          isOverdue,
        } as FlattenedInstallment;
      });
    });
  }, [paymentSchedules, contacts]);

  const filteredInstallments = useMemo(() => {
    return installments.filter(installment => {
      if (statusFilter === 'all') {
        return true;
      }
      if (statusFilter === 'paid') {
        return installment.status === 'paid';
      }
      if (statusFilter === 'overdue') {
        return installment.status === 'pending' && installment.isOverdue;
      }
      return installment.status === 'pending' && !installment.isOverdue;
    });
  }, [installments, statusFilter]);

  const pendingInstallments = useMemo(
    () => installments.filter(installment => installment.status === 'pending'),
    [installments]
  );

  const overdueInstallments = useMemo(
    () => pendingInstallments.filter(installment => installment.isOverdue),
    [pendingInstallments]
  );

  const paidThisMonth = useMemo(() => {
    const startOfMonth = dayjs().startOf('month');
    const endOfMonth = dayjs().endOf('month');
    return installments.filter(installment => {
      if (installment.status !== 'paid' || !installment.paidAt) {
        return false;
      }
      const paidAt = dayjs(installment.paidAt);
      return paidAt.isAfter(startOfMonth) && paidAt.isBefore(endOfMonth);
    });
  }, [installments]);

  const totals = useMemo(() => {
    const pendingTotal = pendingInstallments.reduce((acc, installment) => acc + installment.amount, 0);
    const overdueTotal = overdueInstallments.reduce((acc, installment) => acc + installment.amount, 0);
    const paidTotalMonth = paidThisMonth.reduce((acc, installment) => acc + installment.amount, 0);
    const nextDue = pendingInstallments
      .filter(installment => !installment.isOverdue)
      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())[0];
    return {
      pendingTotal,
      overdueTotal,
      paidTotalMonth,
      nextDue,
    };
  }, [pendingInstallments, overdueInstallments, paidThisMonth]);

  const handleMarkPaid = async (installmentId: number) => {
    const confirm = window.confirm('Confirma o recebimento desta parcela?');
    if (!confirm) {
      return;
    }
    try {
      setError(null);
      setProcessingId(installmentId);
      await markPaymentInstallmentAsPaid(installmentId, {
        paidAt: dayjs().format('YYYY-MM-DD'),
      });
    } catch (err) {
      console.error(err);
      setError('Não foi possível marcar a parcela como paga.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          Financeiro
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
          Pagamentos previstos &amp; recebimentos
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize parcelas futuras, identifique atrasos e confirme recebimentos para atualizar o caixa automaticamente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/15">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-200">
              Valores pendentes
            </CardTitle>
            <CalendarDays className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-200">
              {formatCurrency(totals.pendingTotal)}
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
              {pendingInstallments.length} parcela(s) aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="border border-red-200 bg-red-50/80 shadow-sm dark:border-red-500/40 dark:bg-red-500/15">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600 dark:text-red-200">
              Em atraso
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-200">
              {formatCurrency(totals.overdueTotal)}
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-200/80">
              {overdueInstallments.length} parcela(s) vencida(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border border-primary/40 bg-primary/5 shadow-sm dark:border-dark-primary/40 dark:bg-dark-primary/10">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-primary dark:text-dark-primary">
              Recebido este mês
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary dark:text-dark-primary">
              {formatCurrency(totals.paidTotalMonth)}
            </p>
            <p className="text-xs text-primary/80 dark:text-dark-primary/80">
              {paidThisMonth.length} parcela(s) confirmada(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border border-indigo-200 bg-indigo-50/80 shadow-sm dark:border-indigo-500/40 dark:bg-indigo-500/15">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-200">
              Próximo vencimento
            </CardTitle>
            <Clock className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-200">
              {totals.nextDue?.dueDate ? formatDate(totals.nextDue.dueDate) : 'Todos em dia'}
            </p>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-200/80">
              {totals.nextDue ? `Cliente: ${totals.nextDue.contactName}` : 'Nenhuma parcela pendente'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Lista de parcelas</CardTitle>
            <p className="text-xs text-muted-foreground">
              Utilize os filtros para priorizar cobranças e registrar recebimentos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: 'pending', label: 'Pendentes' },
                { value: 'overdue', label: 'Em atraso' },
                { value: 'paid', label: 'Pagas' },
                { value: 'all', label: 'Todas' },
              ] as { value: InstallmentStatusFilter; label: string }[]
            ).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  statusFilter === option.value
                    ? 'border-primary/50 bg-primary/10 text-primary dark:border-dark-primary/50 dark:bg-dark-primary/15 dark:text-dark-primary'
                    : 'border-border/50 bg-background text-muted-foreground hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-background/70 dark:hover:border-dark-primary/50 dark:hover:text-dark-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}
          {filteredInstallments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-5 py-10 text-center text-sm text-muted-foreground dark:border-dark-border/50 dark:bg-dark-card/60">
              Nenhuma parcela encontrada com o filtro selecionado.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden grid-cols-[1.5fr,1fr,1fr,1fr,auto] rounded-lg bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground dark:bg-dark-card/60 md:grid">
                <span>Contato</span>
                <span>Vencimento</span>
                <span>Status</span>
                <span>Valor</span>
                <span className="text-right">Ações</span>
              </div>
              {filteredInstallments.map(installment => (
                <div
                  key={installment.id}
                  className="grid gap-3 rounded-lg border border-border/60 bg-card/90 px-4 py-3 text-sm shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70 md:grid-cols-[1.5fr,1fr,1fr,1fr,auto]"
                >
                  <div className="flex flex-col">
                    <Link
                      to={`/contatos/${installment.contactId}`}
                      className="font-semibold text-primary transition hover:underline"
                    >
                      {installment.contactName}
                    </Link>
                    <span className="text-xs text-muted-foreground">{installment.scheduleTitle}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-medium ${installment.isOverdue ? 'text-red-600 dark:text-red-200' : 'text-foreground dark:text-dark-foreground'}`}>
                      {installment.dueDate ? formatDate(installment.dueDate) : 'Sem data'}
                    </span>
                    {installment.isOverdue && installment.status === 'pending' && (
                      <span className="text-xs text-red-500 dark:text-red-200">Em atraso</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`inline-flex w-max items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        installment.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                          : installment.isOverdue
                          ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-200'
                          : 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary'
                      }`}
                    >
                      {installment.status === 'paid'
                        ? `Pago em ${installment.paidAt ? formatDate(installment.paidAt) : ''}`
                        : installment.isOverdue
                        ? 'Em atraso'
                        : 'Pendente'}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground dark:text-dark-foreground">
                    {formatCurrency(installment.amount)}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/contatos/${installment.contactId}`}
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Ver contato
                    </Link>
                    {installment.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300"
                        onClick={() => handleMarkPaid(installment.id)}
                        disabled={processingId === installment.id}
                      >
                        {processingId === installment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Confirmar pagamento
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
