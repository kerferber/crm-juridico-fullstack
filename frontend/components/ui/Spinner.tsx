import React from 'react';
import { Loader } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const spinnerVariants = cva(
  'animate-spin text-primary',
  {
    variants: {
      size: {
        default: 'h-6 w-6',
        sm: 'h-4 w-4',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// FIX: Switched from an interface to a type alias to resolve a type inference
// issue with VariantProps where the 'size' prop was not being correctly recognized.
type SpinnerProps = VariantProps<typeof spinnerVariants>;

const Spinner: React.FC<SpinnerProps> = ({ size }) => {
  return (
    <Loader className={cn(spinnerVariants({ size }))} />
  );
};

Spinner.displayName = 'Spinner';

export { Spinner };