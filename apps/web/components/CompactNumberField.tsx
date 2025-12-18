"use client";
import * as React from "react";

type Props = {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  suffix?: string;     // optional trailing label e.g. "lbs/ac"
  ariaLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;  // allow caller overrides
};

export default function CompactNumberField({
  value, onChange, placeholder, suffix, ariaLabel,
  min, max, step = 1, className
}: Props) {
  const [text, setText] = React.useState(value ?? "");

  React.useEffect(() => setText(value ?? ""), [value]);

  const parse = (s: string) => {
    if (s.trim() === "") return undefined;
    const n = Number(s.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <div className="inline-flex items-center gap-1">
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={text as any}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(parse(String(text)))}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChange((value ?? 0) + step);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(min ?? -Infinity, (value ?? 0) - step));
          }
        }}
        className={[
          // compact size
          "h-9 w-24 md:w-28",
          // visuals
          "rounded-md border border-gray-300 px-2 text-sm",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-sky-500",
          // allow overrides
          className ?? ""
        ].join(" ")}
      />
      {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
    </div>
  );
}
