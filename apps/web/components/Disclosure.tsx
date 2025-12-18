"use client";
import * as React from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function Disclosure({ title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2"
        aria-expanded={open}
      >
        <span className="font-medium">{title}</span>
        <span aria-hidden className={`transition ${open ? "rotate-90" : ""}`}>▸</span>
      </button>
      {open && <div className="border-t border-gray-200 p-4">{children}</div>}
    </div>
  );
}
