export type PlanInterval = "month" | "year";

export type PlanFeature = {
  label: string;
  included: boolean;
};

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  priceEur: number;
  interval: PlanInterval;
  /** Lemon Squeezy checkout URL from env */
  checkoutEnvKey: string;
  features: PlanFeature[];
  highlighted?: boolean;
};

export const FREE_TIER_FEATURES: PlanFeature[] = [
  { label: "Browse housing maps in all Austrian university cities", included: true },
  { label: "Apartments (willhaben) and WGs where available", included: true },
  { label: "Campus commute preview", included: true },
  { label: "Save up to 10 favourites", included: true },
  { label: "Price-drop & new-listing alerts", included: false },
  { label: "Unlimited favourites & saved searches", included: false },
  { label: "Monthly cost breakdown export (PDF)", included: false },
];

export const PLANS: Plan[] = [
  {
    id: "plus-monthly",
    name: "StudiWohnkarte Plus",
    tagline: "For active flat hunters during term prep",
    priceEur: 4.9,
    interval: "month",
    checkoutEnvKey: "LEMONSQUEEZY_PLUS_MONTHLY_URL",
    highlighted: true,
    features: [
      { label: "Everything in Free", included: true },
      { label: "Unlimited saved listings", included: true },
      { label: "Up to 5 saved searches with email alerts", included: true },
      { label: "Price-change notifications on favourites", included: true },
      { label: "Compare commute to 2 campuses side by side", included: true },
      { label: "Export favourites & cost summary (PDF)", included: true },
      { label: "Priority support", included: true },
    ],
  },
  {
    id: "plus-yearly",
    name: "StudiWohnkarte Plus",
    tagline: "Best value for a full academic year",
    priceEur: 39,
    interval: "year",
    checkoutEnvKey: "LEMONSQUEEZY_PLUS_YEARLY_URL",
    features: [
      { label: "Everything in Plus monthly", included: true },
      { label: "2 months free vs monthly billing", included: true },
      { label: "Same alerts, exports & unlimited saves", included: true },
    ],
  },
];

export function getCheckoutUrl(plan: Plan): string | null {
  const fromEnv = process.env[plan.checkoutEnvKey];
  if (fromEnv?.trim()) return fromEnv.trim();
  return null;
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.interval === "month") {
    return `€${plan.priceEur.toFixed(2)}/mo`;
  }
  return `€${plan.priceEur}/yr`;
}
