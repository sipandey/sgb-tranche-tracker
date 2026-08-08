"use client";

import { useState } from "react";
import { LEARN_ARTICLES } from "@/lib/plain-language";

export function LearnPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="learn-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Learn"
    >
      <button
        type="button"
        className="learn-backdrop"
        onClick={onClose}
        aria-label="Close"
      />
      <aside className="learn-drawer panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-2xl">Learn over chai</h2>
          <button
            type="button"
            className="btn btn-ghost text-sm min-h-11"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <p className="text-sm muted mb-5">
          Short, friendly explainers. No quiz at the end — just enough to feel
          oriented.
        </p>
        <div className="space-y-5">
          {LEARN_ARTICLES.map((a) => (
            <article key={a.id}>
              <h3 className="font-display text-lg mb-1.5">{a.title}</h3>
              <p className="text-sm muted leading-relaxed">{a.body}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

export function LearnButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="px-2 py-1 whitespace-nowrap text-[var(--gold-bright)] hover:underline min-h-10"
        onClick={() => setOpen(true)}
      >
        Learn
      </button>
      <LearnPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
