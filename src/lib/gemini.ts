// ─── Modelos en orden de prioridad ───────────────────────────────────────────
// Si uno falla por cuota, se prueba el siguiente automáticamente.
const MODELS_FALLBACK = [
  "gemini-2.5-flash-preview-05-20", // Nuevo, más generoso en free tier
  "gemini-2.0-flash-lite",          // Más liviano, cuota separada
  "gemini-1.5-flash",               // Cuota independiente de 2.0
  "gemini-1.5-flash-8b",            // El más liviano, cuota propia
  "gemini-2.0-flash",               // Tu modelo original (último recurso)
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface GeminiResponse {
  text: string;
  modelUsed: string;
}

interface GeminiCandidate {
  content: { parts: { text: string }[] };
}

interface GeminiAPIResponse {
  candidates?: GeminiCandidate[];
  error?: { code: number; message: string; status: string };
}

// ─── Función principal con fallback automático ────────────────────────────────
export async function generateContent(
  apiKey: string,
  prompt: string,
  systemInstruction?: string
): Promise<GeminiResponse> {
  const lastError: Error[] = [];

  for (const model of MODELS_FALLBACK) {
    try {
      const result = await callGeminiAPI(apiKey, model, prompt, systemInstruction);
      return { text: result, modelUsed: model };
    } catch (err) {
      const error = err as Error;
      const isQuotaError =
        error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.includes("limit: 0");

      lastError.push(error);

      if (isQuotaError) {
        // Cuota agotada en este modelo → intentar el siguiente
        console.warn(`[Gemini] Cuota agotada en "${model}", probando siguiente...`);
        continue;
      }

      // Otro error (clave inválida, red, etc.) → no seguir intentando
      throw error;
    }
  }

  // Todos los modelos fallaron
  throw new Error(
    `Cuota agotada en todos los modelos disponibles. ` +
    `Espera unas horas o revisa tu plan en https://ai.dev/rate-limit.\n\n` +
    `Último error: ${lastError[lastError.length - 1]?.message}`
  );
}

// ─── Llamada HTTP directa a la API de Gemini ─────────────────────────────────
async function callGeminiAPI(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: GeminiAPIResponse = await res.json();

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`[${res.status}] ${msg}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de la API.");

  return text;
}

// ─── Utilidad: verificar que una API Key funciona ─────────────────────────────
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  for (const model of MODELS_FALLBACK) {
    try {
      await callGeminiAPI(apiKey, model, "Di hola en una palabra.");
      return { ok: true, model };
    } catch (err) {
      const error = err as Error;
      const isQuota =
        error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED");
      if (isQuota) continue;
      return { ok: false, model, error: error.message };
    }
  }
  return { ok: false, model: "", error: "Cuota agotada en todos los modelos." };
}

// ─── Lista de modelos disponibles (para mostrar en UI) ────────────────────────
export const AVAILABLE_MODELS = MODELS_FALLBACK.map((id) => ({
  id,
  label: id
    .replace("gemini-", "Gemini ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()),
}));
