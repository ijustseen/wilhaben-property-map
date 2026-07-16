import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import {
  FREE_TIER_FEATURES,
  formatPlanPrice,
  getCheckoutUrl,
  PLANS,
} from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing — StudiWohnkarte Plus",
  description:
    "Upgrade for listing alerts, saved searches, and PDF exports. Pay monthly via Lemon Squeezy.",
  path: "/pricing",
  titleAbsolute: true,
});

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="landing-shell">
      <SiteHeader user={user} variant="solid" />
      <main className="pricing-page">
        <div className="landing-wrap pricing-hero">
          <p className="landing-kicker">StudiWohnkarte Plus</p>
          <h1 className="landing-headline landing-headline--sm">
            Hunt smarter during flat season.
          </h1>
          <p className="landing-copy pricing-lead">
            The map and unlimited saves stay free for every Austrian university
            city. Plus adds email alerts, saved searches, and exports while you
            are actively applying for housing.
          </p>
        </div>

        <div className="landing-wrap pricing-grid">
          <section className="pricing-card pricing-card--free">
            <h2>Free</h2>
            <p className="pricing-price">€0</p>
            <p className="pricing-tagline">Browse &amp; compare on the map</p>
            <ul className="pricing-features">
              {FREE_TIER_FEATURES.map((feature) => (
                <li
                  key={feature.label}
                  className={feature.included ? "" : "pricing-feature-off"}
                >
                  {feature.label}
                </li>
              ))}
            </ul>
            <Link href="/register" className="landing-cta landing-cta--ink">
              Create free account
            </Link>
          </section>

          {PLANS.map((plan) => {
            const checkout = getCheckoutUrl(plan);
            return (
              <section
                key={plan.id}
                className={`pricing-card ${plan.highlighted ? "pricing-card--highlight" : ""}`}
              >
                {plan.highlighted && (
                  <span className="pricing-badge">Most popular</span>
                )}
                <h2>{plan.name}</h2>
                <p className="pricing-price">{formatPlanPrice(plan)}</p>
                <p className="pricing-tagline">{plan.tagline}</p>
                <ul className="pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature.label}>{feature.label}</li>
                  ))}
                </ul>
                {checkout ? (
                  <a
                    href={checkout}
                    className="landing-cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Subscribe via Lemon Squeezy
                  </a>
                ) : (
                  <p className="pricing-setup-hint">
                    Checkout URL not configured. Set{" "}
                    <code>{plan.checkoutEnvKey}</code> in <code>.env.local</code>
                    . See <code>MONETIZATION.md</code>.
                  </p>
                )}
              </section>
            );
          })}
        </div>

        <div className="landing-wrap pricing-notes">
          <h2 className="landing-headline landing-headline--sm">
            What you get with Plus
          </h2>
          <ul className="landing-bullets">
            <li>
              <strong>Alerts</strong> — email when new listings match your saved
              search (city, rent, rooms).
            </li>
            <li>
              <strong>Price watch</strong> — notification if a favourited
              listing changes price on the source site.
            </li>
            <li>
              <strong>Export</strong> — PDF of favourites with monthly cost
              breakdown for WG/dorm all-in totals.
            </li>
            <li>
              <strong>Payments</strong> — handled by Lemon Squeezy (VAT, invoices,
              cancel anytime).
            </li>
          </ul>
          <p className="landing-copy">
            Questions? Open an issue on{" "}
            <a
              href="https://github.com/ijustseen/wilhaben-property-map/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{" "}
            or email from your Lemon Squeezy receipt.
          </p>
          <Link href="/" className="site-header-link pricing-back">
            ← Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
