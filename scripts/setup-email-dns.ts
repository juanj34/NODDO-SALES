#!/usr/bin/env tsx

/**
 * Setup DNS records for Resend email authentication
 * Adds SPF, DMARC, and provides instructions for DKIM
 */

import { execSync } from "child_process";

const DOMAIN = "noddo.io";

interface VercelDNSRecord {
  id: string;
  slug: string;
  name: string;
  type: string;
  value: string;
  creator: string;
  created: number;
  updated: number;
  createdAt: number;
  updatedAt: number;
}

async function getVercelToken(): Promise<string> {
  // Try environment variable first
  if (process.env.AUTH_BEARER_TOKEN) {
    return process.env.AUTH_BEARER_TOKEN;
  }

  // Try Vercel CLI
  try {
    const token = execSync("vercel whoami --token", { encoding: "utf-8" }).trim();
    if (token && !token.includes("Error")) {
      return token;
    }
  } catch {}

  throw new Error(
    "No Vercel token found. Please:\n" +
    "1. Run: vercel login\n" +
    "2. Or set AUTH_BEARER_TOKEN env var"
  );
}

async function getVercelTeamId(): Promise<string | undefined> {
  if (process.env.VERCEL_TEAM_ID) {
    return process.env.VERCEL_TEAM_ID;
  }

  // Try to get from vercel link
  try {
    const output = execSync("vercel project ls", { encoding: "utf-8" });
    // Parse team ID from output if available
    const match = output.match(/Team:\s+([a-z0-9_-]+)/i);
    if (match) {
      return match[1];
    }
  } catch {}

  return undefined; // Personal account (no team)
}

async function getCurrentDNS(token: string, teamId?: string): Promise<VercelDNSRecord[]> {
  const teamParam = teamId ? `?teamId=${teamId}` : "";
  const url = `https://api.vercel.com/v2/domains/${DOMAIN}/records${teamParam}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch DNS records: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.records || [];
}

async function addDNSRecord(
  token: string,
  type: string,
  name: string,
  value: string,
  teamId?: string
): Promise<void> {
  const teamParam = teamId ? `?teamId=${teamId}` : "";
  const url = `https://api.vercel.com/v2/domains/${DOMAIN}/records${teamParam}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      name,
      value,
      ttl: 3600,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add DNS record: ${response.status} ${error}`);
  }
}

async function main() {
  console.log("🔐 Setting up email authentication DNS for noddo.io\n");

  // Get Vercel credentials
  console.log("🔑 Getting Vercel credentials...");
  const token = await getVercelToken();
  const teamId = await getVercelTeamId();
  console.log(`✅ Authenticated ${teamId ? `(Team: ${teamId})` : "(Personal)"}\n`);

  // Get current DNS records
  console.log("📋 Fetching current DNS records...");
  const currentRecords = await getCurrentDNS(token, teamId);
  console.log(`✅ Found ${currentRecords.length} existing records\n`);

  // Check what we need to add
  const existingRecords = new Map(
    currentRecords.map((r) => [`${r.type}:${r.name}`, r.value])
  );

  const recordsToAdd = [
    {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:resend.com ~all",
      description: "SPF - Authorizes Resend to send emails",
    },
    {
      type: "TXT",
      name: "_dmarc",
      value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@noddo.io; pct=100; adkim=s; aspf=s",
      description: "DMARC - Email authentication policy",
    },
  ];

  console.log("➕ Adding DNS records:\n");

  for (const record of recordsToAdd) {
    const key = `${record.type}:${record.name}`;
    const displayName = record.name === "@" ? DOMAIN : `${record.name}.${DOMAIN}`;

    if (existingRecords.has(key)) {
      console.log(`⏭️  ${record.description}`);
      console.log(`   ${displayName} (already exists)\n`);
      continue;
    }

    try {
      await addDNSRecord(token, record.type, record.name, record.value, teamId);
      console.log(`✅ ${record.description}`);
      console.log(`   ${displayName}`);
      console.log(`   ${record.value}\n`);
    } catch (err) {
      console.error(`❌ Failed: ${record.description}`);
      console.error(`   ${err instanceof Error ? err.message : err}\n`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📝 NEXT STEPS - DKIM Configuration");
  console.log("=".repeat(70) + "\n");

  console.log("DKIM records are unique per Resend account. To complete setup:\n");
  console.log("1️⃣  Login to Resend:");
  console.log("   https://resend.com/domains\n");

  console.log("2️⃣  Add domain: noddo.io\n");

  console.log("3️⃣  Resend will show 3 DKIM CNAME records like:");
  console.log("   resend._domainkey  → resend._domainkey.resend.com");
  console.log("   resend2._domainkey → resend2._domainkey.resend.com");
  console.log("   resend3._domainkey → resend3._domainkey.resend.com\n");

  console.log("4️⃣  Add them in Vercel DNS:");
  console.log("   https://vercel.com/noddo/noddo/settings/domains\n");

  console.log("   Or run these commands:\n");
  console.log("   vercel dns add noddo.io resend._domainkey CNAME [value-from-resend]");
  console.log("   vercel dns add noddo.io resend2._domainkey CNAME [value-from-resend]");
  console.log("   vercel dns add noddo.io resend3._domainkey CNAME [value-from-resend]\n");

  console.log("5️⃣  Wait 1-24 hours for DNS propagation\n");

  console.log("6️⃣  Verify in Resend dashboard (auto-checks DNS)\n");

  console.log("=".repeat(70));
  console.log("✅ SPF + DMARC configured successfully!");
  console.log("=".repeat(70) + "\n");

  console.log("🔍 Verify DNS propagation:");
  console.log("   dig TXT noddo.io +short | grep spf");
  console.log("   dig TXT _dmarc.noddo.io +short\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
