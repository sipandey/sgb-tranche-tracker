export function ExampleWalkthrough() {
  return (
    <aside className="panel p-4 sm:p-5 mb-6 border-l-[3px] border-[var(--gold)] animate-rise-delay">
      <p className="text-xs tracking-[0.14em] uppercase text-[var(--gold)] mb-2">
        Made-up example — not a live price
      </p>
      <h2 className="font-display text-xl mb-2">Ravi’s coupon story</h2>
      <p className="text-sm leading-relaxed muted">
        Example: Ravi buys the Feb 2033 batch today at ₹14,045 because that gold
        coupon is on sale — about{" "}
        <span className="text-[var(--ink)]">5.75% cheaper than the gold</span>{" "}
        behind it. If gold prices stay flat, over roughly{" "}
        <span className="text-[var(--ink)]">6 years 6 months</span> he may get
        that gap back, plus RBI’s little yearly bonus (like savings-account
        interest). Real life depends on gold, taxes, and the price he actually
        gets when trading.
      </p>
    </aside>
  );
}
