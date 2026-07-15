import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE, GITHUB_URL } from "@/lib/brand";
import { universityMapPath, UNIVERSITIES } from "@/lib/universities";

const liveUni = UNIVERSITIES.find((u) => u.status === "available");

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-logo">
            {BRAND_NAME}
          </Link>
          <p>{BRAND_TAGLINE} — maps free; Plus adds alerts &amp; exports.</p>
        </div>

        <div className="site-footer-cols">
          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <Link href={liveUni ? universityMapPath(liveUni) : "/"}>
                  Housing map
                </Link>
              </li>
              <li>
                <Link href="/pricing">StudiWohnkarte Plus</Link>
              </li>
              <li>
                <Link href="/favorites">Saved listings</Link>
              </li>
              <li>
                <Link href="/login">Log in</Link>
              </li>
              <li>
                <Link href="/register">Sign up</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Legal</h3>
            <ul>
              <li>
                <Link href="/impressum">Legal notice (Impressum)</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy policy (Datenschutz)</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Project</h3>
            <ul>
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report an issue
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="site-footer-github"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.303-5.467-1.333-5.467-5.932 0-1.31.468-2.382 1.236-3.222-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.807 5.625-5.48 5.922.43.37.814 1.102.814 2.222 0 1.604-.015 2.896-.015 3.29 0 .32.216.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12Z" />
          </svg>
          ijustseen/wilhaben-property-map
        </a>
      </div>
    </footer>
  );
}
