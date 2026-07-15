import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { AuthUser } from "@/lib/auth";

export type StoredUser = AuthUser & {
  passwordHash?: string;
  passwordSalt?: string;
  googleId?: string;
};

type UserStore = {
  users: StoredUser[];
};

type AppUserRow = {
  id: string;
  email: string;
  name: string;
  provider: string;
  password_hash: string | null;
  password_salt: string | null;
  google_id: string | null;
  created_at: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function useDatabase(): boolean {
  return isSupabaseAdminConfigured();
}

function rowToStoredUser(row: AppUserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    provider: row.provider as AuthUser["provider"],
    passwordHash: row.password_hash ?? undefined,
    passwordSalt: row.password_salt ?? undefined,
    googleId: row.google_id ?? undefined,
  };
}

function userToRow(user: StoredUser): Omit<AppUserRow, "created_at"> & {
  created_at?: string;
} {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    password_hash: user.passwordHash ?? null,
    password_salt: user.passwordSalt ?? null,
    google_id: user.googleId ?? null,
    created_at: user.createdAt,
  };
}

async function readJsonStore(): Promise<UserStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as UserStore;
    if (!Array.isArray(parsed.users)) return { users: [] };
    return parsed;
  } catch {
    const empty: UserStore = { users: [] };
    await fs.writeFile(USERS_FILE, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function writeJsonStore(store: UserStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function findUserByIdDb(id: string): Promise<StoredUser | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("app_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToStoredUser(data as AppUserRow) : null;
}

async function findUserByEmailDb(email: string): Promise<StoredUser | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("app_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToStoredUser(data as AppUserRow) : null;
}

async function findUserByGoogleIdDb(googleId: string): Promise<StoredUser | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("app_users")
    .select("*")
    .eq("google_id", googleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToStoredUser(data as AppUserRow) : null;
}

async function upsertUserDb(user: StoredUser): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Database not configured");
  const { error } = await admin.from("app_users").upsert(userToRow(user), {
    onConflict: "id",
  });
  if (error) throw new Error(error.message);
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (useDatabase()) return findUserByIdDb(id);
  const store = await readJsonStore();
  const user = store.users.find((item) => item.id === id);
  return user ?? null;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  if (useDatabase()) return findUserByEmailDb(email);
  const store = await readJsonStore();
  const user = store.users.find((item) => item.email === email);
  return user ?? null;
}

export async function createPasswordUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<StoredUser> {
  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    email: input.email,
    name: input.name,
    createdAt: new Date().toISOString(),
    provider: "password",
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
  };

  if (useDatabase()) {
    const existing = await findUserByEmailDb(input.email);
    if (existing) throw new Error("An account with this email already exists");
    await upsertUserDb(user);
    return user;
  }

  const store = await readJsonStore();
  if (store.users.some((item) => item.email === input.email)) {
    throw new Error("An account with this email already exists");
  }
  store.users.push(user);
  await writeJsonStore(store);
  return user;
}

export async function saveUser(user: StoredUser): Promise<void> {
  if (useDatabase()) {
    await upsertUserDb(user);
    return;
  }
  const store = await readJsonStore();
  const index = store.users.findIndex((item) => item.id === user.id);
  if (index >= 0) {
    store.users[index] = user;
  } else {
    store.users.push(user);
  }
  await writeJsonStore(store);
}

export async function upsertGoogleUserRecord(input: {
  googleId: string;
  email: string;
  name: string;
}): Promise<StoredUser> {
  if (useDatabase()) {
    const byGoogle = await findUserByGoogleIdDb(input.googleId);
    if (byGoogle) {
      byGoogle.name = input.name;
      byGoogle.email = input.email;
      byGoogle.provider = "google";
      await upsertUserDb(byGoogle);
      return byGoogle;
    }

    const byEmail = await findUserByEmailDb(input.email);
    if (byEmail) {
      byEmail.googleId = input.googleId;
      byEmail.provider = byEmail.passwordHash ? byEmail.provider : "google";
      byEmail.name = input.name;
      await upsertUserDb(byEmail);
      return byEmail;
    }

    const user: StoredUser = {
      id: randomBytes(12).toString("hex"),
      email: input.email,
      name: input.name,
      createdAt: new Date().toISOString(),
      provider: "google",
      googleId: input.googleId,
    };
    await upsertUserDb(user);
    return user;
  }

  const store = await readJsonStore();
  const byGoogle = store.users.find((item) => item.googleId === input.googleId);
  if (byGoogle) {
    byGoogle.name = input.name;
    byGoogle.email = input.email;
    byGoogle.provider = "google";
    await writeJsonStore(store);
    return byGoogle;
  }

  const byEmail = store.users.find((item) => item.email === input.email);
  if (byEmail) {
    byEmail.googleId = input.googleId;
    byEmail.provider = byEmail.passwordHash ? byEmail.provider : "google";
    byEmail.name = input.name;
    await writeJsonStore(store);
    return byEmail;
  }

  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    email: input.email,
    name: input.name,
    createdAt: new Date().toISOString(),
    provider: "google",
    googleId: input.googleId,
  };
  store.users.push(user);
  await writeJsonStore(store);
  return user;
}
