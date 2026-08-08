/** Display copy only — does not change calc/rules semantics. */

export const SIGNAL_COPY: Record<
  string,
  { label: string; plain: string }
> = {
  strong_buy: {
    label: "Strong buy",
    plain:
      "This bond is trading well below the actual gold price, which historically narrows over time — buying here has typically paid off",
  },
  buy: {
    label: "Buy",
    plain:
      "Meaningfully cheaper than gold right now — a solid candidate if you want to put money to work",
  },
  trickle: {
    label: "Trickle",
    plain:
      "Only a small gap vs gold — fine for a small top-up, not a large new purchase",
  },
  skip: {
    label: "Skip",
    plain:
      "Costs more than gold right now — better to wait or put capital into a cheaper bond",
  },
  hold: {
    label: "Hold",
    plain:
      "If you already own it, the default is to keep it until payout — switching is rarely worth the hassle",
  },
  switch: {
    label: "Switch?",
    plain:
      "Another bond looks clearly cheaper after costs — only consider moving if the gap is large enough",
  },
};

export type TrustLevel = "confirmed" | "caution" | "off";

export function trustFromFlags(flags: {
  verified: boolean | number;
  outlier: boolean | number;
  thin?: boolean | number;
}): {
  level: TrustLevel;
  label: string;
  detail: string;
  thinNote?: string;
} {
  const verified = Boolean(Number(flags.verified));
  const outlier = Boolean(Number(flags.outlier));
  const thin = Boolean(Number(flags.thin));

  const thinNote = thin
    ? "Few people are trading this bond right now — you may not get this exact price when you buy (thin liquidity)."
    : undefined;

  if (outlier) {
    return {
      level: "off",
      label: "Data looks off — skip for now",
      detail:
        "This price looks unusually different from the other exchange — double-check before acting (outlier).",
      thinNote,
    };
  }
  if (!verified) {
    return {
      level: "caution",
      label: "Check before buying",
      detail:
        "Price only seen on one exchange — treat with caution (unverified).",
      thinNote,
    };
  }
  return {
    level: "confirmed",
    label: "Confirmed",
    detail: "Price confirmed on two exchanges (verified).",
    thinNote,
  };
}

/** Positive discount = cheaper than gold. */
export function discountPlain(discountPct: number): {
  short: string;
  full: string;
} {
  if (discountPct >= 0) {
    return {
      short: `Cheaper than gold by ${discountPct.toFixed(2)}%`,
      full: `Cheaper than gold price by ${discountPct.toFixed(2)}% (discount to fair value)`,
    };
  }
  return {
    short: "Costs more than gold price right now",
    full: `Costs more than gold price right now by ${Math.abs(discountPct).toFixed(2)}% (premium to fair value)`,
  };
}

export function formatCountdown(years: number | null | undefined): string {
  if (years == null || !Number.isFinite(years) || years < 0) return "—";
  const totalMonths = Math.max(0, Math.round(years * 12));
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0 && m === 0) return "Less than a month left";
  if (y === 0) return `${m} month${m === 1 ? "" : "s"} left`;
  if (m === 0) return `${y} year${y === 1 ? "" : "s"} left`;
  return `${y} year${y === 1 ? "" : "s"} ${m} month${m === 1 ? "" : "s"} left`;
}

export const LEARN_ARTICLES: {
  id: string;
  title: string;
  body: string;
}[] = [
  {
    id: "what-is-sgb",
    title: "What is a Sovereign Gold Bond?",
    body: "A Sovereign Gold Bond (SGB) is a government bond linked to gold. You don’t store physical gold — you hold a bond that tracks gold’s price and pays a fixed 2.5% yearly interest (coupon) until it matures. After RBI stopped new issues, you can still buy existing bonds on the stock exchange (the secondary market).",
  },
  {
    id: "why-differ",
    title: "Why do SGB prices differ from gold’s actual price?",
    body: "Exchange prices reflect what buyers and sellers agree today, not a perfect gold calculator. Bonds can trade cheaper or pricier than the gold they represent because of taxes, how easy they are to trade, time left until payout, and day-to-day demand. That gap is the opportunity this app watches.",
  },
  {
    id: "discount",
    title: "What does “discount” mean for me as a buyer?",
    body: "If a bond is cheaper than the gold price (a discount to fair value), you are paying less than the gold content suggests. That gap has often narrowed over time as the bond approaches payout — but it is not a guarantee. Always treat buy signals as a checklist, not a promise.",
  },
  {
    id: "catch",
    title: "What’s the catch — liquidity and risk",
    body: "Some bonds barely trade (thin liquidity), so the listed price may not be the price you actually get. Gold can fall. Interest is taxed as income. And from April 2026, secondary-market buyers generally lose the old capital-gains exemption at maturity — you may owe tax on the gain portion.",
  },
  {
    id: "taxes",
    title: "How taxes work on SGBs bought in the secondary market",
    body: "The fixed 2.5% yearly interest is taxed as income at your slab. From 1 Apr 2026, buying on the exchange (not at original RBI issue) usually means capital gains tax on the gain at redemption — not on the interest. Enter your own tax rates in Settings; this app never treats defaults as advice.",
  },
];

export const PAGE_WHAT_IS_THIS =
  "Sovereign Gold Bonds (SGBs) are government bonds linked to gold that you can still buy on the stock exchange. Sometimes they trade cheaper or pricier than the actual gold price — this page ranks those gaps. Signals mean: Strong buy / Buy = worth a look when cheaper than gold; Skip = costs more than gold right now.";
