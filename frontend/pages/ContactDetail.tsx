import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Briefcase,
  ClipboardList,
  CalendarDays,
  MapPin,
  Building2,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatDocument, formatDate, formatCurrency } from '../lib/utils';
import TaskShortcutCard from '../components/tasks/TaskShortcutCard';
import { useTaskModal } from '../hooks/useTaskModal';
import { useProcessModal } from '../hooks/useProcessModal';
import { Button } from '../components/ui/Button';
import dayjs from 'dayjs';
import MentionBadges from '../components/mentions/MentionBadges';
import PaymentScheduleModal from '../components/payments/PaymentScheduleModal';

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    contacts,
    lawsuits,
    tasks,
    users,
    paymentSchedules,
    addPaymentSchedule,
    deletePaymentSchedule,
    markPaymentInstallmentAsPaid,
    deleteContact,
  } = useApp();
  const { openForEdit, openForCreate } = useTaskModal();
  const { open: openProcessModal } = useProcessModal();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const contactId = parseInt(id || '0', 10);
  const contact = contacts.find(c => c.id === contactId);

  if (!contact) {
    return (
      <div className="rounded-xl border border-border/60 bg-white px-6 py-10 text-center text-muted-foreground shadow-sm dark:border-dark-border/60 dark:bg-dark-card">
        Contato não encontrado.
      </div>
    );
  }

  const contactLawsuits = useMemo(
    () => lawsuits.filter(l => l.clientId === contact.id),
    [lawsuits, contact.id]
  );
  const contactTasks = useMemo(
    () => tasks.filter(t => t.clientId === contact.id),
    [tasks, contact.id]
  );
  const owner = users.find(u => u.id === contact.ownerId);
  const lastInteraction = contact.lastInteraction ? formatDate(contact.lastInteraction) : 'Sem registro';

  const openTasksCount = contactTasks.filter(task => task.status !== 'Concluída').length;
  const completedTasksCount = contactTasks.filter(task => task.status === 'Concluída').length;
  const activeProcessesCount = contactLawsuits.filter(l => l.status === 'Ativo').length;

  const sortedTasks = [...contactTasks].sort((a, b) => {
    const aDate = a.deadline ? dayjs(a.deadline) : null;
    const bDate = b.deadline ? dayjs(b.deadline) : null;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.valueOf() - bDate.valueOf();
  });

  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [processingInstallmentId, setProcessingInstallmentId] = useState<number | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);

  const contactSchedules = useMemo(
    () => paymentSchedules.filter(schedule => schedule.contactId === contact.id),
    [paymentSchedules, contact.id]
  );

  const scheduleAggregates = useMemo(() => {
    const pendingEntries = contactSchedules.flatMap(schedule =>
      schedule.installments
        .filter(installment => installment.status === 'pending')
        .map(installment => ({ scheduleId: schedule.id, installment }))
    );
    const overdueEntries = pendingEntries.filter(item => {
      const dueDate = item.installment.dueDate;
      return dueDate ? dayjs(dueDate).isBefore(dayjs(), 'day') : false;
    });
    const pendingAmount = pendingEntries.reduce(
      (acc, item) => acc + (item.installment.amount ?? 0),
      0
    );
    return {
      pending: pendingEntries,
      overdue: overdueEntries,
      pendingAmount,
    };
  }, [contactSchedules]);

  const handleCreateSchedule = async (payload: Parameters<typeof addPaymentSchedule>[0]) => {
    setActionError(null);
    await addPaymentSchedule(payload);
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    const confirmed = window.confirm('Excluir este cronograma de pagamentos? Esta ação não pode ser desfeita.');
    if (!confirmed) {
      return;
    }
    try {
      setActionError(null);
      setDeletingScheduleId(scheduleId);
      await deletePaymentSchedule(scheduleId);
    } catch (err) {
      console.error(err);
      setActionError('Não foi possível remover o cronograma de pagamentos.');
    } finally {
      setDeletingScheduleId(null);
    }
  };

  const handleMarkInstallmentPaid = async (installmentId: number) => {
    const confirmed = window.confirm('Confirmar recebimento desta parcela?');
    if (!confirmed) {
      return;
    }
    try {
      setActionError(null);
      setProcessingInstallmentId(installmentId);
      await markPaymentInstallmentAsPaid(installmentId, {
        paidAt: dayjs().format('YYYY-MM-DD'),
      });
    } catch (err) {
      console.error(err);
      setActionError('Não foi possível marcar a parcela como paga.');
    } finally {
      setProcessingInstallmentId(null);
    }
  };

  const handleDeleteContact = async () => {
    const confirmed = window.confirm(
      `Excluir o contato "${contact.name}" e todos os dados associados?`
    );
    if (!confirmed) {
      return;
    }
    try {
      setActionError(null);
      setDeleting(true);
      await deleteContact(contact.id);
      navigate('/contatos', { replace: true });
    } catch (err) {
      console.error(err);
      setActionError('Não foi possível remover o contato.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link
        to="/contatos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:translate-x-[-2px] hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para contatos
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-primary/10 via-indigo-100/40 to-transparent px-6 py-8 shadow-sm dark:border-dark-border/60 dark:from-dark-primary/10 dark:via-dark-primary/5 dark:to-transparent">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl dark:bg-dark-primary/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner dark:bg-dark-primary/20 dark:text-dark-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
                  {contact.name}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary shadow-sm dark:bg-dark-card/80 dark:text-dark-primary">
                  {contact.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {contact.profession || 'Profissão não informada'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 dark:bg-dark-card/60">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {owner?.name ? `Responsável: ${owner.name}` : 'Sem responsável'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 dark:bg-dark-card/60">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  Último contato: {lastInteraction}
                </span>
                {contact.document && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 dark:bg-dark-card/60">
                    <ClipboardList className="h-3.5 w-3.5 text-primary" />
                    {formatDocument(contact.document)}
                  </span>
                )}
                {scheduleAggregates.pending.length > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {scheduleAggregates.pending.length} parcela(s) pendente(s) — {formatCurrency(scheduleAggregates.pendingAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10 dark:border-dark-primary/40 dark:text-dark-primary"
              onClick={() =>
                openProcessModal({
                  clientId: contact.id,
                  responsibleId: contact.ownerId ?? users[0]?.id,
                })
              }
            >
              <Briefcase className="h-4 w-4" />
              Novo processo
            </Button>
            <Button
              className="gap-2 bg-primary text-white shadow-sm hover:brightness-105 dark:bg-dark-primary"
              onClick={() =>
                openForCreate({
                  clientId: contact.id,
                  responsibleId: contact.ownerId ?? users[0]?.id,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
            <Button
              className="gap-2 bg-emerald-500 text-white shadow-sm hover:brightness-105 dark:bg-emerald-600"
              onClick={() => setScheduleModalOpen(true)}
            >
              <CalendarDays className="h-4 w-4" />
              Agendar recebimento
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDeleteContact}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Excluindo...' : 'Excluir contato'}
            </Button>
          </div>
        </div>
      </section>

      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {actionError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Processos ativos
            </p>
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground">
            {activeProcessesCount}
          </p>
          <span className="text-xs text-muted-foreground">
            {contactLawsuits.length} no total
          </span>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Tarefas pendentes
            </p>
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground">
            {openTasksCount}
          </p>
          <span className="text-xs text-muted-foreground">
            {completedTasksCount} concluídas
          </span>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Última interação
            </p>
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
            {lastInteraction}
          </p>
          <span className="text-xs text-muted-foreground">
            Origem: {contact.origin || 'Não informado'}
          </span>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Responsável
            </p>
            <User className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
            {owner?.name ?? 'Equipe'}
          </p>
          <span className="text-xs text-muted-foreground">
            Telefone: {contact.phone || '—'}
          </span>
        </div>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recebimentos programados</CardTitle>
            <p className="text-xs text-muted-foreground">
              Acompanhe parcelas futuras e confirme quando o cliente efetuar o pagamento.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
            onClick={() => setScheduleModalOpen(true)}
          >
            <CalendarDays className="h-4 w-4" />
            Agendar recebimento
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactSchedules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground dark:border-dark-border/40 dark:bg-dark-card/60">
              <p>Este contato ainda não possui parcelas futuras cadastradas.</p>
              <Button
                size="sm"
                className="mt-3 gap-2 bg-emerald-500 text-white hover:brightness-105 dark:bg-emerald-600"
                onClick={() => setScheduleModalOpen(true)}
              >
                <CalendarDays className="h-4 w-4" />
                Criar cronograma
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {contactSchedules.map(schedule => {
                const paidCount = schedule.installments.filter(installment => installment.status === 'paid').length;
                const pendingCount = schedule.installments.length - paidCount;
                const overdueCount = schedule.installments.filter(
                  installment =>
                    installment.status === 'pending' &&
                    installment.dueDate &&
                    dayjs(installment.dueDate).isBefore(dayjs(), 'day')
                ).length;
                const totalReceived = schedule.installments
                  .filter(installment => installment.status === 'paid')
                  .reduce((acc, installment) => acc + (installment.amount ?? 0), 0);
                const nextPending = schedule.installments
                  .filter(installment => installment.status === 'pending')
                  .sort((a, b) => {
                    return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
                  })[0];

                const title = schedule.title || `Cronograma ${dayjs(schedule.createdAt ?? schedule.firstDueDate ?? new Date()).format('DD/MM/YYYY')}`;

                return (
                  <div
                    key={schedule.id}
                    className="rounded-xl border border-border/50 bg-white/90 p-4 dark:border-dark-border/50 dark:bg-dark-card/70"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                          {title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {schedule.installmentsCount} parcela(s) — {formatCurrency(schedule.totalAmount)} · Recebido {formatCurrency(totalReceived)}
                        </p>
                        {schedule.notes && (
                          <p className="text-xs text-muted-foreground">{schedule.notes}</p>
                        )}
                        {nextPending && (
                          <p className="text-xs text-muted-foreground">
                            Próximo vencimento: {nextPending.dueDate ? formatDate(nextPending.dueDate) : '—'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                          {paidCount}/{schedule.installmentsCount} pagas
                        </span>
                        {overdueCount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-200">
                            {overdueCount} em atraso
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                            {pendingCount} pendente(s)
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-red-500 hover:text-red-600 dark:text-red-300"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={deletingScheduleId === schedule.id}
                        >
                          {deletingScheduleId === schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Excluir plano
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                      <div className="hidden grid-cols-[0.8fr,0.6fr,0.8fr,0.5fr] rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground dark:bg-dark-card/60 md:grid">
                        <span>Parcela</span>
                        <span>Vencimento</span>
                        <span>Status</span>
                        <span>Valor</span>
                      </div>
                      <div className="space-y-2">
                        {schedule.installments.map(installment => {
                          const isOverdue =
                            installment.status === 'pending' &&
                            installment.dueDate &&
                            dayjs(installment.dueDate).isBefore(dayjs(), 'day');
                          const isProcessing = processingInstallmentId === installment.id;
                          return (
                            <div
                              key={installment.id}
                              className="grid gap-3 rounded-lg border border-border/40 bg-card/80 px-3 py-2 text-sm dark:border-dark-border/40 dark:bg-dark-card/60 md:grid-cols-[0.8fr,0.6fr,0.8fr,0.5fr]"
                            >
                              <span className="font-medium text-foreground dark:text-dark-foreground">
                                Parcela #{installment.sequence}
                              </span>
                              <span
                                className={`font-medium ${
                                  isOverdue ? 'text-red-600 dark:text-red-200' : 'text-foreground dark:text-dark-foreground'
                                }`}
                              >
                                {installment.dueDate ? formatDate(installment.dueDate) : 'Sem data'}
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                    installment.status === 'paid'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                      : isOverdue
                                      ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-200'
                                      : 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary'
                                  }`}
                                >
                                  {installment.status === 'paid'
                                    ? `Paga em ${installment.paidAt ? formatDate(installment.paidAt) : ''}`
                                    : isOverdue
                                    ? 'Em atraso'
                                    : 'Pendente'}
                                </span>
                                {installment.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-300"
                                    onClick={() => handleMarkInstallmentPaid(installment.id)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Marcar como pago'
                                    )}
                                  </Button>
                                )}
                              </div>
                              <span className="font-semibold text-foreground dark:text-dark-foreground">
                                {formatCurrency(installment.amount ?? 0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {(contact.notes || (contact.mentions && contact.mentions.length > 0)) && (
        <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Notas internas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {contact.notes ? (
              <p className="whitespace-pre-line text-foreground dark:text-dark-foreground">
                {contact.notes}
              </p>
            ) : (
              <p className="italic">Sem notas registradas.</p>
            )}
            <MentionBadges mentions={contact.mentions} users={users} contacts={contacts} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Informações de contato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/80 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/50">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Email</p>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {contact.email || 'Não informado'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/80 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/50">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Telefone</p>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {contact.phone || 'Não informado'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/80 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/50">
                <Building2 className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Origem</p>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {contact.origin || 'Não informado'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/80 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/50">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {contact.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <TaskShortcutCard
            heading="Adicionar tarefa vinculada"
            description="Crie uma nova atividade e mantenha o histórico deste relacionamento sempre atualizado."
            defaults={{
              clientId: contact.id,
              responsibleId: contact.ownerId ?? users[0]?.id,
            }}
            ctaLabel="Nova tarefa para este contato"
          />
          <Card className="border border-dashed border-border/60 bg-white/60 shadow-none dark:border-dark-border/50 dark:bg-dark-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Notas rápidas</CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre feedbacks e aprendizados importantes para futuras interações.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-white/80 px-3 py-2 text-xs text-muted-foreground italic dark:border-dark-border/60 dark:bg-dark-card/60">
                Ex.: Interesse em consultoria mensal a partir de novembro. Solicitar materiais do
                portfólio atualizado.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Processos associados</CardTitle>
              <p className="text-xs text-muted-foreground">
                {contactLawsuits.length > 0
                  ? 'Acompanhamento das etapas e responsáveis.'
                  : 'Organize os processos vinculados a este contato.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() =>
                openProcessModal({
                  clientId: contact.id,
                  responsibleId: contact.ownerId ?? users[0]?.id,
                })
              }
            >
              <Briefcase className="h-4 w-4" /> Vincular processo
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactLawsuits.length > 0 ? (
              contactLawsuits.map(lawsuit => (
                <Link
                  key={lawsuit.id}
                  to={`/processos/${lawsuit.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-white/70 px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 dark:border-dark-border/50 dark:bg-dark-card/60 dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                      {lawsuit.internalNumber}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                        {lawsuit.area}
                      </span>
                      {lawsuit.deadline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 dark:bg-dark-card/50">
                          <CalendarDays className="h-3 w-3" />
                          Prazo {formatDate(lawsuit.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary dark:group-hover:text-dark-primary">
                    {lawsuit.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/50">
                Nenhum processo associado ainda. Que tal cadastrar o primeiro?
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Tarefas do relacionamento</CardTitle>
              <p className="text-xs text-muted-foreground">
                Fique atento às entregas e prazos vinculados a este contato.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() =>
                openForCreate({
                  clientId: contact.id,
                  responsibleId: contact.ownerId ?? users[0]?.id,
                })
              }
            >
              <ClipboardList className="h-4 w-4" />
              Nova tarefa
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedTasks.length > 0 ? (
              sortedTasks.map(taskItem => (
                <button
                  key={taskItem.id}
                  type="button"
                  onClick={() => openForEdit(taskItem)}
                  className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/50 bg-white/70 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-dark-border/60 dark:bg-dark-card/60 dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                      {taskItem.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {taskItem.deadline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 dark:bg-dark-card/50">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(taskItem.deadline)}
                        </span>
                      )}
                      {taskItem.score ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                          {taskItem.score} pts
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${
                      taskItem.status === 'Concluída'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : taskItem.status === 'Atrasada'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200'
                    }`}
                  >
                    {taskItem.status}
                  </span>
                </button>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/50">
                Nenhuma tarefa associada. Que tal planejar a próxima ação?
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentScheduleModal
        open={isScheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        contact={contact}
        onCreate={handleCreateSchedule}
      />
    </div>
  );
};

export default ContactDetail;
