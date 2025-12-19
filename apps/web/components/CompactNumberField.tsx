"use client";
import * as React from "react";

type Props = {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  suffix?: string; // optional trailing label e.g. "lbs/ac"
  ariaLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string; // allow caller overrides
};

export default function CompactNumberField({
  value,
  onChange,
  placeholder,
  suffix,
  ariaLabel,
  min,
  max,
  step = 1,
  className,
}: Props) {
  // Keep input controlled as a string so user can type partial values (e.g. "-", ".", "1.")
  const [text, setText] = React.useState<string>(value != null ? String(value) : "");

  React.useEffect(() => {
    setText(value != null ? String(value) : "");
  }, [value]);

  const parse = (s: string): number | undefined => {
    const trimmed = s.trim();
    if (trimmed === "") return undefined;

    const n = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };

  const clamp = (n: number): number => {
    let out = n;
    if (min != null) out = Math.max(min, out);
    if (max != null) out = Math.min(max, out);
    return out;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const commit = () => {
    const parsed = parse(text);
    if (parsed == null) {
      onChange(undefined);
      return;
    }
    onChange(clamp(parsed));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = clamp((value ?? 0) + step);
      onChange(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = clamp((value ?? 0) - step);
      onChange(next);
    } else if (e.key === "Enter") {
      // handy: commit on Enter as well
      commit();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <input
        aria-label={ariaLabel}
        type="text"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={text}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={[
          // compact size
          "h-9 w-24 md:w-28",
          // visuals
          "rounded-md border border-gray-300 px-2 text-sm",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-sky-500",
          // allow overrides
          className ?? "",
        ].join(" ")}
      />
      {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
    </div>
  );
}
