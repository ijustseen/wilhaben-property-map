export type PlanInterval = "month";

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
  { label: "Account with unlimited saved listings", included: true },
  { label: "Price-drop & new-listing alerts", included: false },
  { label: "Saved searches with email notifications", included: false },
  { label: "Monthly cost breakdown export (PDF)", included: false },
];

export const PLANS: Plan[] = [
  {
    id: "plus-monthly",
    name: "StudiWohnkarte Plus",
    tagline: "Alerts and exports while you hunt for a flat",
    priceEur: 4.9,
    interval: "month",
    checkoutEnvKey: "LEMONSQUEEZY_PLUS_MONTHLY_URL",
    highlighted: true,
    features: [
      { label: "Everything in Free", included: true },
      { label: "Up to 5 saved searches with email alerts", included: true },
      { label: "Price-change notifications on favourites", included: true },
      { label: "Compare commute to 2 campuses side by side", included: true },
      { label: "Export favourites & cost summary (PDF)", included: true },
      { label: "Priority support", included: true },
      { label: "Cancel anytime — no annual lock-in", included: true },
    ],
  },
];

export function getCheckoutUrl(plan: Plan): string | null {
  const fromEnv = process.env[plan.checkoutEnvKey];
  if (fromEnv?.trim()) return fromEnv.trim();
  return null;
}

export function formatPlanPrice(plan: Plan): string {
  return `€${plan.priceEur.toFixed(2)}/mo`;
}
