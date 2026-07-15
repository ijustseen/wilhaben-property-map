import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import {
  extractWebhookContext,
  syncProfilePlan,
  verifyLemonSqueezySignature,
  type LemonWebhookPayload,
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_resumed",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
]);

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ctx = extractWebhookContext(payload);

  if (!HANDLED_EVENTS.has(ctx.eventName)) {
    return NextResponse.json({ ok: true, ignored: ctx.eventName });
  }

  try {
    const result = await syncProfilePlan({
      plan: ctx.plan,
      email: ctx.email,
      userId: ctx.userId,
      subscriptionId: ctx.subscriptionId,
    });

    if (!result.updated) {
      Sentry.captureMessage("Lemon Squeezy webhook: profile not updated", {
        level: "warning",
        extra: { ...ctx, reason: result.reason },
      });
    }

    return NextResponse.json({
      ok: true,
      event: ctx.eventName,
      plan: ctx.plan,
      updated: result.updated,
      reason: result.reason,
    });
  } catch (error) {
    Sentry.captureException(error, { extra: { event: ctx.eventName } });
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
