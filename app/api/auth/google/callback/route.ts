import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookie,
  getGoogleRedirectUri,
  isGoogleAuthConfigured,
  upsertGoogleUser,
} from "@/lib/auth";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  verified_email?: boolean;
};

export async function GET(request: NextRequest) {
  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(reason)}`, request.url),
    );

  if (!isGoogleAuthConfigured()) {
    return fail("google_not_configured");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("google_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return fail("google_state_mismatch");
  }

  let nextPath = "/map/linz?university=jku";
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { next?: string };
    if (parsed.next?.startsWith("/")) nextPath = parsed.next;
  } catch {
    // keep default
  }

  const redirectUri = getGoogleRedirectUri(request.nextUrl.origin);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    return fail(tokenData.error_description || tokenData.error || "google_token");
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  );
  const profile = (await profileRes.json()) as GoogleUserInfo;
  if (!profileRes.ok) {
    return fail("google_profile");
  }

  const googleId = profile.id ?? profile.sub;
  if (!googleId || !profile.email) {
    return fail("google_incomplete_profile");
  }

  try {
    const user = await upsertGoogleUser({
      googleId,
      email: profile.email,
      name: profile.name ?? profile.email,
    });
    await createSessionCookie(user.id);

    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "google_login_failed";
    return fail(message);
  }
}
