
import React from 'react';
import { cn } from '../../lib/utils';

interface AnimatedProgressBarProps {
  value: number;
  className?: string;
}

const AnimatedProgressBar = React.forwardRef<HTMLDivElement, AnimatedProgressBarProps>(
  ({ value, className }, ref) => {
    const progress = Math.max(0, Math.min(100, value || 0));

    return (
      <div
        ref={ref}
        className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2.5"
      >
        <div
          className={cn("bg-primary h-2.5 rounded-full transition-all duration-700 ease-out", className)}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  }
);
AnimatedProgressBar.displayName = 'AnimatedProgressBar';
export { AnimatedProgressBar };
