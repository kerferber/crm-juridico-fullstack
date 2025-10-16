
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-dark-primary dark:text-dark-primary-foreground dark:hover:bg-dark-primary/90',
        destructive: 'bg-red-500 text-white hover:bg-red-500/90',
        outline: 'border border-input bg-transparent hover:bg-gray-100 dark:hover:bg-dark-border',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-dark-secondary dark:text-dark-secondary-foreground dark:hover:bg-dark-secondary/80',
        ghost: 'hover:bg-gray-100 dark:hover:bg-dark-border',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
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
