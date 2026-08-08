import { BUY_SAFETY, EDUCATIONAL_NOTE } from "@/lib/plain-language";

export function SafetyNote({ className = "" }: { className?: string }) {
  return (
    <div className={`safety-note panel ${className}`}>
      <p className="text-sm leading-relaxed text-[var(--ink)]">
        <span className="text-[var(--gold)] font-medium">Friendly reminder: </span>
        {BUY_SAFETY}
      </p>
      <p className="text-xs muted mt-2">{EDUCATIONAL_NOTE}</p>
    </div>
  );
}
