"use client";

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type FlipCardProps = {
  isFlipped?: boolean;
  onToggle?: () => void;
  frontClassName?: string;
  backClassName?: string;
  children?: React.ReactNode; // expecting [front, back]
  className?: string;
  disableOverlay?: boolean;
  as?: React.ElementType; // optional custom outer interactive element
};

const FlipCard: React.FC<FlipCardProps> = ({ isFlipped = false, onToggle, frontClassName, backClassName, children, className, disableOverlay = false, as }) => {
  const childrenArr = React.Children.toArray(children);
  const front = childrenArr[0] ?? null;
  const back = childrenArr[1] ?? null;

  const interactive = typeof onToggle === 'function';
  // Never render a native button to avoid nested button hydration errors; emulate button semantics.
  const Wrapper: any = as || 'div';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const measure = () => {
      if (frontRef.current) {
        let h = frontRef.current.getBoundingClientRect().height;
        // ignore bogus zero measurements (images may not be loaded yet)
        if (!h || h < 8) {
          // schedule a short re-measure after images have a chance to load
          setTimeout(() => {
            try {
              const h2 = frontRef.current?.getBoundingClientRect().height || 0;
              if (h2 && h2 > 8) setContainerHeight(h2);
            } catch {}
          }, 120);
          return;
        }
        setContainerHeight(h);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [children]);

  // ensure flipped element sits above neighbours while flipping but keep below PhotoSwipe controls
  const zIndex = isFlipped ? 10001 : undefined;

  // add a class to the container while flipped so CSS can opt-out from global blurs
  useEffect(() => {
    if (!containerRef.current) return;
    if (isFlipped) {
      containerRef.current.classList.add('flip-focus');
    } else {
      containerRef.current.classList.remove('flip-focus');
    }
  }, [isFlipped]);

  // overlay management: create a single blur overlay on document.body when any flip opens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (disableOverlay) return; // overlay disabled for this instance
    // if PhotoSwipe is open, avoid creating a second overlay that could obscure controls
    if ((window as any).__photoSwipeOpen) return;

    (window as any).__flipOpenCount = (window as any).__flipOpenCount || 0;

    const createOverlay = () => {
      const overlay = document.createElement('div');
      overlay.className = 'flip-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '40';
      overlay.style.background = 'rgba(255,255,255,0.0)';
      overlay.style.backdropFilter = 'blur(6px)';
      // assign WebKit specific property via setProperty to satisfy TS
      overlay.style.setProperty('-webkit-backdrop-filter', 'blur(6px)');
      overlay.style.pointerEvents = 'auto';
      return overlay;
    };

    let overlayEl: HTMLDivElement | null = null;

    if (isFlipped) {
      (window as any).__flipOpenCount += 1;
      if ((window as any).__flipOpenCount === 1) {
        overlayEl = createOverlay();
        // clicking overlay closes this card
        overlayEl.addEventListener('click', () => {
          onToggle?.();
        });
        document.body.appendChild(overlayEl);
      }
    } else {
      if ((window as any).__flipOpenCount > 0) {
        (window as any).__flipOpenCount -= 1;
      }
      if ((window as any).__flipOpenCount === 0) {
        const existing = document.querySelector('.flip-overlay');
        existing?.parentElement?.removeChild(existing);
      }
    }

    return () => {
      // cleanup if component unmounts while overlay present
      if (isFlipped) {
        if ((window as any).__flipOpenCount > 0) {
          (window as any).__flipOpenCount -= 1;
        }
      }
      if ((window as any).__flipOpenCount === 0) {
        const existing = document.querySelector('.flip-overlay');
        existing?.parentElement?.removeChild(existing);
      }
    };
  }, [isFlipped, onToggle, disableOverlay]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden', className)}
      style={{ perspective: 1200 }}
    >
      <Wrapper
        className={cn('w-full h-full relative block text-left', interactive ? 'cursor-pointer' : '')}
        {...(interactive ? { role: 'button', tabIndex: 0, 'aria-pressed': isFlipped } : {})}
        onClick={interactive ? (e: React.MouseEvent) => { e.stopPropagation(); onToggle?.(); } : undefined}
        onKeyDown={interactive ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggle?.(); } } : undefined}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 700ms cubic-bezier(.2,.8,.2,1)',
          willChange: 'transform',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          border: 'none',
          background: 'transparent',
          padding: 0,
          height: containerHeight ? `${containerHeight}px` : undefined,
          zIndex,
          boxSizing: 'border-box',
        }}
      >
        <div
          ref={frontRef}
          className={cn('w-full h-full', frontClassName)}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            position: 'relative'
          }}
        >
          {front}
        </div>

        <div
          className={cn('w-full h-full absolute inset-0 overflow-auto', backClassName)}
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            boxSizing: 'border-box'
          }}
        >
          {back}
        </div>
      </Wrapper>
    </div>
  );
};

export default FlipCard;
