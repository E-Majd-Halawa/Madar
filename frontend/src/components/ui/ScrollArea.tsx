import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type ScrollAreaVariant = 'thin' | 'hidden';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ScrollAreaVariant;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea({ className, children, variant = 'thin', ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          variant === 'hidden' ? 'scrollbar-hide' : 'scrollbar-thin',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';