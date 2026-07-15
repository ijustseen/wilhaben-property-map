import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import LegalDocument from "../components/LegalDocument";
import { getCurrentUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import {
  legalContactEmail,
  legalOperatorName,
  legalPageTitle,
  siteUrl,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: legalPageTitle("privacy"),
  description: `Privacy policy (Datenschutz) for ${BRAND_NAME} — GDPR information.`,
};

export default async function PrivacyPage() {
  const user = await getCurrentUser();
  const site = siteUrl();

  return (
    <div className="landing-shell">
      <SiteHeader user={user} variant="solid" />
      <main>
        <LegalDocument
          title="Privacy Policy (Datenschutz)"
          subtitle="How we process personal data under the EU General Data Protection Regulation (GDPR) and Austrian data protection law."
        >
          <section>
            <h2>1. Controller</h2>
            <p>
              Controller: <strong>{legalOperatorName()}</strong>
              <br />
              Contact:{" "}
              <a href={`mailto:${legalContactEmail()}`}>{legalContactEmail()}</a>
              <br />
              Website: <a href={site}>{site}</a>
            </p>
          </section>

          <section>
            <h2>2. What we process</h2>
            <ul>
              <li>
                <strong>Account data</strong> — email, display name, auth
                provider (email/password or Google), stored in Supabase when you
                register or log in.
              </li>
              <li>
                <strong>Saved listings</strong> — listing IDs, titles, prices,
                addresses you choose to save (Supabase).
              </li>
              <li>
                <strong>Plus billing</strong> — subscription status via Lemon
                Squeezy (payment details are processed by Lemon Squeezy, not on
                our servers).
              </li>
              <li>
                <strong>Technical data</strong> — IP address, browser type,
                pages visited (Vercel Analytics, aggregated; error events in
                Sentry).
              </li>
              <li>
                <strong>Functional cookies</strong> — session, locale
                preference, short-lived OAuth state (see section 6).
              </li>
            </ul>
            <p>
              We do <strong>not</strong> sell personal data. We do not use
              advertising trackers or cross-site profiling cookies.
            </p>
          </section>

          <section>
            <h2>3. Purposes and legal bases</h2>
            <ul>
              <li>
                Provide the map and account features — Art. 6(1)(b) GDPR
                (contract / pre-contractual steps).
              </li>
              <li>
                Plus subscriptions — Art. 6(1)(b) GDPR; payment via Lemon
                Squeezy as processor.
              </li>
              <li>
                Security, abuse prevention, error monitoring — Art. 6(1)(f) GDPR
                (legitimate interest).
              </li>
              <li>
                Aggregated analytics to improve the product — Art. 6(1)(f) GDPR
                (legitimate interest; privacy-oriented, no marketing profiles).
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Processors &amp; third parties</h2>
            <ul>
              <li>
                <strong>Vercel</strong> — hosting ({site})
              </li>
              <li>
                <strong>Supabase</strong> — database &amp; authentication (EU/US
                region per your project settings)
              </li>
              <li>
                <strong>Google</strong> — optional OAuth login (Google Ireland
                Ltd.)
              </li>
              <li>
                <strong>Lemon Squeezy</strong> — payments &amp; invoices for
                Plus
              </li>
              <li>
                <strong>Sentry</strong> — error monitoring (may include IP,
                browser, stack traces)
              </li>
              <li>
                <strong>Vercel Analytics</strong> — privacy-friendly page view
                statistics
              </li>
            </ul>
            <p>
              Listing data is fetched from third-party housing sites (willhaben,
              wg-gesucht, dorm operators). When you open a listing, you leave{" "}
              {BRAND_NAME} and their privacy policies apply.
            </p>
          </section>

          <section>
            <h2>5. Retention</h2>
            <ul>
              <li>Account &amp; favourites — until you delete your account.</li>
              <li>Server logs — typically up to 30 days (Vercel).</li>
              <li>Sentry events — per Sentry project retention (default 90 days).</li>
              <li>
                Lemon Squeezy records — per their policies and tax obligations.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>We use only functional / strictly necessary cookies:</p>
            <ul>
              <li>
                <code>campus_map_session</code> — keeps you logged in (session).
              </li>
              <li>
                <code>locale</code> — remembers EN/DE UI preference (~1 year).
              </li>
              <li>
                <code>google_oauth_state</code> — short-lived CSRF protection
                during Google login.
              </li>
            </ul>
            <p>
              Vercel Analytics does not use cross-site tracking cookies. If we
              add optional analytics later, we will ask for consent first.
            </p>
          </section>

          <section>
            <h2>7. Your rights</h2>
            <p>
              You have the right to access, rectify, erase, restrict processing,
              data portability, and to object (Art. 15–21 GDPR). You may lodge a
              complaint with the Austrian Data Protection Authority (
              <a
                href="https://www.dsb.gv.at"
                target="_blank"
                rel="noopener noreferrer"
              >
                dsb.gv.at
              </a>
              ).
            </p>
            <p>
              Contact{" "}
              <a href={`mailto:${legalContactEmail()}`}>{legalContactEmail()}</a>{" "}
              for any request. We respond within one month.
            </p>
          </section>

          <section>
            <h2>8. Children</h2>
            <p>
              {BRAND_NAME} is aimed at university students (typically 18+). We do
              not knowingly collect data from children under 16.
            </p>
          </section>

          <section>
            <h2>9. Changes</h2>
            <p>
              We may update this policy. Material changes will be noted on this
              page with a new &quot;Last updated&quot; date.
            </p>
          </section>
        </LegalDocument>
      </main>
      <SiteFooter />
    </div>
  );
}
