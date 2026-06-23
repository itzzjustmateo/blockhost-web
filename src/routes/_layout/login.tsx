import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_layout/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await authClient.signIn.email({ email, password });

    setLoading(false);

    if (err) {
      setError(err.message || "Invalid email or password");
      return;
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="display-title font-bold text-3xl text-[var(--sea-ink)]">
            Welcome back
          </h1>
          <p className="mt-2 text-[var(--sea-ink-soft)] text-sm">
            Sign in to your BlockHost account
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              className="mb-1.5 block font-medium text-[var(--sea-ink)] text-sm"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="block w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-[var(--sea-ink)] text-sm placeholder:text-[var(--kicker)] focus:border-[var(--sea-ink)] focus:outline-none"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block font-medium text-[var(--sea-ink)] text-sm"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="block w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-[var(--sea-ink)] text-sm placeholder:text-[var(--kicker)] focus:border-[var(--sea-ink)] focus:outline-none"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
          </div>

          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-6 font-medium text-[var(--bg-base)] text-sm transition-all hover:bg-[var(--lagoon-deep)] disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign in"}
            {loading ? null : <ArrowRight className="size-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-[var(--sea-ink-soft)] text-sm">
          Don&apos;t have an account?{" "}
          <Link
            className="font-medium text-[var(--sea-ink)] hover:underline"
            to="/signup"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
