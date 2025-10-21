import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { NotificationItem } from '../../types/types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const MAX_IN_MODAL = 10;

const NotificationBell: React.FC = () => {
  const { notifications, markNotificationAsRead } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const userNotifications = useMemo(() => {
    if (!user) return [] as NotificationItem[];
    return notifications
      .filter(notification => notification.recipientId === user.id)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [notifications, user]);

  const unreadCount = useMemo(
    () => userNotifications.filter(notification => !notification.isRead).length,
    [userNotifications]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggle = () => {
    if (!user) return;
    setIsOpen(prev => !prev);
  };

  const handleNavigation = (notification: NotificationItem) => {
    if (!user) return;
    markNotificationAsRead(notification.id);
    setIsOpen(false);
    let targetPath: string | null = '/';
    if (notification.entityType === 'task') {
      targetPath = `/tarefas/${notification.entityId}`;
    } else if (notification.entityType === 'lawsuit') {
      targetPath = `/processos/${notification.entityId}`;
    } else if (notification.entityType === 'contact') {
      targetPath = `/contatos/${notification.entityId}`;
    } else if (notification.entityType === 'goal') {
      targetPath = null;
    }
    if (targetPath) {
      navigate(targetPath);
    }
  };

  const openFullPage = () => {
    if (!user) return;
    setIsOpen(false);
    navigate('/notificacoes');
  };

  const renderModalContent = () => {
    if (!user) {
      return (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          Entre com sua conta para visualizar notificações.
        </div>
      );
    }

    if (userNotifications.length === 0) {
      return (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          Nenhuma notificação por aqui. Você verá menções e alertas das equipes neste espaço.
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <ul className="max-h-[320px] overflow-y-auto py-2">
          {userNotifications.slice(0, MAX_IN_MODAL).map(notification => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => handleNavigation(notification)}
                className={cn(
                  'flex w-full flex-col gap-1 px-4 py-3 text-left transition',
                  notification.isRead
                    ? 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-dark-border/40'
                    : 'bg-primary/5 text-foreground hover:bg-primary/10 dark:bg-dark-primary/10 dark:hover:bg-dark-primary/20'
                )}
              >
                <span className="text-sm font-semibold">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.message}</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {dayjs(notification.createdAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border/60 bg-muted/10 px-4 py-3 dark:border-dark-border/60 dark:bg-dark-card/60">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs font-semibold"
            onClick={openFullPage}
          >
            Exibir todas
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className={cn(
          'relative rounded-full border border-border/50 bg-white/80 text-muted-foreground transition hover:bg-primary/10 hover:text-primary dark:border-dark-border/50 dark:bg-dark-card/80 dark:hover:bg-dark-primary/15 dark:hover:text-dark-primary',
          !user && 'cursor-not-allowed opacity-70'
        )}
        disabled={!user}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white dark:bg-dark-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className="sr-only">Notificações</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-xl border border-border/60 bg-white shadow-xl backdrop-blur-sm dark:border-dark-border/60 dark:bg-dark-card/90">
          <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground dark:border-dark-border/60">
            Notificações
          </div>
          {renderModalContent()}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
