"use client";

import { useState, useEffect, type RefObject } from 'react';

type InViewOptions = IntersectionObserverInit & { once?: boolean };

export function useInView(ref: RefObject<Element>, options?: InViewOptions) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // We can unobserve once it is in view and we don't need to track it anymore
          if (ref.current && options?.once) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return isInView;
}
