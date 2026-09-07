"use client";

import clsx from "clsx";

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
}) {
  const canDecrement = value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
      <button
        type="button"
        disabled={!canDecrement}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={clsx(
          "flex h-11 w-11 items-center justify-center text-xl font-semibold transition-colors",
          canDecrement ? "text-slate-700 hover:bg-slate-100" : "text-slate-300"
        )}
        aria-label="Diminuer"
      >
        −
      </button>
      <span className="min-w-[2.5rem] px-2 text-center text-base font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={!canIncrement}
        onClick={() => onChange(value + 1)}
        className={clsx(
          "flex h-11 w-11 items-center justify-center text-xl font-semibold transition-colors",
          canIncrement ? "text-slate-700 hover:bg-slate-100" : "text-slate-300"
        )}
        aria-label="Augmenter"
      >
        +
      </button>
    </div>
  );
}
