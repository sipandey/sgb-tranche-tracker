/** Visual: taller stack ≈ bigger sale (display only). */
export function CoinStack({
  discountPct,
  size = "md",
}: {
  discountPct: number;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(-5, Math.min(12, discountPct));
  // Map roughly -5..12% → 1..5 coins
  const coins = Math.max(
    1,
    Math.min(5, Math.round(((clamped + 5) / 17) * 4) + 1)
  );
  const heights =
    size === "lg" ? [10, 14, 18, 22, 26] : size === "sm" ? [6, 8, 10, 12, 14] : [8, 11, 14, 17, 20];

  return (
    <div
      className="coin-stack"
      aria-hidden
      title={`Bigger stack ≈ bigger deal (${discountPct.toFixed(1)}%)`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`coin ${i < coins ? "coin--on" : "coin--off"}`}
          style={{ height: heights[i], width: heights[i] * 2.2 }}
        />
      ))}
    </div>
  );
}
