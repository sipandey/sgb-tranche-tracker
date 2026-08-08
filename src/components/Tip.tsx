"use client";

import { useId, useState, type ReactNode } from "react";

/** One-tap “What does this mean?” bubble. */
export function WhatIsThis({
  title = "What does this mean?",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle ml-1">
      <button
        type="button"
        className="what-btn"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" id={id} className="tip-bubble what-bubble">
          <strong className="block text-[var(--ink)] mb-1">{title}</strong>
          <span className="muted">{children}</span>
        </span>
      )}
    </span>
  );
}

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
