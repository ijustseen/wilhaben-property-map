"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

const ERROR_COPY: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not configured yet. Ask the admin to set GOOGLE_CLIENT_ID / SECRET.",
  google_state_mismatch: "Google sign-in expired. Please try again.",
  google_token: "Could not finish Google sign-in. Try again.",
  google_profile: "Could not read your Google profile.",
  google_incomplete_profile: "Your Google account needs a public email.",
};

function AuthFormInner({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const urlError = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    return ERROR_COPY[code] ?? decodeURIComponent(code);
  }, [searchParams]);

  const next = searchParams.get("next");
  const googleHref = `/api/auth/google${
    next?.startsWith("/") ? `?next=${encodeURIComponent(next)}` : ""
  }`;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }
      router.refresh();
      router.push(next?.startsWith("/") ? next : "/map/linz?university=jku");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2";

  return (
    <div className="space-y-4">
      <a href={googleHref} className="auth-google">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 16.1 19 14 24 14c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 39.5 16 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l.0.0 6.2 5.2C39.2 36.3 44 31.1 44 24c0-1.3-.1-2.5-.4-3.5z"
          />
        </svg>
        Continue with Google
      </a>

      <div className="auth-divider">or email</div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="Alex"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Email
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Password
          </label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="At least 8 characters"
          />
        </div>

        {(error || urlError) && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {error ?? urlError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : "Log in with email"}
        </button>

        <p className="text-center text-sm text-[var(--muted)]">
          {mode === "register" ? (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[var(--accent-strong)]"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/register"
                className="font-medium text-[var(--accent-strong)]"
              >
                Sign up
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  return (
    <Suspense
      fallback={<div className="text-sm text-[var(--muted)]">Loading…</div>}
    >
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
