import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Coins,
  Cpu,
  Database,
  Globe,
  Plus,
  Server,
  Ticket,
  X,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { authClient } from "#/lib/auth-client";

const modalParser = parseAsStringLiteral(["redeem", "create-server"] as const);

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  const [modal, setModal] = useQueryState("modal", modalParser);

  useEffect(() => {
    if (!(isPending || session)) {
      navigate({ to: "/login" });
    }
  }, [session, isPending, navigate]);

  if (isPending || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--sea-ink-soft)]">
          <div className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap py-8 md:py-12">
      <div className="mb-8">
        <h1 className="display-title font-bold text-3xl md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-1 text-[var(--sea-ink-soft)]">
          Welcome back, {session.user?.name ?? session.user?.email}
        </p>
      </div>

      <StatsCards />

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 font-medium text-[var(--bg-base)] text-sm transition-all hover:opacity-90"
          onClick={() => setModal("create-server")}
          type="button"
        >
          <Plus className="size-4" />
          Create Server
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-5 font-medium text-[var(--sea-ink)] text-sm transition-all hover:bg-[var(--link-bg-hover)]"
          onClick={() => setModal("redeem")}
          type="button"
        >
          <Ticket className="size-4" />
          Redeem Code
        </button>
      </div>

      {modal === "redeem" && <RedeemModal onClose={() => setModal(null)} />}
      {modal === "create-server" && (
        <CreateServerModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((r) => r.json()),
  });

  const cards = [
    {
      label: "Total Servers",
      value: stats?.totalServers ?? "—",
      icon: Server,
      desc: "Servers you've created",
    },
    {
      label: "Online",
      value: stats?.onlineServers ?? "—",
      icon: Activity,
      desc: "Currently running",
    },
    {
      label: "Plan",
      value: stats?.plan ?? "—",
      icon: Coins,
      desc: "Your current plan",
    },
    {
      label: "Resources",
      value: "—",
      icon: Database,
      desc: "RAM / Storage usage",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            className="h-28 animate-pulse rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]"
            key={`skeleton-${i}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            className="feature-card rounded-xl p-5 transition-all"
            key={card.label}
          >
            <div className="flex items-center justify-between">
              <span className="island-kicker">{card.label}</span>
              <Icon className="size-4 text-[var(--kicker)]" />
            </div>
            <p className="display-title mt-2 font-bold text-2xl">
              {card.value}
            </p>
            <p className="mt-0.5 text-[var(--sea-ink-soft)] text-xs">
              {card.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const MINECRAFT_VERSIONS = [
  "1.21.5",
  "1.21.4",
  "1.20.4",
  "1.20.1",
  "1.19.4",
  "1.18.2",
  "1.17.1",
  "1.16.5",
  "1.12.2",
];

const SERVER_SOFTWARE = [
  "Paper",
  "Purpur",
  "Spigot",
  "Vanilla",
  "Fabric",
  "Forge",
  "NeoForge",
];

function CreateServerModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [version, setVersion] = useState(MINECRAFT_VERSIONS[0]);
  const [software, setSoftware] = useState(SERVER_SOFTWARE[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useCustomDomain && name) {
      setDomain(`${name.toLowerCase().replace(/[^a-z0-9-]/g, "")}.siuuuhd.de`);
    }
  }, [name, useCustomDomain]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Server name is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: useCustomDomain ? domain : undefined,
          minecraftVersion: version,
          software,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create server");
        return;
      }
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div
        aria-label="Create Server"
        className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--bg-base)] p-6 shadow-xl"
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between">
          <h2 className="display-title font-bold text-xl">Create Server</h2>
          <button
            className="flex size-8 items-center justify-center rounded-lg text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <Field label="Server Name">
            <input
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Server"
              value={name}
            />
          </Field>

          <Field label="Domain">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  checked={!useCustomDomain}
                  className="size-4 accent-[var(--sea-ink)]"
                  id="subdomain"
                  onChange={() => {
                    setUseCustomDomain(false);
                    if (name) {
                      setDomain(
                        `${name.toLowerCase().replace(/[^a-z0-9-]/g, "")}.siuuuhd.de`
                      );
                    }
                  }}
                  type="radio"
                />
                <label
                  className="text-[var(--sea-ink-soft)] text-sm"
                  htmlFor="subdomain"
                >
                  Subdomain of{" "}
                  <span className="font-mono text-[var(--sea-ink)]">
                    siuuuhd.de
                  </span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  checked={useCustomDomain}
                  className="size-4 accent-[var(--sea-ink)]"
                  id="custom-domain"
                  onChange={() => setUseCustomDomain(true)}
                  type="radio"
                />
                <label
                  className="text-[var(--sea-ink-soft)] text-sm"
                  htmlFor="custom-domain"
                >
                  Custom domain (add DNS records)
                </label>
              </div>
              <div className="relative">
                <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--kicker)]" />
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] py-2.5 pr-4 pl-9 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={
                    useCustomDomain
                      ? "myserver.com"
                      : `${name || "server"}.siuuuhd.de`
                  }
                  value={domain}
                />
              </div>
              {useCustomDomain && (
                <p className="flex items-start gap-1.5 text-[var(--sea-ink-soft)] text-xs">
                  <span className="mt-0.5 shrink-0">→</span>
                  Point an{" "}
                  <span className="font-mono text-[var(--sea-ink)]">A</span> or{" "}
                  <span className="font-mono text-[var(--sea-ink)]">CNAME</span>{" "}
                  record to Cloudflare for your domain.
                </p>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="MC Version">
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
                onChange={(e) => setVersion(e.target.value)}
                value={version}
              >
                {MINECRAFT_VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Server Software">
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
                onChange={(e) => setSoftware(e.target.value)}
                value={software}
              >
                {SERVER_SOFTWARE.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 text-sm dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              className="flex-1 rounded-xl border border-[var(--line)] bg-transparent py-2.5 font-medium text-[var(--sea-ink)] text-sm transition-colors hover:bg-[var(--link-bg-hover)]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] py-2.5 font-medium text-[var(--bg-base)] text-sm transition-all hover:opacity-90 disabled:opacity-50"
              disabled={creating}
              onClick={handleCreate}
              type="button"
            >
              {creating ? (
                <>
                  <div className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Cpu className="size-4" />
                  Create Server
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function RedeemModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      return;
    }
    setRedeeming(true);
    setMessage(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Invalid code" });
        return;
      }
      setMessage({
        type: "success",
        text: data.message ?? "Code redeemed successfully!",
      });
      setTimeout(onClose, 1500);
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div
        aria-label="Redeem Code"
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--bg-base)] p-6 shadow-xl"
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between">
          <h2 className="display-title font-bold text-xl">Redeem Code</h2>
          <button
            className="flex size-8 items-center justify-center rounded-lg text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5">
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRedeem();
              }
            }}
            placeholder="Enter your code"
            value={code}
          />
        </div>

        {message && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] py-2.5 font-medium text-[var(--bg-base)] text-sm transition-all hover:opacity-90 disabled:opacity-50"
          disabled={!code.trim() || redeeming}
          onClick={handleRedeem}
          type="button"
        >
          {redeeming ? (
            <>
              <div className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Redeeming...
            </>
          ) : (
            <>
              <Ticket className="size-4" />
              Redeem
            </>
          )}
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block font-medium text-[var(--sea-ink)] text-sm">
        {label}
      </span>
      {children}
    </div>
  );
}
