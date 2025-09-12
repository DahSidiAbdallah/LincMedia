"use client";

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

type AnimatedWrapperProps = {
  children: ReactNode;
  className?: string;
  delay?: string;
};

const AnimatedWrapper = ({ children, className, delay }: AnimatedWrapperProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className={cn('transition-all duration-700 ease-out', isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8', className)}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
};

export default AnimatedWrapper;
