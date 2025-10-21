import React from 'react';
import { cn } from '../../lib/utils';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'overdue' | 'today' | 'upcoming' | 'done' | 'neutral';
  icon?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({ tone = 'neutral', icon, className, children, ...rest }) => {
  return (
    <span
      className={cn(
        'badge',
        tone === 'overdue' && 'is-overdue',
        tone === 'today' && 'is-today',
        tone === 'upcoming' && 'is-upcoming',
        tone === 'done' && 'is-done',
        tone === 'neutral' && 'bg-slate-200/80 text-slate-600 border border-slate-300',
        className
      )}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};
