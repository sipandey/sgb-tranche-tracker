export function ExampleWalkthrough() {
  return (
    <aside className="panel p-4 sm:p-5 mb-6 border-l-2 border-[var(--gold)] animate-rise-delay">
      <p className="text-xs tracking-[0.14em] uppercase text-[var(--gold)] mb-2">
        Illustrative example — not a live quote
      </p>
      <h2 className="font-display text-xl mb-2">A quick walkthrough</h2>
      <p className="text-sm leading-relaxed muted">
        Example: Ravi buys SGBFEB33 today at ₹14,045 because it’s trading{" "}
        <span className="text-[var(--ink)]">5.75% below the actual gold price</span>
        . If gold prices stay flat, in about{" "}
        <span className="text-[var(--ink)]">6 years 6 months</span> he gets that
        gap back plus the fixed{" "}
        <span className="text-[var(--ink)]">
          2.5% yearly interest RBI pays for holding the bond (coupon)
        </span>
        . Real outcomes depend on gold moves, taxes, and the price you actually
        get when trading.
      </p>
    </aside>
  );
}
