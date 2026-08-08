"use client";

import { useState } from "react";
import { TAX_DISCLAIMER } from "@/lib/calc/tax";

export function Disclaimer() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="border-t border-[var(--line)] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs muted leading-relaxed">
        <p>
          Not investment advice. Tax and return assumptions are yours to set.{" "}
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
    <div className="panel px-3 py-2 text-xs muted mb-6">
      <p>
        Not investment advice — gold growth and tax rates are your inputs.{" "}
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
          {TAX_DISCLAIMER} The fixed 2.5% yearly interest RBI pays (coupon) is
          taxed as income; capital gains apply to the gain portion on
          secondary-market purchases under rules from 1 Apr 2026.
        </p>
      )}
    </div>
  );
}
