import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/_layout/pricing")({
  component: Pricing,
});

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "/month",
    badge: null,
    highlighted: false,
    features: [
      "1 GB RAM",
      "1 vCPU shared",
      "5 GB SSD Storage",
      "Up to 20 players",
      "3 servers",
      "3 backups",
      "Community support",
    ],
    cta: "Get Started",
    href: "/dashboard",
  },
  {
    name: "Premium",
    price: "€4.99",
    period: "/month",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "4 GB RAM",
      "2 vCPU",
      "15 GB SSD Storage",
      "Up to 100 players",
      "5 servers",
      "5 backups",
      "Priority startup queue",
      "Email support",
    ],
    cta: "Choose Premium",
    href: "/dashboard",
  },
  {
    name: "Pro",
    price: "€9.99",
    period: "/month",
    badge: null,
    highlighted: false,
    features: [
      "8 GB RAM",
      "3 vCPU",
      "30 GB SSD Storage",
      "Up to 150 players",
      "5 servers",
      "10 backups",
      "Faster startup priority",
      "Premium support",
    ],
    cta: "Choose Pro",
    href: "/dashboard",
  },
  {
    name: "Enterprise",
    price: "€39.99",
    period: "/month",
    badge: null,
    highlighted: false,
    features: [
      "12 GB RAM",
      "6 vCPU",
      "50 GB SSD Storage",
      "Up to 2,000 players",
      "10 servers",
      "30 backups",
      "Highest startup priority",
      "Dedicated support",
      "Advanced monitoring",
    ],
    cta: "Contact Sales",
    href: "/dashboard",
  },
];

const planKeys = ["free", "premium", "pro", "enterprise"] as const;

const comparisonRows = [
  { label: "RAM", values: ["1 GB", "4 GB", "8 GB", "12 GB"] },
  { label: "CPU", values: ["1 vCPU shared", "2 vCPU", "3 vCPU", "6 vCPU"] },
  {
    label: "Storage",
    values: ["5 GB SSD", "15 GB SSD", "30 GB SSD", "50 GB SSD"],
  },
  { label: "Max Players", values: ["20", "100", "150", "2,000"] },
  { label: "Max Servers", values: ["3", "5", "5", "10"] },
  { label: "Backups", values: ["3", "5", "10", "30"] },
  { label: "Support", values: ["Community", "Email", "Premium", "Dedicated"] },
  {
    label: "Startup Priority",
    values: ["Normal", "Priority", "Faster", "Highest"],
  },
];

function Pricing() {
  return (
    <>
      <section className="py-16 md:py-24">
        <div className="page-wrap">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="island-kicker">Pricing</span>
            <h1 className="display-title mt-3 font-bold text-3xl text-[var(--sea-ink)] md:text-4xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-3 text-[var(--sea-ink-soft)]">
              Start for free. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-[var(--sea-ink)] bg-[var(--link-bg-hover)]"
                    : "feature-card border-[var(--line)]"
                }`}
                key={plan.name}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--sea-ink)] px-4 py-1 font-bold text-[11px] text-[var(--bg-base)] uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </span>
                )}
                <div className={`${plan.badge ? "mt-2" : ""}`}>
                  <h3 className="font-bold text-[var(--sea-ink)] text-lg">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="display-title font-bold text-3xl text-[var(--sea-ink)]">
                      {plan.price}
                    </span>
                    <span className="text-[var(--sea-ink-soft)] text-sm">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <hr className="my-5 border-[var(--line)]" />

                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      className="flex items-start gap-2.5 text-[var(--sea-ink)] text-sm"
                      key={f}
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--sea-ink)]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  className={`mt-6 inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl font-medium text-sm transition-all ${
                    plan.highlighted
                      ? "bg-[var(--sea-ink)] text-[var(--bg-base)] hover:bg-[var(--lagoon-deep)]"
                      : "border border-[var(--line)] bg-transparent text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)]"
                  }`}
                  href={plan.href}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <ComparisonTable />
        </div>
      </section>

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
    </>
  );
}

function ComparisonTable() {
  return (
    <div className="mt-16">
      <h3 className="display-title mb-6 text-center font-bold text-2xl text-[var(--sea-ink)]">
        Compare plans side by side
      </h3>

      <div className="island-shell overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-[var(--line)] border-b">
                <th className="px-5 py-4 font-semibold text-[var(--sea-ink)]">
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    className={`px-5 py-4 font-semibold ${
                      p.highlighted
                        ? "text-[var(--sea-ink)]"
                        : "text-[var(--sea-ink-soft)]"
                    }`}
                    key={p.name}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  className={`border-[var(--line)] border-b transition-colors hover:bg-[var(--link-bg-hover)] ${
                    i % 2 === 0 ? "bg-[var(--sand)]/50" : ""
                  }`}
                  key={row.label}
                >
                  <td className="px-5 py-3.5 font-medium text-[var(--sea-ink)]">
                    {row.label}
                  </td>
                  {row.values.map((val, vdx) => (
                    <td
                      className="px-5 py-3.5 text-[var(--sea-ink-soft)]"
                      key={planKeys[vdx] + row.label}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
