import SiteHeader from "../components/SiteHeader";
import AuthForm from "../components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(next?.startsWith("/") ? next : "/map/linz?university=jku");

  return (
    <div className="auth-shell">
      <SiteHeader user={null} variant="solid" />
      <main className="auth-card">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink)]">
          Welcome back
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Log in with Google or email to sync favourites across devices. The map
          works without an account too.
        </p>
        <div className="auth-panel">
          <AuthForm mode="login" />
        </div>
      </main>
    </div>
  );
}
