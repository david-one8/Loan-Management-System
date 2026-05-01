'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  disableBackdropClose?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  disableBackdropClose = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!disableBackdropClose && e.target === overlayRef.current) {
      onClose();
    }
  }

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-4 dark:bg-slate-950/90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={panelRef}
        className={[
          'flex max-h-[90vh] w-full flex-col overflow-hidden',
          'rounded-t-3xl border-t border-slate-200 bg-white shadow-card-lg',
          'animate-fade-up sm:rounded-2xl sm:border',
          'dark:border-[#1e293b] dark:bg-[#111827]',
          maxWidth,
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-[#1e293b]">
          <h3 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
