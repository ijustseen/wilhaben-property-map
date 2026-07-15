import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-5 text-center">
      <p className="font-display text-5xl text-[var(--ink)]">{BRAND_NAME}</p>
      <h1 className="mt-4 text-2xl font-semibold text-[var(--ink)]">
        City map not available
      </h1>
      <p className="mt-2 max-w-md text-[var(--muted)]">
        Only universities in live cities are available right now. More Austrian cities are on the roadmap.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
      >
        Back to city search
      </Link>
    </div>
  );
}
