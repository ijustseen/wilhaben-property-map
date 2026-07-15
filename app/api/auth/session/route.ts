import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  createSessionCookie,
  registerUser,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      mode?: "login" | "register";
    };

    const email = body.email ?? "";
    const password = body.password ?? "";
    const mode = body.mode === "register" ? "register" : "login";

    const user =
      mode === "register"
        ? await registerUser({
            email,
            password,
            name: body.name ?? "",
          })
        : await authenticateUser(email, password);

    await createSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
