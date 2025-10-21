import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus } from '../../types/types';
import { Tag } from '../ui/Tag';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

interface AlertBellProps {
  tasks: Task[];
}

export const AlertBell: React.FC<AlertBellProps> = ({ tasks }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const criticalTasks = useMemo(() => {
    const today = dayjs().startOf('day');
    return tasks
      .filter(task => {
        if (task.status === TaskStatus.Concluida) return false;
        const due = dayjs(task.dueDate || task.deadline);
        if (!due.isValid()) return false;
        return due.isBefore(today, 'day') || due.isSame(today, 'day');
      })
      .sort((a, b) => dayjs(a.deadline || a.dueDate).diff(dayjs(b.deadline || b.dueDate)));
  }, [tasks]);

  const total = criticalTasks.length;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent-color)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
        aria-label={`Exibir tarefas críticas: ${total} item(ns)`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--alert-color)] px-1 text-[11px] font-semibold text-white">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-soft)]"
          role="dialog"
          aria-label="Tarefas críticas"
        >
          <header className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--alert-color)]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Pendências em foco</span>
          </header>
          {total === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--bg-default)]/80 px-3 py-3 text-center text-xs text-[var(--text-secondary)]">
              Tudo em dia! Sem tarefas críticas para hoje.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {criticalTasks.map(task => {
                const due = dayjs(task.dueDate || task.deadline);
                const overdue = due.isBefore(dayjs().startOf('day'), 'day');
                return (
                  <li key={task.id}>
                    <Link
                      to={`/tarefas/${task.id}`}
                      className="flex flex-col gap-1 rounded-lg border border-transparent bg-[var(--card-bg)]/70 px-3 py-2 transition hover:border-[var(--accent-color)]/40 hover:bg-[var(--card-bg)]"
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {task.title}
                        </span>
                        <Tag tone={overdue ? 'overdue' : 'today'} aria-label={overdue ? 'Atrasada' : 'Para hoje'}>
                          {overdue ? 'Atrasada' : 'Hoje'}
                        </Tag>
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        Prazo {due.isValid() ? due.format('DD MMM YYYY') : 'não informado'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
