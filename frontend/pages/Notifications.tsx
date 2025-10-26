import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { NotificationItem } from '../types/types';
import { Button } from '../components/ui/Button';
import {
  Bell,
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
  const filterCounts: Record<NotificationFilter, number> = {
    all: userNotifications.length,
    unread: unreadCount,
    task: tasksCount,
    lawsuit: lawsuitsCount,
    contact: contactsCount,
    goal: goalsCount,
  };
  const entityIcons: Record<NotificationFilter | NotificationItem['entityType'], React.ComponentType<{ className?: string }>> = {
    task: ClipboardList,
    lawsuit: Gavel,
    contact: UserCircle2,
    goal: Sparkles,
    social: BellRing,
    all: BellRing,
    unread: BellRing,
  };

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
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

      <section className="notification-filters-panel">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-dark-foreground">
          <ListFilter className="h-4 w-4 text-primary" />
          Filtros inteligentes
        </div>
        <div className="notification-filter-rail">
          {(Object.keys(filterMeta) as NotificationFilter[]).map(filterKey => {
            const meta = filterMeta[filterKey];
            const Icon = meta.icon;
            const isActive = activeFilter === filterKey;
            return (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveFilter(filterKey)}
                className={`notification-pill ${isActive ? 'is-active' : ''}`}
              >
                <span className="notification-pill__icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="notification-pill__body">
                  <span className="notification-pill__label">{meta.label}</span>
                  <span className="notification-pill__description">{meta.description}</span>
                </div>
                <span className="notification-pill__count">{filterCounts[filterKey]}</span>
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
            <section key={group.key} className="notification-group">
              <div className="notification-group__label">{group.label}</div>
              <div className="notification-timeline">
                {group.items.map((notification, index) => {
                  const Icon = entityIcons[notification.entityType as NotificationFilter] ?? Bell;
                  return (
                    <div key={notification.id} className="notification-node">
                      <div className="notification-node__rail">
                        <span
                          className={`notification-node__dot ${
                            notification.isRead ? 'is-read' : 'is-unread'
                          }`}
                        />
                        {index !== group.items.length - 1 && <span className="notification-node__line" />}
                      </div>
                      <article
                        className={`notification-card ${
                          notification.isRead ? 'notification-card--read' : 'notification-card--unread'
                        }`}
                      >
                        <div className="notification-card__icon">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="notification-card__body">
                          <div className="notification-card__header">
                            <p className="notification-card__title">{notification.title}</p>
                            <span className="notification-card__timestamp">
                              {dayjs(notification.createdAt).format('DD MMM · HH:mm')}
                            </span>
                          </div>
                            <p className="notification-card__message">
                              <span className="notification-card__author">{
                                notification.message?.split(' ')[0] ?? ''
                              }</span>{' '}
                              {notification.message?.replace(/^(\S+)/, '').trim()}
                            </p>
                          <div className="notification-card__chips">
                            <span className="notification-chip">
                              {(notification.entityType || 'alerta').toUpperCase()}
                            </span>
                            {notification.isRead ? (
                              <span className="notification-chip is-muted">Lido</span>
                            ) : (
                              <span className="notification-chip is-highlight">Novo</span>
                            )}
                          </div>
                        </div>
                        <div className="notification-card__actions">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="notification-card__button"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Lida
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="notification-card__button notification-card__button--primary"
                            onClick={() => handleNavigate(notification)}
                          >
                            Abrir
                          </Button>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
};

export default Notifications;
