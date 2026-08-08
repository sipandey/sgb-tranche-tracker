"use client";

import { useId, useState, type ReactNode } from "react";

export function Tip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center align-baseline">
      <button
        type="button"
        className="tip-trigger"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>
      {open && (
        <span role="tooltip" id={id} className="tip-bubble">
          {label}
        </span>
      )}
    </span>
  );
}
