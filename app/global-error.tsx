"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#eef1f4] p-8 font-sans text-[#12151a]">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-[#64748b]">
          We have been notified. Try again or return to the home page.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[#12151a] px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-[#d3dae2] px-4 py-2 text-sm font-semibold"
          >
            Home
          </a>
        </div>
      </body>
    </html>
  );
}
