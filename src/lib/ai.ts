// ---------------------------------------------------------------------------
// AI utility — Gemini Flash with guardrails
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Call Gemini Flash with structured JSON output.
 * Uses `responseMimeType: "application/json"` so the model is forced to
 * return valid JSON — no markdown wrappers, no preamble.
 */
export async function callAI(
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

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
