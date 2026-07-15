import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "../components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { listFavorites } from "@/lib/favorites";
import { MAP_ENTRY_PATH, universityMapPath, UNIVERSITIES } from "@/lib/universities";

const liveMapHref = MAP_ENTRY_PATH;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  const favorites = await listFavorites(user.id);
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-svh bg-[var(--background)]">
      <SiteHeader user={user} variant="solid" />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
          Profile
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Your {BRAND_NAME} account for student housing search.
        </p>

        <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-xl font-bold text-[var(--accent-strong)]">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--ink)]">
            {user.name}
          </h2>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Member since {memberSince}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-5">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Saved
              </dt>
              <dd className="text-2xl font-bold text-[var(--ink)]">
                {favorites.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Focus
              </dt>
              <dd className="text-2xl font-bold text-[var(--ink)]">Campus</dd>
            </div>
          </dl>
        </section>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/favorites"
            className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--mist)]"
          >
            View saved listings →
          </Link>
          <Link
            href={liveMapHref}
            className="rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
          >
            Back to map
          </Link>
        </div>
      </main>
    </div>
  );
}
