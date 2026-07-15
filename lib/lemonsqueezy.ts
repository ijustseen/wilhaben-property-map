import { createHmac, timingSafeEqual } from "node:crypto";

export type LemonPlan = "free" | "plus";

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      status?: string;
      user_email?: string;
      customer_id?: number;
      variant_id?: number;
      product_id?: number;
    };
  };
};

const PLUS_STATUSES = new Set([
  "active",
  "on_trial",
  "paused",
  "past_due",
]);

export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.trim()) return false;

  const digest = Buffer.from(
    createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8",
  );
  const signature = Buffer.from(signatureHeader.trim(), "utf8");

  if (digest.length !== signature.length) return false;
  return timingSafeEqual(digest, signature);
}

export function planFromSubscriptionStatus(status: string | undefined): LemonPlan {
  if (!status) return "free";
  return PLUS_STATUSES.has(status.toLowerCase()) ? "plus" : "free";
}

export function extractWebhookContext(payload: LemonWebhookPayload): {
  eventName: string;
  email: string | null;
  userId: string | null;
  subscriptionId: string | null;
  status: string | null;
  plan: LemonPlan;
} {
  const eventName = payload.meta?.event_name ?? "unknown";
  const custom = payload.meta?.custom_data ?? {};
  const attrs = payload.data?.attributes ?? {};

  const userId =
    typeof custom.user_id === "string"
      ? custom.user_id
      : typeof custom.userId === "string"
        ? custom.userId
        : null;

  const email =
    typeof attrs.user_email === "string" ? attrs.user_email.trim().toLowerCase() : null;

  const status = typeof attrs.status === "string" ? attrs.status : null;
  const subscriptionId =
    payload.data?.type === "subscriptions" && payload.data.id
      ? String(payload.data.id)
      : null;

  const plan =
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
      ? "free"
      : planFromSubscriptionStatus(status ?? undefined);

  return {
    eventName,
    email,
    userId,
    subscriptionId,
    status,
    plan,
  };
}

export async function syncProfilePlan(input: {
  plan: LemonPlan;
  email: string | null;
  userId: string | null;
  subscriptionId: string | null;
}): Promise<{ updated: boolean; reason?: string }> {
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { updated: false, reason: "supabase_not_configured" };
  }

  const patch = {
    plan: input.plan,
    lemon_subscription_id: input.plan === "plus" ? input.subscriptionId : null,
  };

  if (input.userId) {
    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", input.userId)
      .select("id")
      .maybeSingle();

    if (error) return { updated: false, reason: error.message };
    if (data) return { updated: true };
  }

  if (!input.email) {
    return { updated: false, reason: "missing_user_reference" };
  }

  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("email", input.email)
    .select("id")
    .maybeSingle();

  if (error) return { updated: false, reason: error.message };
  if (!data) return { updated: false, reason: "profile_not_found" };
  return { updated: true };
}
