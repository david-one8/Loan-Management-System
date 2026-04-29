'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Max width class, e.g. "max-w-lg" */
  maxWidth?: string;
  /** Prevent close on backdrop click */
  disableBackdropClose?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap — move focus into panel on open
  useEffect(() => {
    if (isOpen) {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle backdrop click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!disableBackdropClose && e.target === overlayRef.current) {
      onClose();
    }
  }

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={[
        'fixed inset-0 z-50',
        'flex items-center justify-center p-4',
        'bg-black/40 backdrop-blur-sm',
        'animate-in fade-in duration-150',
      ].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={panelRef}
        className={[
          'relative bg-white rounded-2xl shadow-xl',
          'w-full',
          maxWidth,
          'max-h-[90vh] overflow-y-auto',
          'flex flex-col',
        ].join(' ')}
        style={{ animation: 'modalEnter 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3
            id="modal-title"
            className="text-base font-semibold text-gray-900"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1">{children}</div>
      </div>

      {/* Inline keyframe for modal enter animation */}
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );

  // Render into portal so it escapes any overflow:hidden ancestors
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}