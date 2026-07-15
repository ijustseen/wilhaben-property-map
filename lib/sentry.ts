import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

export const sentryEnabled = Boolean(dsn);

export function sharedSentryOptions():
  | Pick<BrowserOptions, "dsn" | "enabled" | "tracesSampleRate" | "environment">
  | Pick<NodeOptions, "dsn" | "enabled" | "tracesSampleRate" | "environment">
  | Pick<EdgeOptions, "dsn" | "enabled" | "tracesSampleRate" | "environment"> {
  return {
    dsn,
    enabled: sentryEnabled,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  };
}
