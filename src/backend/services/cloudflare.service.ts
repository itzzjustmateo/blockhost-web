const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

interface CloudflareDnsRecord {
  content: string;
  name: string;
  proxied: boolean;
  ttl: number;
  type: "A" | "AAAA" | "CNAME";
}

interface CloudflareApiResponse<T = unknown> {
  errors: { code: number; message: string }[];
  messages: string[];
  result: T;
  success: boolean;
}

export const cloudflareService = {
  async addDnsRecords(
    apiToken: string,
    zoneId: string,
    domain: string,
    ip: string
  ): Promise<{ success: boolean; records: string[]; error?: string }> {
    const parts = domain.split(".");
    const name = parts.length > 2 ? parts.slice(0, -2).join(".") : "@";

    const records: CloudflareDnsRecord[] = [
      {
        type: "A",
        name,
        content: ip,
        ttl: 120,
        proxied: true,
      },
    ];

    const created: string[] = [];

    for (const record of records) {
      const res = await fetch(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      });

      const data: CloudflareApiResponse<{ id: string }> = await res.json();

      if (!data.success) {
        const msg =
          data.errors.map((e) => e.message).join(", ") || "Unknown error";
        return {
          success: false,
          records: created,
          error: `Cloudflare error: ${msg}`,
        };
      }

      created.push(record.name);
    }

    return { success: true, records: created };
  },

  async verifyToken(apiToken: string): Promise<boolean> {
    try {
      const res = await fetch(`${CLOUDFLARE_API}/user/tokens/verify`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      const data: CloudflareApiResponse = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },
};
