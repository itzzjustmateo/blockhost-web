import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Cloud,
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

const API_BASE = "https://mcutils.com/api/server-jars";

const SOFTWARE_LIST = [
  "paper",
  "purpur",
  "spigot",
  "vanilla",
  "fabric",
  "forge",
  "neoforge",
  "pufferfish",
  "folia",
] as const;

type SoftwareKey = (typeof SOFTWARE_LIST)[number];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function CreateServerModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [software, setSoftware] = useState<SoftwareKey>("paper");
  const [creating, setCreating] = useState(false);
  const [configuringCloudflare, setConfiguringCloudflare] = useState(false);
  const [showManualDns, setShowManualDns] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ["mc-versions", software],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${software}`);
      if (!res.ok) {
        throw new Error("Failed to fetch versions");
      }
      const list: { version: string }[] = await res.json();
      return list.map((v) => v.version);
    },
    staleTime: 5 * 60 * 1000,
  });

  const selectedVersion = versions?.[0] ?? "";

  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const isSiuuuHD = domain.endsWith(".siuuuhd.de") || domain === "siuuuhd.de";

  useEffect(() => {
    if (!domain && cleanName) {
      setDomain(`${cleanName}.siuuuhd.de`);
    }
  }, [cleanName, domain]);

  const handleCloudflareConfigure = async () => {
    setConfiguringCloudflare(true);
    // TODO: call Cloudflare API to add DNS records
    await new Promise((r) => setTimeout(r, 1200));
    setConfiguringCloudflare(false);
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Server name is required");
      return;
    }
    if (!domain.trim()) {
      setError("Domain is required");
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
          domain: domain.trim(),
          minecraftVersion: selectedVersion,
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
            <div className="space-y-3">
              <div className="relative">
                <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--kicker)]" />
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] py-2.5 pr-4 pl-9 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="server.siuuuhd.de or mydomain.com"
                  value={domain}
                />
              </div>

              {domain && isSiuuuHD && (
                <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-900/40 dark:bg-green-950/20">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-700 text-sm dark:text-green-300">
                      SiuuuHD Subdomain — Auto-configured
                    </p>
                    <p className="mt-0.5 text-green-600 text-xs dark:text-green-400">
                      No additional DNS setup needed. This domain is ready to
                      use.
                    </p>
                  </div>
                </div>
              )}

              {domain && !isSiuuuHD && (
                <div className="space-y-3">
                  {/* Automatic: Cloudflare */}
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Cloud className="size-4 text-blue-500" />
                        <span className="font-medium text-[var(--sea-ink)] text-sm">
                          Auto-configure via Cloudflare
                        </span>
                      </div>
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 font-medium text-white text-xs transition-all hover:bg-blue-700 disabled:opacity-50"
                        disabled={configuringCloudflare}
                        onClick={handleCloudflareConfigure}
                        type="button"
                      >
                        {configuringCloudflare ? (
                          <>
                            <div className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Configuring...
                          </>
                        ) : (
                          <>
                            <Cloud className="size-3.5" />
                            Configure
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[var(--sea-ink-soft)] text-xs">
                      We'll automatically add the required DNS records to your
                      Cloudflare zone.
                    </p>
                  </div>

                  {/* Manual DNS */}
                  <div className="rounded-lg border border-[var(--line)]">
                    <button
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left font-medium text-[var(--sea-ink)] text-sm transition-colors hover:bg-[var(--link-bg-hover)]"
                      onClick={() => setShowManualDns(!showManualDns)}
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="size-4 text-[var(--kicker)]" />
                        Configure manually via DNS
                      </span>
                      {showManualDns ? (
                        <ChevronDown className="size-4 text-[var(--kicker)]" />
                      ) : (
                        <ChevronRight className="size-4 text-[var(--kicker)]" />
                      )}
                    </button>

                    {showManualDns && (
                      <div className="space-y-3 border-[var(--line)] border-t px-3 py-3">
                        <p className="text-[var(--sea-ink-soft)] text-xs">
                          Point your domain to BlockHost by adding these DNS
                          records at your registrar:
                        </p>

                        <DnsRecordRow
                          copied={copied}
                          label="A Record (root)"
                          onCopy={copyToClipboard}
                          recordKey="a-root"
                          value="185.234.72.18"
                        />
                        <DnsRecordRow
                          copied={copied}
                          label="A Record (www)"
                          onCopy={copyToClipboard}
                          recordKey="a-www"
                          value="185.234.72.18"
                        />
                        <DnsRecordRow
                          copied={copied}
                          label="CNAME Record"
                          onCopy={copyToClipboard}
                          recordKey="cname"
                          value={`${cleanName || "server"}.blockhost.io`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Server Software">
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sea-ink)]"
                onChange={(e) => setSoftware(e.target.value as SoftwareKey)}
                value={software}
              >
                {SOFTWARE_LIST.map((s) => (
                  <option key={s} value={s}>
                    {capitalize(s)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="MC Version">
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sea-ink)] disabled:opacity-50"
                disabled={versionsLoading}
                value={selectedVersion}
              >
                {versionsLoading ? (
                  <option>Loading…</option>
                ) : (
                  versions?.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))
                )}
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

function DnsRecordRow({
  copied,
  label,
  onCopy,
  recordKey,
  value,
}: {
  copied: string | null;
  label: string;
  onCopy: (text: string, key: string) => void;
  recordKey: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-base)] px-3 py-2">
      <div className="min-w-0">
        <p className="font-medium text-[var(--sea-ink)] text-xs">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[var(--sea-ink-soft)] text-xs">
          {value}
        </p>
      </div>
      <button
        className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-[var(--sea-ink-soft)] text-xs transition-colors hover:bg-[var(--link-bg-hover)]"
        onClick={() => onCopy(value, recordKey)}
        type="button"
      >
        {copied === recordKey ? (
          <>
            <CheckCircle2 className="size-3 text-green-500" />
            Copied
          </>
        ) : (
          <>
            <Clipboard className="size-3" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
