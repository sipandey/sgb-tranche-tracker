/** Display copy only — does not change calc/rules semantics. */

export const CORE_METAPHOR =
  "Gold bonds are like a coupon for real gold — and sometimes people sell that coupon for less than the gold is actually worth.";

export const SIGNAL_COPY: Record<
  string,
  {
    label: string;
    friendly: string;
    plain: string;
    icon: string;
    color: string;
  }
> = {
  strong_buy: {
    label: "Strong buy",
    friendly: "Great deal right now",
    plain:
      "This gold coupon is on a deep sale versus the actual gold price. Gaps like this have often narrowed over time — but gold can still go down, so only use money you can leave alone for years.",
    icon: "🟢",
    color: "var(--strong)",
  },
  buy: {
    label: "Buy",
    friendly: "Okay deal",
    plain:
      "Meaningfully cheaper than the gold behind it — worth a look if you’re patiently building a holding.",
    icon: "🟡",
    color: "var(--buy)",
  },
  trickle: {
    label: "Trickle",
    friendly: "Add a little",
    plain:
      "Only a small sale versus gold. Fine for a tiny top-up, not a big new purchase.",
    icon: "🔵",
    color: "var(--hold)",
  },
  skip: {
    label: "Skip",
    friendly: "Not today",
    plain:
      "This one’s selling above the gold price right now — not a great deal today. Look at cheaper batches instead.",
    icon: "⚪",
    color: "var(--skip)",
  },
  hold: {
    label: "Hold",
    friendly: "Keep waiting",
    plain:
      "If you already own it, the calm default is to keep it until payout day — switching is rarely worth the fuss.",
    icon: "🟡",
    color: "var(--hold)",
  },
  switch: {
    label: "Switch?",
    friendly: "Maybe switch batches",
    plain:
      "Another batch looks clearly cheaper after costs. Only consider moving if the gap is large enough to bother.",
    icon: "🟡",
    color: "var(--warn)",
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
    ? "Few people are trading this batch right now — you might not get exactly this price when you buy."
    : undefined;

  if (outlier) {
    return {
      level: "off",
      label: "Double-check this one",
      detail:
        "The price looks oddly different between exchanges. Pause and verify before acting.",
      thinNote,
    };
  }
  if (!verified) {
    return {
      level: "caution",
      label: "Seen on one exchange only",
      detail:
        "We’ve only spotted this price on one exchange so far — treat it gently and confirm before you buy.",
      thinNote,
    };
  }
  return {
    level: "confirmed",
    label: "Price looks solid",
    detail: "Two exchanges agree on this price — a good confidence check.",
    thinNote,
  };
}

export function discountPlain(discountPct: number): {
  short: string;
  full: string;
  saleLine: string;
} {
  if (discountPct >= 0) {
    return {
      short: `On sale — ${discountPct.toFixed(1)}% extra gold value`,
      full: `This gold coupon is on sale. You’re getting about ${discountPct.toFixed(2)}% more gold value for the same money (discount to fair value).`,
      saleLine: `${discountPct.toFixed(1)}% EXTRA`,
    };
  }
  return {
    short: "Selling above the gold price — not a great deal today",
    full: `This batch costs about ${Math.abs(discountPct).toFixed(2)}% more than the gold behind it right now (a premium).`,
    saleLine: `${Math.abs(discountPct).toFixed(1)}% OVER`,
  };
}

export function batchDisplayName(code: string): string {
  // SGBFEB33 → Feb 2033 batch; SGBDE31III / SGBDEC31 → Dec 2031 batch
  const m = code
    .toUpperCase()
    .match(/^SGB([A-Z]{2,3})(\d{2})([IVX]*)$/);
  if (!m) return `${code} batch`;
  const months: Record<string, string> = {
    JAN: "Jan",
    FEB: "Feb",
    MAR: "Mar",
    APR: "Apr",
    MAY: "May",
    JUN: "Jun",
    JUL: "Jul",
    AUG: "Aug",
    SEP: "Sep",
    OCT: "Oct",
    NOV: "Nov",
    DEC: "Dec",
    DE: "Dec",
  };
  const mon = months[m[1]] || m[1];
  const year = `20${m[2]}`;
  const series = m[3] ? ` (${m[3]})` : "";
  return `${mon} ${year}${series} batch`;
}

export function formatCountdown(years: number | null | undefined): string {
  if (years == null || !Number.isFinite(years) || years < 0) return "—";
  const totalMonths = Math.max(0, Math.round(years * 12));
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0 && m === 0) return "Less than a month";
  if (y === 0) return `${m} month${m === 1 ? "" : "s"}`;
  if (m === 0) return `${y} year${y === 1 ? "" : "s"}`;
  return `${y} year${y === 1 ? "" : "s"}, ${m} month${m === 1 ? "" : "s"}`;
}

export const LEARN_ARTICLES: {
  id: string;
  title: string;
  body: string;
}[] = [
  {
    id: "what-is-sgb",
    title: "What is a Sovereign Gold Bond?",
    body: "Think of it as a coupon for gold, issued by the government. You don’t keep bars at home — you hold a bond that tracks gold’s price. RBI also pays a little yearly bonus (like interest on a savings account) until the batch matures. New batches stopped, but older ones still trade between people on the stock exchange.",
  },
  {
    id: "why-differ",
    title: "Why isn’t the price always equal to gold?",
    body: "People buy and sell these coupons among themselves. Some days they’re eager to sell cheap; some days they ask for more. Taxes, how easy it is to trade, and how long until payout all nudge the price. This app watches for days when the coupon looks cheaper than the gold behind it.",
  },
  {
    id: "discount",
    title: "What does “on sale” mean for me?",
    body: "If a batch is cheaper than the gold it represents, you’re paying less for that gold-linked value — like a store coupon on discount. That gap has often closed as payout day nears, but nothing is promised. Gold can fall, and you should only use money you can leave untouched for years.",
  },
  {
    id: "catch",
    title: "What’s the catch?",
    body: "Quiet batches (few traders) may not fill at the price you see. Gold prices can drop. The yearly bonus is taxed as income. And if you buy on the exchange (not at original RBI issue), capital-gains tax may apply on the gain at payout under rules from April 2026.",
  },
  {
    id: "taxes",
    title: "How do taxes work if I buy on the exchange?",
    body: "The yearly bonus from RBI is taxed like interest. From 1 Apr 2026, secondary-market buyers usually pay capital gains tax on the gain at redemption — not on the bonus. Put your own tax rates in Settings; this app never treats defaults as advice.",
  },
];

export const COMIC_PANELS = [
  {
    n: "1",
    title: "RBI sold gold coupons",
    body: "The government once sold bonds linked to gold — like coupons for real gold.",
  },
  {
    n: "2",
    title: "People trade them now",
    body: "Those coupons still change hands on the stock exchange between regular folks.",
  },
  {
    n: "3",
    title: "Sometimes cheap, sometimes pricey",
    body: "Sellers don’t always ask exactly the gold price — deals swing day to day.",
  },
  {
    n: "4",
    title: "This app spots the bargains",
    body: "We rank when a coupon looks cheaper than the gold behind it — and when it doesn’t.",
  },
];

export const BUY_SAFETY =
  "This shows what’s cheap right now — it doesn’t guarantee gold prices will go up. Only invest money you can leave untouched for years.";

export const EDUCATIONAL_NOTE =
  "Learning mode: this tool explains how gold-bond coupons work. It does not place trades for you.";
