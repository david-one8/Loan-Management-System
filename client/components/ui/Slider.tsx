'use client';

import React, { useId } from 'react';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  hint?: string;
  disabled?: boolean;
}

export default function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  hint,
  disabled = false,
}: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : String(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 select-none dark:text-slate-300">
          {label}
        </label>
        <span className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-bold tabular-nums text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
          {displayValue}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700"
        style={{
          background: `linear-gradient(to right, #155EEF 0%, #155EEF ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)`,
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
      />

      <div className="mt-1 flex justify-between text-2xs text-slate-400 select-none dark:text-slate-600">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>

      {hint && <p className="text-xs text-slate-400 dark:text-slate-600">{hint}</p>}
    </div>
  );
}
