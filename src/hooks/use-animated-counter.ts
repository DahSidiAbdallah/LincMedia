"use client";

import { useState, useEffect, type RefObject } from 'react';
import { useInView } from './use-in-view';

export function useAnimatedCounter(ref: RefObject<Element>, end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

  const start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = Math.floor(easeOutProgress * (end - start) + start);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return count;
}
