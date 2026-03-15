#!/usr/bin/env node
/**
 * Check Resend Domain Verification Status
 * CREDENTIALS: Reads automatically from .env.local
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DOMAIN = "noddo.io";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not found in .env.local");
  process.exit(1);
}

async function checkDomainStatus() {
  console.log("🔍 Checking Resend domain verification status...\n");

  // First get the domain ID
  const listResponse = await fetch("https://api.resend.com/domains", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to list domains: ${await listResponse.text()}`);
  }

  const { data: domains } = await listResponse.json();
  const domain = domains.find((d: any) => d.name === DOMAIN);

  if (!domain) {
    console.error(`❌ Domain ${DOMAIN} not found in Resend`);
    process.exit(1);
  }

  // Get full details
  const response = await fetch(`https://api.resend.com/domains/${domain.id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get domain status: ${await response.text()}`);
  }

  const domainDetails = await response.json();

  console.log("📧 Domain:", domainDetails.name);
  console.log("🆔 ID:", domainDetails.id);
  console.log("📊 Status:", domainDetails.status);
  console.log("📅 Created:", new Date(domainDetails.created_at).toLocaleString());
  console.log("\n📝 DNS Records:\n");

  domainDetails.records.forEach((record: any) => {
    const statusIcon = record.status === "verified" ? "✅" : "⏳";
    console.log(`${statusIcon} ${record.record.toUpperCase()}`);
    console.log(`   Type: ${record.type}`);
    console.log(`   Name: ${record.name || "@"}`);
    console.log(`   Status: ${record.status || "pending"}`);
    if (record.type !== "MX") {
      console.log(`   Value: ${record.value.substring(0, 60)}...`);
    }
    console.log();
  });

  if (domainDetails.status === "verified") {
    console.log("✅ ¡Dominio completamente verificado! Puedes enviar emails.");
  } else {
    console.log("⏳ Dominio pendiente de verificación.");
    console.log("   DNS puede tardar hasta 48h en propagarse.");
    console.log("   Resend verificará automáticamente cada hora.");
  }
}

checkDomainStatus().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
