/**
 * reCAPTCHA v3 server-side verification
 *
 * Setup:
 * 1. Create reCAPTCHA v3 key at https://www.google.com/recaptcha/admin
 * 2. Add to Vercel env vars:
 *    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lxxx...
 *    RECAPTCHA_SECRET_KEY=6Lxxx...
 */

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}

/**
 * Verify reCAPTCHA token server-side
 *
 * @param token - Token from client-side reCAPTCHA execution
 * @param expectedAction - Expected action name (e.g., "lead_submit")
 * @param minScore - Minimum score (0.0-1.0). Default 0.5. Higher = more likely human.
 * @returns true if verification passed, false otherwise
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  minScore = 0.5
): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // If not configured, allow (dev mode)
  if (!secretKey) {
    console.warn("⚠️ RECAPTCHA_SECRET_KEY not configured - verification skipped");
    return true;
  }

  if (!token) {
    console.warn("⚠️ No reCAPTCHA token provided");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    // Check success
    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    // Check action matches
    if (data.action !== expectedAction) {
      console.error(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`);
      return false;
    }

    // Check score threshold
    if (data.score < minScore) {
      console.warn(`reCAPTCHA score too low: ${data.score} < ${minScore}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

/**
 * Get reCAPTCHA token from request body
 */
export function getRecaptchaToken(body: unknown): string | null {
  if (typeof body === "object" && body !== null && "recaptchaToken" in body) {
    const token = (body as { recaptchaToken?: unknown }).recaptchaToken;
    return typeof token === "string" ? token : null;
  }
  return null;
}
