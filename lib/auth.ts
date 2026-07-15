import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  createPasswordUser,
  findUserById,
  findUserByEmail,
  upsertGoogleUserRecord,
  type StoredUser,
} from "@/lib/user-store";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  provider: "password" | "google";
};

const SESSION_COOKIE = "campus_map_session";

function authSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    "dev-only-campus-map-secret-change-me-in-production"
  );
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function publicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    provider: user.provider ?? (user.googleId ? "google" : "password"),
  };
}

function signPayload(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    }),
  ).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function readSessionToken(token: string): { sub: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { sub?: string; exp?: number };
    if (!data.sub || !data.exp || data.exp < Date.now()) return null;
    return { sub: data.sub };
  } catch {
    return null;
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address");
  }
  if (name.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const salt = randomBytes(16).toString("hex");
  const user = await createPasswordUser({
    email,
    name,
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
  });
  return publicUser(user);
}

export async function authenticateUser(
  emailInput: string,
  password: string,
): Promise<AuthUser> {
  const email = emailInput.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash || !user.passwordSalt) {
    throw new Error("Invalid email or password");
  }

  const hash = hashPassword(password, user.passwordSalt);
  const left = Buffer.from(hash, "hex");
  const right = Buffer.from(user.passwordHash, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("Invalid email or password");
  }

  return publicUser(user);
}

export { findUserById };

export async function createSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function upsertGoogleUser(input: {
  googleId: string;
  email: string;
  name: string;
}): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email.split("@")[0] || "Student";
  if (!email.includes("@")) {
    throw new Error("Google account is missing an email");
  }

  const user = await upsertGoogleUserRecord({
    googleId: input.googleId,
    email,
    name,
  });
  return publicUser(user);
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function getGoogleRedirectUri(origin: string): string {
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${origin.replace(/\/$/, "")}/api/auth/google/callback`
  );
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = readSessionToken(token);
  if (!session) return null;
  const user = await findUserById(session.sub);
  return user ? publicUser(user) : null;
}
