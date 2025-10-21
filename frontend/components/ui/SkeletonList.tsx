import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonListProps {
  rows?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ rows = 4, className }) => {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-12 rounded-lg" />
      ))}
      <span className="sr-only">Carregando itens</span>
    </div>
  );
};
