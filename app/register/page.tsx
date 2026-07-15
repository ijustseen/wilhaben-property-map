import SiteHeader from "../components/SiteHeader";
import AuthForm from "../components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { MAP_ENTRY_PATH } from "@/lib/universities";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(MAP_ENTRY_PATH);

  return (
    <div className="auth-shell">
      <SiteHeader user={null} variant="solid" />
      <main className="auth-card">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink)]">
          Create account
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Free signup. Browse Linz either way.
        </p>
        <div className="auth-panel">
          <AuthForm mode="register" />
        </div>
      </main>
    </div>
  );
}
