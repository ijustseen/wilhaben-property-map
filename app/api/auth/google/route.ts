import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleRedirectUri,
  isGoogleAuthConfigured,
} from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", request.url),
    );
  }

  const next = request.nextUrl.searchParams.get("next");
  const statePayload = Buffer.from(
    JSON.stringify({
      nonce: randomBytes(16).toString("hex"),
      next: next?.startsWith("/") ? next : "/map/linz?university=jku",
    }),
  ).toString("base64url");

  const redirectUri = getGoogleRedirectUri(request.nextUrl.origin);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    state: statePayload,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  response.cookies.set("google_oauth_state", statePayload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
