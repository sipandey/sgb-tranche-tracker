import { TAX_DISCLAIMER } from "@/lib/calc/tax";

export function Disclaimer() {
  return (
    <footer className="border-t border-[var(--line)] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 text-xs muted leading-relaxed">
        {TAX_DISCLAIMER}
      </div>
    </footer>
  );
}

export function DisclaimerBanner() {
  return (
    <div className="panel px-3 py-2 text-xs muted mb-6">
      Not investment advice. Gold CAGR and tax rate are your inputs — never treated as facts.
    </div>
  );
}
