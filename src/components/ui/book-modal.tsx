"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface BookModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const BookModal: React.FC<BookModalProps> = ({ open, onClose, children, className }) => {
  const [portalEl, setPortalEl] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = document.createElement('div');
    el.className = 'book-modal-portal';
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      if (el.parentElement) el.parentElement.removeChild(el);
    };
  }, []);

  if (!portalEl) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              "relative bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 overflow-hidden flex flex-row book-effect",
              className
            )}
            initial={{ scale: 0.8, rotateY: 30 }}
            animate={{ scale: 1, rotateY: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }}
            exit={{ scale: 0.8, rotateY: 30 }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-2xl text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            <div className="p-8 w-full">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, portalEl);
};

export default BookModal;
