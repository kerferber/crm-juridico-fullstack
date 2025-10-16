
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-semibold tracking-tight ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-sm hover:bg-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/85',
        destructive: 'bg-red-500 text-white hover:bg-red-500/90',
        outline:
          'border border-border/70 bg-transparent text-foreground hover:bg-border/20 dark:border-dark-border/60 dark:text-dark-foreground dark:hover:bg-dark-border/40',
        secondary:
          'bg-secondary text-white hover:bg-secondary/90 dark:bg-dark-secondary dark:text-dark-secondary-foreground',
        ghost:
          'text-muted-foreground hover:bg-border/20 dark:text-dark-muted dark:hover:bg-dark-border/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-11 px-7 text-base',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// FIX: Switched from an interface with 'extends' to a type alias with an intersection type '&'.
// This resolves a type inference issue where the 'variant' and 'size' props were not being correctly
// recognized on the ButtonProps type, causing widespread compilation errors.
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
