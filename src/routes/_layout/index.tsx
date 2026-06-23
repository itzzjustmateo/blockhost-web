import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  Database,
  HardDrive,
  LayoutDashboard,
  Puzzle,
  Server,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_layout/")({ component: Home });

const serverData: Record<
  string,
  {
    cpu: number;
    ram: string;
    ramPercent: number;
    players: string;
    playersPercent: number;
    online: boolean;
  }
> = {
  "survival-world": {
    cpu: 32,
    ram: "614 MB / 1 GB",
    ramPercent: 60,
    players: "3 / 20",
    playersPercent: 15,
    online: true,
  },
  "creative-zone": {
    cpu: 78,
    ram: "892 MB / 1 GB",
    ramPercent: 87,
    players: "12 / 20",
    playersPercent: 60,
    online: true,
  },
  "modded-adventure": {
    cpu: 12,
    ram: "256 MB / 1 GB",
    ramPercent: 25,
    players: "0 / 20",
    playersPercent: 0,
    online: false,
  },
};

const features = [
  {
    icon: Server,
    title: "Free Hosting",
    description:
      "Up to 3 Minecraft servers with 1 GB RAM each. Perfect for small friend groups and testing.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Startup",
    description:
      "Servers start in seconds on our optimized infrastructure. Minimal waiting time.",
  },
  {
    icon: Puzzle,
    title: "Mods & Plugins",
    description:
      "Install mods and plugins directly from the dashboard with one-click downloads. No FTP required.",
  },
  {
    icon: HardDrive,
    title: "Automated Backups",
    description:
      "Automatic backups every 24 hours. Up to 3 backups on Free plan. Disable or create manual backups anytime.",
  },
  {
    icon: LayoutDashboard,
    title: "Easy Management",
    description:
      "Start, stop, restart, and monitor servers with a simple and intuitive interface.",
  },
  {
    icon: Shield,
    title: "Secure Infrastructure",
    description:
      "Protected environment with isolated servers. Reliable uptime and data protection.",
  },
];

const reasons = [
  "Completely free plan available",
  "Fast deployment in seconds",
  "Beginner-friendly dashboard",
  "Plugin & mod support",
  "Automatic backups",
  "No complicated setup required",
];

const stats = [
  { icon: Server, label: "Servers Deployed" },
  { icon: Activity, label: "Uptime Percentage" },
  { icon: Database, label: "Backups Created" },
  { icon: Users, label: "Active Users" },
];

function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <WhyBlockHost />
      <FinalCta />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="page-wrap">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
          <div className="flex-1 space-y-6">
            <span className="island-kicker inline-block rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3.5 py-1 text-xs">
              Free Minecraft Server Hosting
            </span>
            <h1 className="display-title font-bold text-4xl text-[var(--sea-ink)] leading-tight md:text-5xl lg:text-6xl">
              Free Minecraft Hosting{" "}
              <span className="text-[var(--sea-ink-soft)]">
                Without the Hassle
              </span>
            </h1>
            <p className="max-w-lg text-[var(--sea-ink-soft)] text-base leading-relaxed md:text-lg">
              Launch your Minecraft server in seconds. Install mods and plugins
              with one click, create automatic backups, and manage everything
              from an intuitive dashboard.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-6 font-medium text-[var(--bg-base)] text-sm transition-all hover:bg-[var(--lagoon-deep)]"
                href="/dashboard"
              >
                Get Started
                <ArrowRight className="size-4" />
              </a>
              <Link
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-transparent px-6 font-medium text-[var(--sea-ink)] text-sm transition-all hover:bg-[var(--link-bg-hover)]"
                to="/pricing"
              >
                View Pricing
              </Link>
            </div>
          </div>

          <div className="flex-1">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  const [selected, setSelected] = useState("survival-world");
  const data = serverData[selected];

  return (
    <div className="island-shell w-full overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-[var(--line)] border-b px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-yellow-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
        </div>
        <span className="ml-2 font-medium text-[var(--sea-ink-soft)] text-xs">
          BlockHost Dashboard
        </span>
      </div>
      <div className="flex">
        <div className="hidden w-1/3 border-[var(--line)] border-r p-3 sm:block">
          <div className="mb-2 font-bold text-[10px] text-[var(--kicker)] uppercase tracking-wider">
            Your Servers
          </div>
          {Object.keys(serverData).map((name) => (
            <button
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                selected === name
                  ? "bg-[var(--link-bg-hover)] font-semibold text-[var(--sea-ink)]"
                  : "text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]"
              }`}
              key={name}
              onClick={() => setSelected(name)}
              type="button"
            >
              <span
                className={`size-1.5 rounded-full ${serverData[name].online ? "bg-green-500" : "bg-[var(--line)]"}`}
              />
              {name}
            </button>
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-[var(--sea-ink)] text-sm">
                {selected}
              </div>
              {data.online ? (
                <div className="flex items-center gap-1.5 text-[11px] text-green-600">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  Online
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--sea-ink-soft)]">
                  <span className="size-1.5 rounded-full bg-[var(--line)]" />
                  Offline
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <span className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 font-medium text-[10px] text-[var(--sea-ink-soft)]">
                Start
              </span>
              <span className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 font-medium text-[10px] text-[var(--sea-ink-soft)]">
                Stop
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[var(--sea-ink-soft)]">
                <span>CPU</span>
                <span>{data.cpu}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[var(--sea-ink)] transition-all"
                  style={{ width: `${data.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[var(--sea-ink-soft)]">
                <span>RAM</span>
                <span>{data.ram}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[var(--lagoon-deep)] transition-all"
                  style={{ width: `${data.ramPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[var(--sea-ink-soft)]">
                <span>Players</span>
                <span>{data.players}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[var(--line)] transition-all"
                  style={{ width: `${data.playersPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="page-wrap">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="island-kicker">Features</span>
          <h2 className="display-title mt-3 font-bold text-3xl text-[var(--sea-ink)] md:text-4xl">
            Everything you need to host
          </h2>
          <p className="mt-3 text-[var(--sea-ink-soft)]">
            Powerful tools designed for Minecraft server management, all from
            your browser.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              className={`feature-card group animate-fade-in rounded-xl p-6 transition-all hover:-translate-y-1 animate-stagger-${i + 1}`}
              key={f.title}
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--link-bg-hover)] text-[var(--sea-ink)] transition-colors group-hover:bg-[var(--sea-ink)] group-hover:text-[var(--bg-base)]">
                <f.icon className="size-5" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--sea-ink)] text-lg">
                {f.title}
              </h3>
              <p className="text-[var(--sea-ink-soft)] text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyBlockHost() {
  return (
    <section className="py-16 md:py-24">
      <div className="page-wrap">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="island-kicker">Why BlockHost</span>
            <h2 className="display-title mt-3 font-bold text-3xl text-[var(--sea-ink)] md:text-4xl">
              Built for players,{" "}
              <span className="text-[var(--sea-ink-soft)]">
                loved by admins
              </span>
            </h2>
            <p className="mt-3 text-[var(--sea-ink-soft)]">
              We make Minecraft server hosting accessible to everyone. No hidden
              fees, no technical expertise required.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {reasons.map((r) => (
                <li
                  className="flex items-start gap-2.5 text-[var(--sea-ink)] text-sm"
                  key={r}
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--sea-ink)]" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div
                className="island-shell flex flex-col items-center justify-center rounded-2xl p-6 text-center"
                key={s.label}
              >
                <s.icon className="mb-2 size-6 text-[var(--sea-ink-soft)]" />
                <span className="font-bold text-2xl text-[var(--kicker)]">
                  &mdash;
                </span>
                <span className="mt-1 text-[var(--sea-ink-soft)] text-xs">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-16 md:py-24">
      <div className="page-wrap">
        <div className="island-shell relative overflow-hidden rounded-3xl px-6 py-14 text-center md:px-16 md:py-20">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="display-title font-bold text-3xl text-[var(--sea-ink)] md:text-4xl">
              Ready to launch your Minecraft server?
            </h2>
            <p className="mt-3 text-[var(--sea-ink-soft)]">
              Get started for free and upgrade whenever you need more power.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-6 font-medium text-[var(--bg-base)] text-sm transition-all hover:bg-[var(--lagoon-deep)]"
                href="/dashboard"
              >
                Get Started
                <ArrowRight className="size-4" />
              </a>
              <Link
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-transparent px-6 font-medium text-[var(--sea-ink)] text-sm transition-all hover:bg-[var(--link-bg-hover)]"
                to="/pricing"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
