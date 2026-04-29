import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  /** Tailwind color class, e.g. "text-blue-600" */
  color?: string;
  label?: string;
}

// ─── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<SpinnerSize, { svg: string; border: string }> = {
  sm: { svg: 'w-4 h-4', border: 'border-2' },
  md: { svg: 'w-6 h-6', border: 'border-2' },
  lg: { svg: 'w-10 h-10', border: 'border-[3px]' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Spinner({
  size = 'md',
  color = 'text-blue-600',
  label = 'Loading…',
}: SpinnerProps) {
  const { svg, border } = sizeMap[size];

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block ${svg} ${color} animate-spin-slow`}
    >
      <span
        className={[
          'block w-full h-full rounded-full',
          border,
          'border-current border-t-transparent',
        ].join(' ')}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ─── Full-page centered spinner ───────────────────────────────────────────────

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

// ─── Overlay spinner for card-level loading ───────────────────────────────────

export function OverlaySpinner() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl"
      aria-busy="true"
    >
      <Spinner size="lg" />
    </div>
  );
}