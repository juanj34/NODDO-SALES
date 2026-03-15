#!/usr/bin/env node
/**
 * Complete DNS Configuration Script for Resend Email Authentication
 *
 * This script:
 * 1. Adds domain to Resend (if not exists)
 * 2. Retrieves DKIM records from Resend
 * 3. Configures all DNS records in Vercel (SPF, DMARC, DKIM)
 *
 * CREDENTIALS: Reads automatically from .env.local
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN || process.env.AUTH_BEARER_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const DOMAIN = "noddo.io";

if (!VERCEL_API_TOKEN || !RESEND_API_KEY || !VERCEL_TEAM_ID) {
  console.error("❌ Missing required environment variables in .env.local:");
  if (!VERCEL_API_TOKEN) console.error("   - VERCEL_API_TOKEN or AUTH_BEARER_TOKEN");
  if (!RESEND_API_KEY) console.error("   - RESEND_API_KEY");
  if (!VERCEL_TEAM_ID) console.error("   - VERCEL_TEAM_ID");
  process.exit(1);
}

interface ResendDomainRecord {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl?: string;
  priority?: number;
}

interface ResendDomain {
  id: string;
  name: string;
  status: string;
  created_at: string;
  records: ResendDomainRecord[];
}

async function addDomainToResend(): Promise<ResendDomain> {
  console.log(`\n📧 Step 1: Adding domain ${DOMAIN} to Resend...`);

  // First, check if domain already exists
  const listResponse = await fetch("https://api.resend.com/domains", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to list domains: ${await listResponse.text()}`);
  }

  const { data: domains } = await listResponse.json();
  const existing = domains.find((d: any) => d.name === DOMAIN);

  if (existing) {
    console.log(`✅ Domain already exists in Resend (ID: ${existing.id})`);

    // Get full domain details with records
    const detailsResponse = await fetch(`https://api.resend.com/domains/${existing.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
    });

    if (!detailsResponse.ok) {
      throw new Error(`Failed to get domain details: ${await detailsResponse.text()}`);
    }

    return await detailsResponse.json();
  }

  // Domain doesn't exist, create it
  console.log("Creating new domain in Resend...");
  const createResponse = await fetch("https://api.resend.com/domains", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: DOMAIN,
      region: "us-east-1", // Default region
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create domain: ${await createResponse.text()}`);
  }

  const newDomain = await createResponse.json();
  console.log(`✅ Domain created in Resend (ID: ${newDomain.id})`);

  // Get full details with records
  const detailsResponse = await fetch(`https://api.resend.com/domains/${newDomain.id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
  });

  if (!detailsResponse.ok) {
    throw new Error(`Failed to get domain details: ${await detailsResponse.text()}`);
  }

  return await detailsResponse.json();
}

async function configureVercelDNS(resendDomain: ResendDomain): Promise<void> {
  console.log(`\n🌐 Step 2: Configuring DNS records in Vercel...`);

  // Get existing DNS records from Vercel
  const listUrl = `https://api.vercel.com/v2/domains/${DOMAIN}/records?teamId=${VERCEL_TEAM_ID}`;
  const listResponse = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to list DNS records: ${await listResponse.text()}`);
  }

  const { records: existingRecords } = await listResponse.json();
  console.log(`📋 Found ${existingRecords.length} existing DNS records`);

  // Process each Resend record
  for (const record of resendDomain.records) {
    // Skip MX records (not needed for sending-only setup)
    if (record.type === "MX") {
      console.log(`⏭️  Skipping MX record (not needed for send-only)`);
      continue;
    }

    // Check if record already exists
    const exists = existingRecords.find((r: any) =>
      r.type === record.type &&
      r.name === record.name &&
      r.value === record.value
    );

    if (exists) {
      console.log(`✅ ${record.type} record already exists: ${record.name}`);
      continue;
    }

    // Create the record
    console.log(`➕ Creating ${record.type} record: ${record.name || '@'}`);

    const createUrl = `https://api.vercel.com/v2/domains/${DOMAIN}/records?teamId=${VERCEL_TEAM_ID}`;
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: record.type,
        name: record.name || "",
        value: record.value,
        ttl: 60,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error(`❌ Failed to create ${record.type} record: ${error}`);
      continue;
    }

    const created = await createResponse.json();
    console.log(`✅ Created ${record.type} record: ${record.name || '@'} → ${record.value.substring(0, 50)}...`);
  }
}

async function main() {
  try {
    console.log("🚀 NODDO DNS Configuration for Resend Email Authentication");
    console.log("━".repeat(60));

    // Step 1: Add domain to Resend and get DNS records
    const resendDomain = await addDomainToResend();

    console.log(`\n📝 DNS Records from Resend:`);
    resendDomain.records.forEach((r) => {
      console.log(`   ${r.type.padEnd(6)} ${r.name || '@'}`);
    });

    // Step 2: Configure DNS in Vercel
    await configureVercelDNS(resendDomain);

    console.log("\n━".repeat(60));
    console.log("✅ DNS Configuration Complete!");
    console.log("\n📌 Next Steps:");
    console.log("   1. Wait 24-48 hours for DNS propagation");
    console.log("   2. Verify domain in Resend dashboard");
    console.log("   3. Test email deliverability");
    console.log("\n🔍 Verify DNS propagation:");
    console.log(`   dig TXT ${DOMAIN}`);
    console.log(`   dig TXT resend._domainkey.${DOMAIN}`);
    console.log("\n🌐 Resend Dashboard:");
    console.log("   https://resend.com/domains");

  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
