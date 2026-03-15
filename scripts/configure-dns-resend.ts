#!/usr/bin/env tsx

/**
 * Configure DNS records for Resend email authentication
 * SPF, DMARC, and DKIM records for noddo.io
 */

const VERCEL_TOKEN = process.env.AUTH_BEARER_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const DOMAIN = "noddo.io";

interface DNSRecord {
  type: "TXT" | "CNAME" | "MX";
  name: string;
  value: string;
  ttl?: number;
}

async function addDNSRecord(record: DNSRecord) {
  if (!VERCEL_TOKEN || !VERCEL_TEAM_ID) {
    throw new Error("Missing VERCEL_TOKEN or VERCEL_TEAM_ID");
  }

  const url = `https://api.vercel.com/v2/domains/${DOMAIN}/records?teamId=${VERCEL_TEAM_ID}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: record.ttl || 3600,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add DNS record: ${error}`);
  }

  return response.json();
}

async function listDNSRecords() {
  if (!VERCEL_TOKEN || !VERCEL_TEAM_ID) {
    throw new Error("Missing VERCEL_TOKEN or VERCEL_TEAM_ID");
  }

  const url = `https://api.vercel.com/v2/domains/${DOMAIN}/records?teamId=${VERCEL_TEAM_ID}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list DNS records: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log("🔧 Configuring DNS records for Resend email authentication...\n");

  // Check if records already exist
  console.log("📋 Checking existing DNS records...");
  const existing = await listDNSRecords();
  const existingNames = new Set(existing.records?.map((r: { name: string }) => r.name) || []);

  const recordsToAdd: DNSRecord[] = [
    // SPF Record - Authorizes Resend to send emails
    {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:resend.com ~all",
    },
    // DMARC Record - Email authentication policy
    {
      type: "TXT",
      name: "_dmarc",
      value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@noddo.io; pct=100; adkim=s; aspf=s",
    },
  ];

  console.log("\n✅ Adding DNS records:\n");

  for (const record of recordsToAdd) {
    const recordName = record.name === "@" ? DOMAIN : `${record.name}.${DOMAIN}`;

    if (existingNames.has(record.name)) {
      console.log(`⏭️  Skipping ${record.type} ${recordName} (already exists)`);
      continue;
    }

    try {
      await addDNSRecord(record);
      console.log(`✅ Added ${record.type} ${recordName}`);
      console.log(`   Value: ${record.value}\n`);
    } catch (err) {
      console.error(`❌ Failed to add ${record.type} ${recordName}`);
      console.error(`   Error: ${err instanceof Error ? err.message : err}\n`);
    }
  }

  console.log("\n📝 NEXT STEPS:\n");
  console.log("1. Login to Resend: https://resend.com/domains");
  console.log("2. Add domain: noddo.io");
  console.log("3. Copy the 3 DKIM CNAME records from Resend");
  console.log("4. Add them manually in Vercel DNS or run:");
  console.log("\n   They will look like:");
  console.log("   - resend._domainkey → resend._domainkey.resend.com");
  console.log("   - resend2._domainkey → resend2._domainkey.resend.com");
  console.log("   - resend3._domainkey → resend3._domainkey.resend.com");
  console.log("\n5. Wait 24-48h for DNS propagation");
  console.log("6. Verify in Resend dashboard\n");

  console.log("✅ DNS configuration complete!\n");
  console.log("📊 Current DNS records:");
  const updated = await listDNSRecords();
  console.log(JSON.stringify(updated.records, null, 2));
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
