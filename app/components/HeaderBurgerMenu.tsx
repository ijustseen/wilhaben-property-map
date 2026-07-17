"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type BurgerNavItem =
  | { type: "link"; href: string; label: string; badge?: number; icon?: ReactNode }
  | {
      type: "button";
      label: string;
      onClick: () => void;
      disabled?: boolean;
    };

type HeaderBurgerMenuProps = {
  items: BurgerNavItem[];
  variant?: "light" | "solid" | "map";
  label?: string;
};

export default function HeaderBurgerMenu({
  items,
  variant = "solid",
  label = "Open menu",
}: HeaderBurgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  const overlay =
    open && mounted ? (
      <>
        <button
          type="button"
          className="header-burger-backdrop"
          aria-label="Close menu"
          onClick={close}
        />
        <nav
          id={panelId}
          className={`header-burger-panel header-burger-panel--${variant}`}
          aria-label="Site menu"
        >
          <ul className="header-burger-list">
            {items.map((item) => (
              <li key={item.type === "link" ? item.href : item.label}>
                {item.type === "link" ? (
                  <Link
                    href={item.href}
                    className="header-burger-link"
                    onClick={close}
                  >
                    <span className="header-burger-link-main">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.badge != null && item.badge > 0 ? (
                      <span className="header-burger-badge">{item.badge}</span>
                    ) : null}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="header-burger-link"
                    disabled={item.disabled}
                    onClick={() => {
                      item.onClick();
                      close();
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </>
    ) : null;

  return (
    <>
      <button
        type="button"
        className={`header-burger-trigger header-burger-trigger--${variant}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          {open ? (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
