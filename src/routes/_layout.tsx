import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Blocks, LogOut, Menu, Moon, Sun, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_layout")({ component: Layout });

function Layout() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const router = useRouterState();
  const routeId = router.location.pathname;

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        setDark(e.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-[var(--line)] border-b bg-[var(--header-bg)] backdrop-blur-lg">
        <div className="page-wrap flex h-16 items-center justify-between">
          <Link className="flex items-center gap-2.5 no-underline" to="/">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--sea-ink)] text-[var(--bg-base)] shadow-sm">
              <Blocks className="size-5" />
            </div>
            <span className="font-bold text-[var(--sea-ink)] text-lg tracking-tight">
              BlockHost
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              activeProps={{ className: "nav-link is-active" }}
              className="nav-link font-medium text-sm"
              to="/"
            >
              Home
            </Link>
            <Link
              activeProps={{ className: "nav-link is-active" }}
              className="nav-link font-medium text-sm"
              to="/pricing"
            >
              Pricing
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              aria-label="Toggle dark mode"
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--link-bg-hover)]"
              onClick={toggleDark}
              type="button"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  className="flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--link-bg-hover)]"
                  to="/dashboard"
                >
                  <span className="font-bold text-xs">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </Link>
                <button
                  aria-label="Sign out"
                  className="flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--link-bg-hover)]"
                  onClick={() => authClient.signOut()}
                  type="button"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-transparent px-4 font-medium text-[var(--sea-ink)] text-sm transition-all hover:bg-[var(--link-bg-hover)]"
                  to="/login"
                >
                  Sign In
                </Link>
                <a
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-4 font-medium text-[var(--bg-base)] text-sm transition-all hover:bg-[var(--lagoon-deep)]"
                  href="/dashboard"
                >
                  Get Started
                </a>
              </div>
            )}
          </div>

          <button
            aria-label="Toggle menu"
            className="flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-[var(--line)] border-t bg-[var(--header-bg)] backdrop-blur-lg md:hidden">
            <div className="page-wrap flex flex-col gap-2 py-4">
              <Link
                className="nav-link rounded-lg px-3 py-2 font-medium text-sm"
                onClick={() => setMenuOpen(false)}
                to="/"
              >
                Home
              </Link>
              <Link
                className="nav-link rounded-lg px-3 py-2 font-medium text-sm"
                onClick={() => setMenuOpen(false)}
                to="/pricing"
              >
                Pricing
              </Link>
              <hr className="border-[var(--line)]" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 text-[var(--sea-ink)] text-sm">
                    <User className="size-4" />
                    {user.name || user.email}
                  </div>
                  <button
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[var(--sea-ink-soft)] text-sm hover:bg-[var(--link-bg-hover)]"
                    onClick={() => {
                      authClient.signOut();
                      setMenuOpen(false);
                    }}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3 px-3">
                  <Link
                    className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2 text-center font-medium text-[var(--sea-ink)] text-sm transition-all hover:bg-[var(--link-bg-hover)]"
                    onClick={() => setMenuOpen(false)}
                    to="/login"
                  >
                    Sign In
                  </Link>
                  <a
                    className="flex-1 rounded-xl bg-[var(--sea-ink)] px-4 py-2 text-center font-medium text-[var(--bg-base)] text-sm transition-all hover:bg-[var(--lagoon-deep)]"
                    href="/dashboard"
                  >
                    Get Started
                  </a>
                </div>
              )}
              <hr className="border-[var(--line)]" />
              <div className="flex items-center gap-3 px-3">
                <button
                  aria-label="Toggle dark mode"
                  className="flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]"
                  onClick={toggleDark}
                  type="button"
                >
                  {dark ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </button>
                <span className="text-[var(--sea-ink-soft)] text-sm">
                  {dark ? "Light mode" : "Dark mode"}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="animate-page-in" key={routeId}>
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-wrap py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              className="mb-3 flex items-center gap-2.5 no-underline"
              to="/"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--sea-ink)] text-[var(--bg-base)] shadow-sm">
                <Blocks className="size-4" />
              </div>
              <span className="font-bold text-[var(--sea-ink)] text-base">
                BlockHost
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-[var(--sea-ink-soft)] text-sm">
              Free Minecraft server hosting with modern management tools. Launch
              in seconds, manage from anywhere.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-bold text-[var(--kicker)] text-xs uppercase tracking-widest">
              Navigation
            </h4>
            <div className="flex flex-col gap-2">
              <Link className="nav-link text-sm" to="/">
                Home
              </Link>
              <Link className="nav-link text-sm" to="/pricing">
                Pricing
              </Link>
              <a className="nav-link text-sm" href="/dashboard">
                Dashboard
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-bold text-[var(--kicker)] text-xs uppercase tracking-widest">
              Legal
            </h4>
            <div className="flex flex-col gap-2">
              <a className="nav-link text-sm" href="/terms">
                Terms of Service
              </a>
              <a className="nav-link text-sm" href="/privacy">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-[var(--line)] border-t pt-6 text-center text-[var(--sea-ink-soft)] text-xs">
          &copy; {new Date().getFullYear()} BlockHost. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
