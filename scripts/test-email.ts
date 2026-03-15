#!/usr/bin/env node
/**
 * Test Email Script - Verifies Resend integration
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

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not found in .env.local");
  process.exit(1);
}

async function sendTestEmail() {
  console.log("📧 Sending test email from no-reply@noddo.io...\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "NODDO <no-reply@noddo.io>",
      to: "hola@noddo.io", // Change this to your email
      subject: "✅ Test Email - DNS Configuration Verified",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #b8973a;">🎉 ¡Email funcionando!</h1>
          <p>Este email confirma que tu dominio <strong>noddo.io</strong> está correctamente configurado para enviar emails con Resend.</p>

          <h2>✅ DNS Verificado</h2>
          <ul>
            <li>DKIM: Verificado</li>
            <li>SPF: Verificado</li>
            <li>DMARC: Configurado</li>
          </ul>

          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            Enviado desde NODDO Platform<br>
            ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  const result = await response.json();
  console.log("✅ Email sent successfully!");
  console.log("📬 Email ID:", result.id);
  console.log("\n💡 Check your inbox at: hola@noddo.io");
}

sendTestEmail().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
