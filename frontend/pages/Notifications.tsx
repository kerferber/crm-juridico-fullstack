import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { NotificationItem } from '../types/types';
import { Button } from '../components/ui/Button';
import {
  BellRing,
  CheckCircle2,
  ClipboardList,
  Gavel,
  Inbox,
  ListFilter,
  Sparkles,
  UserCircle2,
} from 'lucide-react';

const MAX_HISTORY = 200;

type NotificationFilter = 'all' | 'unread' | 'task' | 'lawsuit' | 'contact' | 'goal';

const filterMeta: Record<
  NotificationFilter,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  all: {
    label: 'Todos',
    icon: BellRing,
    description: 'Fluxo completo de alertas em ordem cronológica.',
  },
  unread: {
    label: 'Não lidos',
    icon: Sparkles,
    description: 'Pendências para acompanhar agora.',
  },
  task: {
    label: 'Tarefas',
    icon: ClipboardList,
    description: 'Atualizações de tarefas e follow-ups.',
  },
  lawsuit: {
    label: 'Processos',
    icon: Gavel,
    description: 'Movimentações jurídicas relevantes.',
  },
  contact: {
    label: 'Contatos',
    icon: UserCircle2,
    description: 'Novas interações com clientes e leads.',
  },
  goal: {
    label: 'Metas',
    icon: BellRing,
    description: 'Alerta sobre objetivos e pontuações.',
  },
};

const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  const userNotifications = useMemo<NotificationItem[]>(() => {
    if (!user) return [];
    return notifications
      .filter(notification => notification.recipientId === user.id)
      .slice(0, MAX_HISTORY)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [notifications, user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
        <Inbox className="h-6 w-6" />
        Faça login para visualizar suas notificações.
      </div>
    );
  }

  const unreadCount = userNotifications.filter(notification => !notification.isRead).length;
  const tasksCount = userNotifications.filter(notification => notification.entityType === 'task').length;
  const lawsuitsCount = userNotifications.filter(notification => notification.entityType === 'lawsuit').length;
  const contactsCount = userNotifications.filter(notification => notification.entityType === 'contact').length;
  const goalsCount = userNotifications.filter(notification => notification.entityType === 'goal').length;

  const handleNavigate = (notification: NotificationItem) => {
    markNotificationAsRead(notification.id);
    let target: string | null = '/';
    if (notification.entityType === 'task') {
      target = `/tarefas/${notification.entityId}`;
    } else if (notification.entityType === 'lawsuit') {
      target = `/processos/${notification.entityId}`;
    } else if (notification.entityType === 'contact') {
      target = `/contatos/${notification.entityId}`;
    } else if (notification.entityType === 'goal') {
      target = null;
    }
    if (target) {
      navigate(target);
    }
  };

  const handleMarkAll = () => {
    if (!user) return;
    markAllNotificationsAsRead(user.id);
  };

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return userNotifications.filter(notification => !notification.isRead);
      case 'task':
      case 'lawsuit':
      case 'contact':
      case 'goal':
        return userNotifications.filter(notification => notification.entityType === activeFilter);
      case 'all':
      default:
        return userNotifications;
    }
  }, [activeFilter, userNotifications]);

  const groupedNotifications = useMemo(() => {
    const groups: Array<{
      key: string;
      label: string;
      items: NotificationItem[];
    }> = [];

    filteredNotifications.forEach(notification => {
      const day = dayjs(notification.createdAt);
      const key = day.format('YYYY-MM-DD');
      let label = day.format('DD MMM YYYY');
      if (day.isSame(dayjs(), 'day')) {
        label = 'Hoje';
      } else if (day.isSame(dayjs().subtract(1, 'day'), 'day')) {
        label = 'Ontem';
      }

      const existing = groups.find(group => group.key === key);
      if (existing) {
        existing.items.push(notification);
      } else {
        groups.push({
          key,
          label,
          items: [notification],
        });
      }
    });

    return groups;
  }, [filteredNotifications]);

  return (
    <section className="space-y-8">
      <header className="premium-hero">
        <div className="premium-hero__overlay" />
        <div className="premium-hero__content">
          <div className="flex flex-col gap-5">
            <span className="premium-badge">Caixa de entrada inteligente</span>
            <div className="space-y-3">
              <h1 className="premium-hero__title">Centralize alertas críticos e acompanhe tudo em tempo real.</h1>
              <p className="premium-hero__subtitle">
                Use os filtros rápidos para priorizar tarefas, processos ou interações com clientes. Clique em um item
                para navegar diretamente até o contexto.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="summary-card">
                <span className="summary-card__badge bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                  Não lidos
                </span>
                <p className="text-xs text-muted-foreground">Atenção imediata</p>
                <p className="mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground">{unreadCount}</p>
              </div>
              <div className="summary-card">
                <span className="summary-card__badge bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                  Tarefas
                </span>
                <p className="text-xs text-muted-foreground">Atualizações operacionais</p>
                <p className="mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground">{tasksCount}</p>
              </div>
              <div className="summary-card">
                <span className="summary-card__badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                  Processos
                </span>
                <p className="text-xs text-muted-foreground">Movimentações jurídicas</p>
                <p className="mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground">{lawsuitsCount}</p>
              </div>
              <div className="summary-card">
                <span className="summary-card__badge bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                  Contatos & metas
                </span>
                <p className="text-xs text-muted-foreground">Relacionamento e objetivos</p>
                <p className="mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground">
                  {contactsCount + goalsCount}
                </p>
              </div>
            </div>
          </div>
          <div className="hero-sidecard">
            <div className="space-y-2">
              <p className="hero-sidecard__eyebrow">Ações rápidas</p>
              <h2 className="hero-sidecard__title">Organize sua rotina em segundos</h2>
              <p className="hero-sidecard__subtitle">
                Marque tudo como lido para começar com a caixa zerada ou filtre por tipo de alerta para definir
                prioridades.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 dark:border-dark-border/60 dark:bg-dark-background">
                <span>Total de alertas</span>
                <span className="text-foreground dark:text-dark-foreground">{userNotifications.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 dark:border-dark-border/60 dark:bg-dark-background">
                <span>Novos hoje</span>
                <span className="text-foreground dark:text-dark-foreground">
                  {
                    userNotifications.filter(notification =>
                      dayjs(notification.createdAt).isSame(dayjs(), 'day')
                    ).length
                  }
                </span>
              </div>
            </div>
            <div className="hero-sidecard__footer">
              <Button
                variant="ghost"
                className="hero-sidecard__cta"
                onClick={handleMarkAll}
                disabled={unreadCount === 0}
              >
                Marcar tudo como lido
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListFilter className="h-4 w-4 text-primary" />
          Visualizar por categoria
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(filterMeta) as NotificationFilter[]).map(filterKey => {
            const meta = filterMeta[filterKey];
            const Icon = meta.icon;
            const isActive = activeFilter === filterKey;
            return (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveFilter(filterKey)}
                className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-primary/60 bg-primary/5 text-primary dark:border-dark-primary/60 dark:bg-dark-primary/15'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:hover:border-dark-primary/50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </span>
                <span className="text-xs">{meta.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {userNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
          <Inbox className="h-6 w-6" />
          Você ainda não possui notificações.
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
          <Sparkles className="h-6 w-6" />
          Nenhum alerta para este filtro no momento.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map(group => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-border/60 dark:bg-dark-border/60" />
                <span className="rounded-full border border-border/60 bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground dark:border-dark-border/60 dark:bg-dark-surface">
                  {group.label}
                </span>
                <div className="h-[1px] flex-1 bg-border/60 dark:bg-dark-border/60" />
              </div>
              <div className="space-y-3">
                {group.items.map(notification => (
                  <article
                    key={notification.id}
                    className={`rounded-2xl border px-5 py-4 transition hover:-translate-y-[1px] ${
                      notification.isRead
                        ? 'border-border/60 bg-surface dark:border-dark-border/60 dark:bg-dark-surface'
                        : 'border-primary/50 bg-primary/5 shadow-[0_18px_48px_-40px_rgba(59,130,246,0.45)] dark:border-dark-primary/60 dark:bg-dark-primary/20'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                          <span>{dayjs(notification.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                          <span className="h-1 w-1 rounded-full bg-border/70 dark:bg-dark-border/60" />
                          <span>
                            {notification.entityType ? notification.entityType.toUpperCase() : 'ALERTA'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="inline-flex items-center gap-2 text-xs font-semibold"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Marcar como lida
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleNavigate(notification)} className="text-xs">
                          Abrir detalhe
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
};

export default Notifications;
