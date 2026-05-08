// ─── Modelos en orden de prioridad (fallback automático) ─────────────────────
const MODELS_FALLBACK = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash",
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
  const lastErrors: Error[] = [];

  for (const model of MODELS_FALLBACK) {
    try {
      const text = await callGeminiAPI(apiKey, model, prompt, systemInstruction);
      return { text, modelUsed: model };
    } catch (err) {
      const error = err as Error;
      const isQuotaError =
        error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.includes("limit: 0");

      lastErrors.push(error);
      if (isQuotaError) {
        console.warn(`[Gemini] Cuota agotada en "${model}", probando siguiente...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Cuota agotada en todos los modelos. Espera unas horas o revisa https://ai.dev/rate-limit.\n` +
    `Último error: ${lastErrors[lastErrors.length - 1]?.message}`
  );
}

// ─── Llamada HTTP a la API ────────────────────────────────────────────────────
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

  const res = await fetch(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data: GeminiAPIResponse = await res.json();

  if (!res.ok || data.error) {
    throw new Error(`[${res.status}] ${data.error?.message ?? `HTTP ${res.status}`}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de la API.");
  return text;
}

// ─── obtenerExegesis (función original restaurada) ────────────────────────────
export async function obtenerExegesis(
  apiKey: string,
  pasaje: string
): Promise<string> {
  const prompt = `Realiza una exégesis académica completa y detallada del siguiente pasaje bíblico: "${pasaje}"

Incluye las siguientes secciones:
1. **Contexto histórico-cultural**: época, lugar, audiencia original
2. **Análisis literario**: género literario, estructura, recursos estilísticos
3. **Análisis lingüístico**: palabras clave en hebreo/griego, etimología, significado original
4. **Contexto canónico**: relación con otros textos bíblicos, cumplimiento profético
5. **Teología del pasaje**: doctrinas principales que se enseñan
6. **Interpretación histórica**: cómo han interpretado este pasaje los principales comentaristas
7. **Aplicación hermenéutica**: principios de interpretación aplicados
8. **Relevancia contemporánea**: aplicación práctica para hoy
9. **Preguntas de reflexión**: 3-5 preguntas para estudio profundo
10. **Bibliografía recomendada**: comentaristas y obras académicas relevantes

Usa un tono académico pero accesible. Cita referencias cruzadas bíblicas.`;

  const { text } = await generateContent(apiKey, prompt);
  return text;
}

// ─── obtenerComparado (función original restaurada) ───────────────────────────
export async function obtenerComparado(
  apiKey: string,
  pasaje1: string,
  pasaje2: string
): Promise<string> {
  const prompt = `Realiza un estudio comparativo académico entre estos dos pasajes bíblicos:

**Pasaje 1:** "${pasaje1}"
**Pasaje 2:** "${pasaje2}"

Incluye las siguientes secciones:
1. **Resumen de cada pasaje**: contexto y mensaje central de cada uno
2. **Similitudes temáticas**: temas, conceptos y mensajes que comparten
3. **Diferencias significativas**: en contexto, audiencia, énfasis teológico
4. **Análisis lingüístico comparado**: palabras clave en ambos pasajes
5. **Progresión teológica**: ¿cómo se complementan o desarrollan mutuamente?
6. **Tensiones aparentes**: contradicciones superficiales y su resolución
7. **Síntesis doctrinal**: enseñanza unificada que emerge de ambos
8. **Aplicación integrada**: lección práctica que surge de la comparación
9. **Referencias cruzadas adicionales**: otros pasajes que iluminan la comparación
10. **Conclusión hermenéutica**: principio de interpretación que se desprende

Mantén rigor académico y equilibrio entre ambos textos.`;

  const { text } = await generateContent(apiKey, prompt);
  return text;
}

// ─── Verificar API Key ────────────────────────────────────────────────────────
export async function testApiKey(
  apiKey: string
): Promise<{ ok: boolean; model: string; error?: string }> {
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

// ─── Lista de modelos (para UI) ───────────────────────────────────────────────
export const AVAILABLE_MODELS = MODELS_FALLBACK.map((id) => ({
  id,
  label: id
    .replace("gemini-", "Gemini ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()),
}));
