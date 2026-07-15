import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import LegalDocument from "../components/LegalDocument";
import { getCurrentUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import {
  legalContactEmail,
  legalOperatorAddress,
  legalOperatorName,
  legalPageTitle,
  siteUrl,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: legalPageTitle("impressum"),
  description: `Legal notice and operator information for ${BRAND_NAME}.`,
};

export default async function ImpressumPage() {
  const user = await getCurrentUser();
  const site = siteUrl();

  return (
    <div className="landing-shell">
      <SiteHeader user={user} variant="solid" />
      <main>
        <LegalDocument
          title="Legal Notice (Impressum)"
          subtitle="Information pursuant to Austrian e-commerce and media law (ECG, MedienG). Provided in English for international students; Austrian mandatory disclosures apply."
        >
          <section>
            <h2>Service</h2>
            <p>
              <strong>{BRAND_NAME}</strong> — student housing maps for Austrian
              university cities.
            </p>
            <p>
              Website: <a href={site}>{site}</a>
            </p>
          </section>

          <section>
            <h2>Operator / Media owner</h2>
            <p>
              <strong>{legalOperatorName()}</strong>
              <br />
              {legalOperatorAddress()}
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Email:{" "}
              <a href={`mailto:${legalContactEmail()}`}>{legalContactEmail()}</a>
            </p>
            <p>
              For support about listings, use the original source (willhaben,
              wg-gesucht, dorm provider). For product issues, use GitHub or the
              email above.
            </p>
          </section>

          <section>
            <h2>Purpose of the website</h2>
            <p>
              {BRAND_NAME} aggregates publicly available rental listings and
              curated student dorm directories on a map. We do not act as a
              estate agent and do not conclude tenancy contracts on your behalf.
            </p>
          </section>

          <section>
            <h2>EU online dispute resolution</h2>
            <p>
              Platform for online dispute resolution (ODR) of the EU Commission:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              . We are not obliged to participate in dispute resolution before a
              consumer arbitration board and are generally not willing to do so.
            </p>
          </section>

          <section>
            <h2>Liability for content</h2>
            <p>
              We prepare content with care but cannot guarantee completeness or
              accuracy of third-party listing data. Prices, availability and
              addresses may change on the source platforms at any time.
            </p>
          </section>

          <section>
            <h2>Copyright</h2>
            <p>
              Map UI, branding and original text are protected. Listing
              content remains with the respective publishers (willhaben, WG
              platforms, dorm operators).
            </p>
          </section>
        </LegalDocument>
      </main>
      <SiteFooter />
    </div>
  );
}
