import { forwardRef } from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-3xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-[1.5px] hover:shadow-2xl md:p-10 ${className}`}
      //hover:-translate-y-0.25  -> 1px
      // hover:-translate-y-0.5  -> 2px
      style={{
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
