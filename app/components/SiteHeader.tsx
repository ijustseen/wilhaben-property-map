"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { universityMapPath, UNIVERSITIES } from "@/lib/universities";

const liveMapHref =
  universityMapPath(
    UNIVERSITIES.find((u) => u.status === "available") ?? UNIVERSITIES[0],
  );

type SiteHeaderProps = {
  user: AuthUser | null;
  variant?: "light" | "solid";
  /** Transparent over hero until the page is scrolled */
  overlay?: boolean;
};

export default function SiteHeader({
  user,
  variant = "light",
  overlay = false,
}: SiteHeaderProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/me", { method: "DELETE" });
      router.refresh();
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header
      className={[
        "site-header",
        `site-header--${variant === "solid" ? "solid" : "light"}`,
        overlay ? "site-header--overlay" : "",
        overlay && scrolled ? "site-header--scrolled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link href="/" className="site-header-brand">
        {BRAND_NAME}
      </Link>
      <nav>
        <Link href={liveMapHref} className="site-header-link">
          Map
        </Link>
        <Link href="/favorites" className="site-header-link">
          Saved
        </Link>
        <Link href="/pricing" className="site-header-link">
          Plus
        </Link>
        {user ? (
          <>
            <Link href="/profile" className="site-header-link">
              {user.name.split(" ")[0]}
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={handleLogout}
              className="site-header-link"
              style={{ background: "transparent", border: 0, cursor: "pointer" }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="site-header-link">
              Log in
            </Link>
            <Link href="/register" className="site-header-cta">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
