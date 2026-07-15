import Link from "next/link";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import UniversitySearch from "./components/UniversitySearch";
import { getCurrentUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { MAP_ENTRY_PATH } from "@/lib/universities";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="landing-shell">
      <div className="landing-hero-stack">
        <SiteHeader user={user} variant="light" overlay />
        <section className="landing-hero">
          <div className="landing-inner">
            <h1 className="landing-brand">{BRAND_NAME}</h1>
          <p className="landing-lead">
            Pick your university — then explore apartments, WGs and dorms on a
            map of that city and the area around campus.
          </p>
          <UniversitySearch />
          </div>
        </section>
      </div>

      <section className="landing-section landing-section--for">
        <div className="landing-wrap">
          <p className="landing-kicker reveal">Built for students in Austria</p>
          <h2 className="landing-headline reveal reveal-delay-1">
            Start with your university.
            <br />
            <span>Find housing in its city.</span>
          </h2>
          <p className="landing-copy reveal reveal-delay-2">
            {BRAND_NAME} matches listings to the city of the campus you choose —
            so rent, location and the commute back to lectures stay on the same
            map.
          </p>
        </div>
      </section>

      <section className="landing-section landing-section--flow">
        <div className="landing-wrap">
          <p className="landing-kicker reveal">How it works</p>
          <ol className="landing-flow">
            <li className="reveal">
              <span className="landing-flow-num">01</span>
              <div>
                <h3>Choose a university</h3>
                <p>
                  Search your campus across Austria — major universities in
                  Vienna, Graz, Linz, Salzburg, Innsbruck and more.
                </p>
              </div>
            </li>
            <li className="reveal reveal-delay-1">
              <span className="landing-flow-num">02</span>
              <div>
                <h3>Explore that city&apos;s housing</h3>
                <p>
                  Apartments, shared flats and dorms for the city and surrounding
                  area — filter by rent, rooms and postal code.
                </p>
              </div>
            </li>
            <li className="reveal reveal-delay-2">
              <span className="landing-flow-num">03</span>
              <div>
                <h3>Check the commute</h3>
                <p>
                  See the route to your campus, save favourites, then open the
                  listing source when you&apos;re ready to apply.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="landing-section landing-section--map">
        <div className="landing-wrap landing-map-row">
          <div className="landing-map-copy">
            <p className="landing-kicker">On the map</p>
            <h2 className="landing-headline landing-headline--sm">
              Pins that expand into cards.
            </h2>
            <p className="landing-copy">
              Hover a price to preview the listing. Switch streets, satellite or
              terrain while you compare options near campus.
            </p>
            <ul className="landing-bullets">
              <li>All-in pricing for dorms &amp; shared flats</li>
              <li>Estimated utilities only when apartments need them</li>
              <li>Favourite sync when you create an account</li>
            </ul>
            <Link
              href={MAP_ENTRY_PATH}
              className="landing-cta landing-cta--ink"
            >
              Open the map
            </Link>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/map-preview.svg"
            alt="Map preview with expandable listing pins and layer switcher"
            className="landing-map-image"
            width={960}
            height={640}
          />
        </div>
      </section>

      <section className="landing-section landing-section--cta">
        <div className="landing-wrap landing-cta-band">
          <h2 className="landing-headline landing-headline--sm">
            Find a place before term starts.
          </h2>
          <p className="landing-copy">
            Free to browse every Austrian university city. Create an account to
            save listings and sync them across devices.
          </p>
          <div className="landing-actions">
            <Link href={MAP_ENTRY_PATH} className="landing-cta">
              Open map
            </Link>
            <Link
              href={user ? "/profile" : "/register"}
              className="landing-cta-ghost"
            >
              {user ? "Your profile" : "Create free account"}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
