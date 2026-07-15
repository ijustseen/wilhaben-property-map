import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "./lib/sentry";

Sentry.init({
  ...sharedSentryOptions(),
});
