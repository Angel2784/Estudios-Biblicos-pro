// ─── Modelos en orden de prioridad (fallback automático) ─────────────────────
const MODELS_FALLBACK = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface GeminiResponse { text: string; modelUsed: string }

interface GeminiCandidate { content: { parts: { text: string }[] } }
interface GeminiAPIResponse {
  candidates?: GeminiCandidate[];
  error?: { code: number; message: string; status: string };
}

export type EstiloSermon = 'expositivo' | 'devocional'

export interface MensajeChat { role: 'user' | 'assistant'; content: string }

// ─── Tipos para Árbol Genealógico ────────────────────────────────────────────
export interface PersonajeBiblico {
  id: string
  nombre: string
  descripcion: string
  relaciones: { targetId: string; tipo: string }[]
}
export interface ArbolPersonajes {
  personajes: PersonajeBiblico[]
  contexto: string
}

// ─── Tipos para Línea de Tiempo ──────────────────────────────────────────────
export interface EventoTimeline {
  id: string
  fecha: string
  titulo: string
  descripcion: string
  tipo: 'principal' | 'contexto' | 'profecia'
}
export interface Timeline {
  eventos: EventoTimeline[]
  periodoGeneral: string
}

// ─── Función principal con fallback automático ────────────────────────────────
export async function generateContent(
  apiKey: string, prompt: string, systemInstruction?: string
): Promise<GeminiResponse> {
  const lastErrors: Error[] = []
  for (const model of MODELS_FALLBACK) {
    try {
      const text = await callGeminiAPI(apiKey, model, prompt, systemInstruction)
      return { text, modelUsed: model }
    } catch (err) {
      const error = err as Error
      const isQuotaError =
        error.message.includes("429") || error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("limit: 0")
      lastErrors.push(error)
      if (isQuotaError) { console.warn(`[Gemini] Cuota agotada en "${model}", probando siguiente...`); continue }
      throw error
    }
  }
  throw new Error(
    `Cuota agotada en todos los modelos. Espera unas horas o revisa https://ai.dev/rate-limit.\n` +
    `Último error: ${lastErrors[lastErrors.length - 1]?.message}`
  )
}

// ─── Llamada HTTP a la API ────────────────────────────────────────────────────
async function callGeminiAPI(
  apiKey: string, model: string, prompt: string, systemInstruction?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
  }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }

  const res  = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  const data: GeminiAPIResponse = await res.json()
  if (!res.ok || data.error) throw new Error(`[${res.status}] ${data.error?.message ?? `HTTP ${res.status}`}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Respuesta vacía de la API.")
  return text
}

// ─── Llamada con historial de chat (multi-turn) ───────────────────────────────
async function callGeminiChat(
  apiKey: string, model: string,
  mensajes: MensajeChat[], systemInstruction?: string
): Promise<string> {
  const contents = mensajes.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 4096 },
  }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }

  const res  = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  const data: GeminiAPIResponse = await res.json()
  if (!res.ok || data.error) throw new Error(`[${res.status}] ${data.error?.message ?? `HTTP ${res.status}`}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Respuesta vacía de la API.")
  return text
}

// ─── obtenerExegesis ──────────────────────────────────────────────────────────
export async function obtenerExegesis(apiKey: string, pasaje: string): Promise<string> {
  const prompt = `Realiza una exégesis académica completa del siguiente pasaje bíblico: "${pasaje}"

Responde EXACTAMENTE con estas 13 secciones numeradas. Usa el formato: "1. Título\nContenido..."

1. Texto Bíblico
Presenta el texto completo del pasaje en español (RVR60 o NVI), con notas sobre variantes textuales importantes.

2. Referencias Cruzadas
Lista de pasajes relacionados con breve explicación de cada conexión temática o teológica.

3. Análisis Lingüístico
Palabras clave en hebreo o griego con transliteración, etimología y significado original.

4. Contexto Histórico-Cultural
Época, lugar, audiencia original, situación política y social del momento.

5. Exégesis Detallada
Interpretación versículo por versículo con análisis gramatical y hermenéutico.

6. Teología del Reino
Doctrinas principales: ¿qué enseña sobre Dios, Cristo, el Espíritu Santo y la salvación?

7. Aplicación Práctica
Principios concretos para la vida cristiana actual derivados del texto.

8. Versiones Comparadas
Compara 3-4 traducciones (RVR60, NVI, LBLA, NTV) destacando diferencias significativas.

9. Cronología
Línea de tiempo del pasaje: fecha aproximada, eventos históricos relacionados, secuencia narrativa.

10. Geografía
Lugares mencionados o implicados, su importancia histórica y significado teológico.

11. Conclusión Hermenéutica
Síntesis del mensaje central y principio de interpretación que emerge del pasaje.

12. Preguntas de Reflexión
5 preguntas profundas para estudio personal o en grupo.

13. Recursos Bibliográficos
Comentaristas y obras académicas recomendadas para profundizar en este pasaje.

Usa tono académico pero accesible. Sé exhaustivo en cada sección.`

  const { text } = await generateContent(apiKey, prompt)
  return text
}

// ─── obtenerComparado ─────────────────────────────────────────────────────────
export async function obtenerComparado(
  apiKey: string, pasaje1: string, pasaje2: string
): Promise<string> {
  const prompt = `Realiza un estudio comparativo académico entre estos dos pasajes bíblicos:

**Pasaje A:** "${pasaje1}"
**Pasaje B:** "${pasaje2}"

Responde EXACTAMENTE con estas 10 secciones numeradas. Usa el formato: "1. Título\nContenido..."

1. Textos Bíblicos
Presenta ambos pasajes completos en español con su contexto inmediato.

2. Similitudes Temáticas
Temas, conceptos, vocabulario y mensajes que comparten ambos pasajes.

3. Diferencias Significativas
Contraste en contexto, audiencia, énfasis teológico, género literario y propósito.

4. Contexto Histórico Comparado
Época, autor, destinatarios y situación histórica de cada pasaje.

5. Análisis Lingüístico Comparado
Palabras clave en hebreo/griego de ambos pasajes y cómo se relacionan o contrastan.

6. Progresión Teológica
¿Cómo se complementan o desarrollan mutuamente? ¿Hay avance en la revelación?

7. Tensiones Aparentes
Posibles contradicciones superficiales y su resolución hermenéutica.

8. Síntesis Doctrinal
Enseñanza unificada que emerge de estudiar ambos pasajes juntos.

9. Aplicación Integrada
Lección práctica concreta que surge específicamente de la comparación de ambos textos.

10. Conclusión Hermenéutica
Principio de interpretación y referencias cruzadas adicionales que iluminan la comparación.

Mantén rigor académico y equilibrio entre ambos textos.`

  const { text } = await generateContent(apiKey, prompt)
  return text
}

// ─── obtenerSermon ────────────────────────────────────────────────────────────
export async function obtenerSermon(
  apiKey: string, pasaje: string, estilo: EstiloSermon
): Promise<string> {
  const estiloDesc = {
    expositivo: 'sermón expositivo académico con tres puntos principales bien desarrollados, ideal para predicación en iglesia',
    devocional:  'devocional breve y reflexivo, cálido y personal, de 5-7 minutos de lectura, ideal para uso diario',
  }[estilo]

  const prompt = `Prepara un ${estiloDesc} basado en el pasaje bíblico: "${pasaje}"

Responde EXACTAMENTE con estas 8 secciones numeradas. Usa el formato: "1. Título\nContenido..."

1. Introducción
Gancho inicial, contexto del pasaje, declaración del tema central y relevancia para el oyente/lector de hoy.

2. Punto Central 1
Primer punto de desarrollo con explicación bíblica, argumentación teológica y conexión con el texto.

3. Punto Central 2
Segundo punto de desarrollo con profundización doctrinal y evidencia escritural adicional.

4. Punto Central 3
Tercer punto de desarrollo con el clímax del argumento teológico y su coherencia con el pasaje.

5. Ilustraciones y Analogías
2-3 ilustraciones concretas (históricas, cotidianas o literarias) que refuercen cada punto principal.

6. Aplicación Práctica
Pasos concretos y específicos que el oyente puede implementar esta semana en su vida diaria.

7. Llamado y Conclusión
Llamado a la acción o decisión espiritual, síntesis del mensaje y cierre memorable.

8. Oración Sugerida
Oración modelo de 3-5 oraciones que el predicador o lector puede usar al final del mensaje.

Mantén coherencia temática en todas las secciones. Sé concreto, bíblico y pastoral.`

  const { text } = await generateContent(apiKey, prompt)
  return text
}

// ─── obtenerRespuestaChat ─────────────────────────────────────────────────────
export async function obtenerRespuestaChat(
  apiKey: string,
  pasaje: string,
  textoPasaje: string,
  historial: MensajeChat[]
): Promise<string> {
  const systemInstruction = `Eres un experto en teología bíblica y exégesis. El usuario está estudiando el pasaje "${pasaje}".
Tienes acceso al siguiente análisis previo del pasaje:

---
${textoPasaje.slice(0, 4000)}
---

Responde las preguntas del usuario sobre este pasaje de forma clara, académica y pastoral.
Cita versículos específicos cuando sea relevante. Sé conciso pero completo.`

  const lastErrors: Error[] = []
  for (const model of MODELS_FALLBACK) {
    try {
      const text = await callGeminiChat(apiKey, model, historial, systemInstruction)
      return text
    } catch (err) {
      const error = err as Error
      const isQuota = error.message.includes("429") || error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED")
      lastErrors.push(error)
      if (isQuota) continue
      throw error
    }
  }
  throw new Error(`Cuota agotada. Último error: ${lastErrors[lastErrors.length - 1]?.message}`)
}

// ─── obtenerArbolPersonajes ───────────────────────────────────────────────────
export async function obtenerArbolPersonajes(
  apiKey: string,
  pasaje: string
): Promise<ArbolPersonajes> {
  const prompt = `Analiza el pasaje bíblico "${pasaje}" e identifica todos los personajes mencionados o implícitos.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código, con esta estructura exacta:
{
  "contexto": "Breve descripción del contexto del pasaje en 1-2 oraciones",
  "personajes": [
    {
      "id": "p1",
      "nombre": "Nombre del personaje",
      "descripcion": "Rol o descripción breve (máx 15 palabras)",
      "relaciones": [
        { "targetId": "p2", "tipo": "Padre de" }
      ]
    }
  ]
}

Reglas:
- Máximo 10 personajes
- Los id deben ser p1, p2, p3... en orden
- Los targetId deben referenciar ids existentes
- Tipos de relación: "Padre de", "Hijo de", "Discípulo de", "Enviado por", "Oponente de", "Hermano de", "Esposa de", "Creador de", "Salvador de"
- Si hay pocos personajes directos, incluye personajes del contexto histórico cercano
- Incluye siempre a Dios/Jesús si el pasaje los menciona`

  const { text } = await generateContent(apiKey, prompt)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as ArbolPersonajes
  } catch {
    return {
      contexto: `Personajes de ${pasaje}`,
      personajes: [{ id: 'p1', nombre: pasaje, descripcion: 'Pasaje bíblico', relaciones: [] }]
    }
  }
}

// ─── obtenerTimeline ──────────────────────────────────────────────────────────
export async function obtenerTimeline(
  apiKey: string,
  pasaje: string
): Promise<Timeline> {
  const prompt = `Crea una línea de tiempo histórica para el pasaje bíblico "${pasaje}".

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código, con esta estructura exacta:
{
  "periodoGeneral": "Descripción del período histórico general (ej: 'Ministerio de Jesús, ~30 d.C.')",
  "eventos": [
    {
      "id": "e1",
      "fecha": "Fecha o período aproximado (ej: '~30 a.C.', 'ca. 750 a.C.', 'Año 70 d.C.')",
      "titulo": "Título corto del evento (máx 6 palabras)",
      "descripcion": "Descripción del evento (máx 20 palabras)",
      "tipo": "principal"
    }
  ]
}

Reglas:
- Entre 5 y 8 eventos en orden cronológico
- tipo puede ser: "principal" (evento del pasaje), "contexto" (evento histórico relacionado), "profecia" (cumplimiento profético)
- Incluye al menos 1 evento antes del pasaje (contexto) y 1 después (impacto/cumplimiento)
- El evento central del pasaje debe ser tipo "principal"
- Sé específico con fechas aproximadas`

  const { text } = await generateContent(apiKey, prompt)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as Timeline
  } catch {
    return {
      periodoGeneral: pasaje,
      eventos: [{ id: 'e1', fecha: 'N/D', titulo: pasaje, descripcion: 'Evento bíblico', tipo: 'principal' }]
    }
  }
}

// ─── Verificar API Key ────────────────────────────────────────────────────────
export async function testApiKey(
  apiKey: string
): Promise<{ ok: boolean; model: string; error?: string }> {
  for (const model of MODELS_FALLBACK) {
    try {
      await callGeminiAPI(apiKey, model, "Di hola en una palabra.")
      return { ok: true, model }
    } catch (err) {
      const error = err as Error
      const isQuota = error.message.includes("429") || error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED")
      if (isQuota) continue
      return { ok: false, model, error: error.message }
    }
  }
  return { ok: false, model: "", error: "Cuota agotada en todos los modelos." }
}

// ─── Lista de modelos ─────────────────────────────────────────────────────────
export const AVAILABLE_MODELS = MODELS_FALLBACK.map((id) => ({
  id,
  label: id.replace("gemini-", "Gemini ").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}))
