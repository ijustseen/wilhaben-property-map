"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { MAP_ENTRY_PATH } from "@/lib/universities";
import HeaderBurgerMenu from "./HeaderBurgerMenu";
import { useCompactHeader } from "./useCompactHeader";

const liveMapHref = MAP_ENTRY_PATH;

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
  const compact = useCompactHeader();

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

  const menuItems = useMemo(() => {
    const mapLink = {
      type: "link" as const,
      href: liveMapHref,
      label: "Map",
      icon: <Map className="header-burger-item-icon" strokeWidth={2} aria-hidden />,
    };
    const savedLink = {
      type: "link" as const,
      href: "/favorites",
      label: "Saved listings",
      icon: <Heart className="header-burger-item-icon" strokeWidth={2} aria-hidden />,
    };
    if (user) {
      return [
        mapLink,
        savedLink,
        { type: "link" as const, href: "/profile", label: user.name.split(" ")[0] },
        {
          type: "button" as const,
          label: "Log out",
          disabled: busy,
          onClick: () => void handleLogout(),
        },
      ];
    }
    return [
      mapLink,
      savedLink,
      { type: "link" as const, href: "/login", label: "Log in" },
      { type: "link" as const, href: "/register", label: "Sign up" },
    ];
  }, [user, busy]);

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
      {compact ? (
        <HeaderBurgerMenu
          variant={variant === "solid" ? "solid" : "light"}
          items={menuItems}
        />
      ) : (
        <nav className="site-header-nav" aria-label="Main">
          <Link href={liveMapHref} className="site-header-link site-header-link--icon">
            <Map className="site-header-link-icon" strokeWidth={2} aria-hidden />
            Map
          </Link>
          <Link href="/favorites" className="site-header-link site-header-link--icon">
            <Heart className="site-header-link-icon" strokeWidth={2} aria-hidden />
            Saved
          </Link>
          {user ? (
            <>
              <Link href="/profile" className="site-header-link">
                {user.name.split(" ")[0]}
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleLogout()}
                className="site-header-link"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
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
      )}
    </header>
  );
}
