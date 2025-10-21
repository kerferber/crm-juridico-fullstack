import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { NotificationItem } from '../types/types';
import { Button } from '../components/ui/Button';
import { CheckCircle2, Inbox } from 'lucide-react';

const MAX_HISTORY = 200;

const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Centro de alertas</p>
          <h1 className="text-2xl font-semibold text-foreground dark:text-dark-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            Visualize menções e avisos das equipes. Clique para abrir a origem da notificação.
          </p>
        </div>
        {userNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 text-xs font-semibold"
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar tudo como lido
          </Button>
        )}
      </header>

      {userNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
          <Inbox className="h-6 w-6" />
          Você ainda não possui notificações.
        </div>
      ) : (
        <div className="space-y-3">
          {userNotifications.map(notification => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNavigate(notification)}
              className={
                `w-full rounded-xl border px-4 py-3 text-left transition ` +
                (notification.isRead
                  ? 'border-border/60 bg-white hover:border-primary/40 hover:bg-primary/5 dark:border-dark-border/60 dark:bg-dark-card/70 dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10'
                  : 'border-primary/50 bg-primary/5 hover:bg-primary/10 dark:border-dark-primary/40 dark:bg-dark-primary/15 dark:hover:bg-dark-primary/20')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                </div>
                {!notification.isRead && (
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary dark:bg-dark-primary" />
                )}
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                {dayjs(notification.createdAt).format('DD/MM/YYYY HH:mm')}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Notifications;
