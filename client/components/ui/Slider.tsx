'use client';

import React, { useId } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Percentage filled for the track gradient
  const pct = ((value - min) / (max - min)) * 100;

  const displayValue = formatValue ? formatValue(value) : String(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value));
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 select-none"
        >
          {label}
        </label>
        <span className="text-xl font-bold text-blue-600 tabular-nums">
          {displayValue}
        </span>
      </div>

      {/* Range input */}
      <div className="relative py-1">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 appearance-none rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(to right, #2563eb ${pct}%, #e5e7eb ${pct}%)`,
          }}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={displayValue}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-xs text-gray-400 select-none -mt-1">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      {/* Thumb styles injected globally via a style tag — only once */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(37, 99, 235, 0.35);
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
        }
        input[type='range']::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(37, 99, 235, 0.35);
          cursor: pointer;
        }
        input[type='range']::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}