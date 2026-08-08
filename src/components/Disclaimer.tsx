"use client";

import { useState } from "react";
import { TAX_DISCLAIMER } from "@/lib/calc/tax";

export function Disclaimer() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="border-t border-[var(--line)] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs muted leading-relaxed">
        <p>
          For learning and curiosity — not a buy button, not personal advice.{" "}
          <button
            type="button"
            className="text-[var(--gold-bright)] underline-offset-2 hover:underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide details" : "Learn more"}
          </button>
        </p>
        {open && <p className="mt-2 opacity-90">{TAX_DISCLAIMER}</p>}
      </div>
    </footer>
  );
}

export function DisclaimerBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel px-3 py-2.5 text-xs muted mb-6">
      <p>
        Friendly note: gold growth and tax rates are numbers <em>you</em> choose
        — we don’t treat them as facts.{" "}
        <button
          type="button"
          className="text-[var(--gold-bright)] underline-offset-2 hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide details" : "Learn more"}
        </button>
      </p>
      {open && (
        <p className="mt-2 leading-relaxed">
          {TAX_DISCLAIMER} The little yearly bonus RBI pays (coupon) is taxed
          like interest; capital gains can apply to the gain if you bought on
          the exchange under rules from 1 Apr 2026.
        </p>
      )}
    </div>
  );
}
