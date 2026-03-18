// ---------------------------------------------------------------------------
// AI utility — Gemini Flash with guardrails
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Call Gemini Flash with structured JSON output.
 * Uses `responseMimeType: "application/json"` so the model is forced to
 * return valid JSON — no markdown wrappers, no preamble.
 */
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: { maxOutputTokens?: number }
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY no configurada");
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens ?? 4096,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Gemini API error: ${res.status}`, errorText);
    throw new Error("Error al procesar con IA. Intenta de nuevo.");
  }

  const data = await res.json();

  // Extract text — skip thinking parts (Gemini 2.5 may include them)
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text =
    parts.filter((p: { thought?: boolean; text?: string }) => p.text && !p.thought).pop()?.text;
  if (!text) {
    throw new Error("La IA no generó una respuesta. Intenta de nuevo.");
  }

  return text;
}

// ---------------------------------------------------------------------------
// Multi-turn conversation support
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Call Gemini Flash with conversation history for multi-turn context.
 * Uses `responseMimeType: "application/json"` for structured output.
 */
export async function callAIWithHistory(
  systemPrompt: string,
  messages: ConversationMessage[],
  options?: { maxOutputTokens?: number }
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY no configurada");
  }

  // Cap history to last 10 turns to manage token usage
  const recentMessages = messages.slice(-10);

  const contents = recentMessages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens ?? 4096,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Gemini API error: ${res.status}`, errorText);
    throw new Error("Error al procesar con IA. Intenta de nuevo.");
  }

  const data = await res.json();

  const parts = data.candidates?.[0]?.content?.parts || [];
  const text =
    parts.filter((p: { thought?: boolean; text?: string }) => p.text && !p.thought).pop()?.text;
  if (!text) {
    throw new Error("La IA no generó una respuesta. Intenta de nuevo.");
  }

  return text;
}

/**
 * Call Gemini Flash for plain text output (not JSON)
 * Used for text improvement, translations, content generation, etc.
 */
export async function callAIText(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY no configurada");
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
        // NO responseMimeType — allows plain text response
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Gemini API error: ${res.status}`, errorText);
    throw new Error("Error al procesar con IA. Intenta de nuevo.");
  }

  const data = await res.json();

  // Extract text — skip thinking parts (Gemini 2.5 may include them)
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text =
    parts.filter((p: { thought?: boolean; text?: string }) => p.text && !p.thought).pop()?.text;
  if (!text) {
    throw new Error("La IA no generó una respuesta. Intenta de nuevo.");
  }

  return text.trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip markdown code fences (fallback if responseMimeType didn't work) */
export function cleanJsonResponse(text: string): string {
  return text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
}

/** Safely parse JSON with fallback value */
export function parseAIJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = cleanJsonResponse(text);
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("AI returned invalid JSON:", text.slice(0, 200));
    return fallback;
  }
}

/**
 * Extract an array from an AI response that may be a bare array or
 * an object wrapping an array (e.g. { "pois": [...] } or { "data": [...] }).
 */
export function extractArray(parsed: unknown, fallback: unknown[] = []): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed !== null && typeof parsed === "object") {
    for (const val of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(val)) return val;
    }
  }
  return fallback;
}

/**
 * Sanitize user-provided text before inserting into prompts.
 * - Truncates to maxLength
 * - Strips characters that could break prompt structure
 */
export function sanitizeInput(text: string, maxLength = 10000): string {
  return text
    .slice(0, maxLength)
    .replace(/```/g, "")
    .replace(/<\/?[A-Z_]+>/g, "")  // strip XML-like tags that mimic prompt delimiters
    .trim();
}

/** Coerce to number or null */
export function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Coerce to positive number or null */
export function toPositiveOrNull(v: unknown): number | null {
  const n = toNumberOrNull(v);
  return n !== null && n >= 0 ? n : null;
}

/** Validate a value is in an allowed set, otherwise return default */
export function enumOrDefault<T extends string>(
  value: unknown,
  allowed: T[],
  defaultValue: T
): T {
  return allowed.includes(value as T) ? (value as T) : defaultValue;
}
