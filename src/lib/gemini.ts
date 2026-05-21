// ─── Modelos en orden de prioridad (fallback automático) ─────────────────────
const MODELS_FALLBACK = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── Tipos base ───────────────────────────────────────────────────────────────
export interface GeminiResponse { text: string; modelUsed: string }
interface GeminiCandidate { content: { parts: { text: string }[] } }
interface GeminiAPIResponse {
  candidates?: GeminiCandidate[];
  error?: { code: number; message: string; status: string };
}
export type EstiloSermon = 'expositivo' | 'devocional'
export interface MensajeChat { role: 'user' | 'assistant'; content: string }

// ─── Tipos Personajes (mejorado) ──────────────────────────────────────────────
export interface PersonajeBiblico {
  id: string
  nombre: string
  emoji: string
  rol: string                        // "Protagonista", "Antagonista", "Testigo", etc.
  descripcionBreve: string           // 1 línea
  descripcionCompleta: string        // párrafo completo con contexto bíblico
  versiculosAparece: string[]        // ej: ["Juan 3:1", "Juan 3:10"]
  atributos: string[]                // ej: ["Fariseo", "Maestro de Israel", "Líder religioso"]
  relaciones: { targetId: string; tipo: string }[]
}
export interface ArbolPersonajes {
  personajes: PersonajeBiblico[]
  contexto: string
  totalPersonajes: number
}

// ─── Tipos Timeline (mejorado) ────────────────────────────────────────────────
export interface PeriodoBiblico {
  id: string
  nombre: string                     // "Período Patriarcal", "Reino Unido", etc.
  color: string                      // color hex para el período
  fechaInicio: string                // "2000 a.C."
  fechaFin: string                   // "1500 a.C."
  descripcion: string
}
export interface EventoTimeline {
  id: string
  fecha: string
  titulo: string
  descripcion: string
  detalles: string                   // párrafo ampliado
  tipo: 'principal' | 'contexto' | 'profecia' | 'cumplimiento'
  emoji: string
  periodoBiblicoId: string           // referencia al período
  personajesInvolucrados: string[]   // nombres de personajes
  lugarGeografico: string
  referenciasBiblicas: string[]      // versículos relacionados
  importanciaTeologica: string       // por qué importa este evento
}
export interface Timeline {
  periodos: PeriodoBiblico[]
  eventos: EventoTimeline[]
  periodoGeneral: string
  contextoHistorico: string          // párrafo de contexto amplio
}

// ─── Función principal con fallback ──────────────────────────────────────────
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
    `Cuota agotada en todos los modelos.\nÚltimo error: ${lastErrors[lastErrors.length - 1]?.message}`
  )
}

async function callGeminiAPI(
  apiKey: string, model: string, prompt: string, systemInstruction?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
  }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }
  const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  const data: GeminiAPIResponse = await res.json()
  if (!res.ok || data.error) throw new Error(`[${res.status}] ${data.error?.message ?? `HTTP ${res.status}`}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Respuesta vacía de la API.")
  return text
}

async function callGeminiChat(
  apiKey: string, model: string, mensajes: MensajeChat[], systemInstruction?: string
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
  const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
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
export async function obtenerComparado(apiKey: string, pasaje1: string, pasaje2: string): Promise<string> {
  const prompt = `Realiza un estudio comparativo académico entre estos dos pasajes bíblicos:

**Pasaje A:** "${pasaje1}"
**Pasaje B:** "${pasaje2}"

Responde EXACTAMENTE con estas 10 secciones numeradas. Usa el formato: "1. Título\nContenido..."

1. Textos Bíblicos
2. Similitudes Temáticas
3. Diferencias Significativas
4. Contexto Histórico Comparado
5. Análisis Lingüístico Comparado
6. Progresión Teológica
7. Tensiones Aparentes
8. Síntesis Doctrinal
9. Aplicación Integrada
10. Conclusión Hermenéutica`
  const { text } = await generateContent(apiKey, prompt)
  return text
}

// ─── obtenerSermon ────────────────────────────────────────────────────────────
export async function obtenerSermon(apiKey: string, pasaje: string, estilo: EstiloSermon): Promise<string> {
  const estiloDesc = {
    expositivo: 'sermón expositivo académico con tres puntos principales bien desarrollados, ideal para predicación en iglesia',
    devocional: 'devocional breve y reflexivo, cálido y personal, de 5-7 minutos de lectura, ideal para uso diario',
  }[estilo]
  const prompt = `Prepara un ${estiloDesc} basado en el pasaje bíblico: "${pasaje}"

Responde EXACTAMENTE con estas 8 secciones numeradas. Usa el formato: "1. Título\nContenido..."

1. Introducción
2. Punto Central 1
3. Punto Central 2
4. Punto Central 3
5. Ilustraciones y Analogías
6. Aplicación Práctica
7. Llamado y Conclusión
8. Oración Sugerida`
  const { text } = await generateContent(apiKey, prompt)
  return text
}

// ─── obtenerRespuestaChat ─────────────────────────────────────────────────────
export async function obtenerRespuestaChat(
  apiKey: string, pasaje: string, textoPasaje: string, historial: MensajeChat[]
): Promise<string> {
  const systemInstruction = `Eres un experto en teología bíblica y exégesis. El usuario está estudiando el pasaje "${pasaje}".
Tienes acceso al siguiente análisis previo:
---
${textoPasaje.slice(0, 4000)}
---
Responde de forma clara, académica y pastoral. Cita versículos cuando sea relevante.`
  const lastErrors: Error[] = []
  for (const model of MODELS_FALLBACK) {
    try {
      return await callGeminiChat(apiKey, model, historial, systemInstruction)
    } catch (err) {
      const error = err as Error
      const isQuota = error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")
      lastErrors.push(error)
      if (isQuota) continue
      throw error
    }
  }
  throw new Error(`Cuota agotada. Último error: ${lastErrors[lastErrors.length - 1]?.message}`)
}

// ─── obtenerArbolPersonajes (MEJORADO) ────────────────────────────────────────
export async function obtenerArbolPersonajes(apiKey: string, pasaje: string): Promise<ArbolPersonajes> {
  const prompt = `Analiza el pasaje bíblico "${pasaje}" e identifica TODOS los personajes que intervienen, incluyendo los mencionados indirectamente.

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código:
{
  "contexto": "Descripción del contexto narrativo del pasaje en 2-3 oraciones",
  "totalPersonajes": 5,
  "personajes": [
    {
      "id": "p1",
      "nombre": "Nombre completo del personaje",
      "emoji": "👑",
      "rol": "Protagonista",
      "descripcionBreve": "Una línea describiendo su papel en el pasaje",
      "descripcionCompleta": "Párrafo completo con su historia bíblica, contexto, importancia teológica y participación en el pasaje. Mínimo 3 oraciones.",
      "versiculosAparece": ["Juan 3:1", "Juan 3:4"],
      "atributos": ["Fariseo", "Maestro de Israel", "Miembro del Sanedrín"],
      "relaciones": [
        { "targetId": "p2", "tipo": "Visita a" }
      ]
    }
  ]
}

Reglas estrictas:
- Incluye TODOS los personajes: directos, mencionados de fondo, grupos, figuras divinas
- Máximo 12 personajes, mínimo 3
- emoji apropiado para cada personaje: 👑 reyes, ✝️ Jesús/Dios, 👤 personas comunes, 🎓 maestros/fariseos, ⚔️ soldados, 👼 ángeles, 🙏 profetas, 👩 mujeres, 👨‍👩‍👧 familias
- rol: "Protagonista", "Antagonista", "Testigo", "Mencionado", "Figura Divina", "Grupo", "Profeta", "Discípulo"
- versiculosAparece: versículos específicos donde aparece (máximo 4)
- atributos: 2-4 características históricas/teológicas reales
- relaciones tipos: "Padre de", "Hijo de", "Discípulo de", "Enviado por", "Oponente de", "Hermano de", "Maestro de", "Creador de", "Salvador de", "Visita a", "Interroga a", "Sana a", "Llama a", "Miembro de"
- Los id deben ser p1, p2, p3... en orden`

  const { text } = await generateContent(apiKey, prompt)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as ArbolPersonajes
  } catch {
    return {
      contexto: `Personajes de ${pasaje}`,
      totalPersonajes: 1,
      personajes: [{ id: 'p1', nombre: pasaje, emoji: '📖', rol: 'Pasaje', descripcionBreve: 'Pasaje bíblico', descripcionCompleta: 'No se pudo analizar el pasaje.', versiculosAparece: [], atributos: [], relaciones: [] }]
    }
  }
}

// ─── obtenerTimeline (MEJORADO) ───────────────────────────────────────────────
export async function obtenerTimeline(apiKey: string, pasaje: string): Promise<Timeline> {
  const prompt = `Crea una línea de tiempo histórica completa y detallada para el pasaje bíblico "${pasaje}".

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código:
{
  "periodoGeneral": "Ministerio de Jesús, ~27-30 d.C.",
  "contextoHistorico": "Párrafo de 3-4 oraciones describiendo el contexto histórico amplio: imperio romano, situación política, contexto religioso judío, y cómo todo esto rodea el pasaje.",
  "periodos": [
    {
      "id": "per1",
      "nombre": "Período Patriarcal",
      "color": "#92400e",
      "fechaInicio": "2000 a.C.",
      "fechaFin": "1500 a.C.",
      "descripcion": "Época de los patriarcas Abraham, Isaac y Jacob"
    }
  ],
  "eventos": [
    {
      "id": "e1",
      "fecha": "~587 a.C.",
      "titulo": "Título corto (máx 5 palabras)",
      "descripcion": "Descripción breve de 1 oración",
      "detalles": "Párrafo ampliado de 2-3 oraciones con contexto histórico, implicaciones y relevancia para el pasaje estudiado.",
      "tipo": "contexto",
      "emoji": "⛪",
      "periodoBiblicoId": "per1",
      "personajesInvolucrados": ["Jeremías", "Nabucodonosor"],
      "lugarGeografico": "Jerusalén",
      "referenciasBiblicas": ["Jeremías 52:12", "2 Reyes 25:8"],
      "importanciaTeologica": "Una oración explicando por qué este evento importa teológicamente en relación al pasaje."
    }
  ]
}

Reglas para períodos (usa los que apliquen al pasaje):
- Época Patriarcal: color #92400e (marrón)
- Esclavitud en Egipto: color #b45309 (ámbar)
- Éxodo y Desierto: color #d97706 (naranja)
- Conquista de Canaán: color #65a30d (verde oliva)
- Período de los Jueces: color #16a34a (verde)
- Reino Unido (Saúl/David/Salomón): color #0891b2 (cian)
- Reino Dividido: color #7c3aed (violeta)
- Cautividad Babilónica: color #dc2626 (rojo)
- Período Intertestamentario: color #475569 (gris)
- Ministerio de Jesús: color #e2b96f (dorado)
- Iglesia Primitiva: color #60a5fa (azul)
- Apocalipsis/Profecía Futura: color #a78bfa (lavanda)

Reglas para eventos:
- Entre 6 y 10 eventos en orden cronológico estricto
- Al menos 2 eventos de contexto previo al pasaje
- Al menos 1 evento del pasaje mismo (tipo "principal")
- Al menos 1 evento posterior (impacto, tipo "cumplimiento" o "contexto")
- emoji apropiado: ✝️ crucifixión, 👑 reyes, ⛪ templo, 📜 pactos, ⚔️ guerras, 🌊 diluvio, 🔥 juicio, 🕊️ paz, 📖 escritura, 🏛️ imperios, 🌟 nacimiento, 🙏 oración
- referenciasBiblicas: 1-3 versículos reales y verificables`

  const { text } = await generateContent(apiKey, prompt)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as Timeline
  } catch {
    return {
      periodoGeneral: pasaje,
      contextoHistorico: 'No se pudo generar el contexto histórico.',
      periodos: [],
      eventos: [{ id: 'e1', fecha: 'N/D', titulo: pasaje, descripcion: 'Evento bíblico', detalles: '', tipo: 'principal', emoji: '📖', periodoBiblicoId: '', personajesInvolucrados: [], lugarGeografico: '', referenciasBiblicas: [], importanciaTeologica: '' }]
    }
  }
}

// ─── Verificar API Key ────────────────────────────────────────────────────────
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  for (const model of MODELS_FALLBACK) {
    try {
      await callGeminiAPI(apiKey, model, "Di hola en una palabra.")
      return { ok: true, model }
    } catch (err) {
      const error = err as Error
      const isQuota = error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")
      if (isQuota) continue
      return { ok: false, model, error: error.message }
    }
  }
  return { ok: false, model: "", error: "Cuota agotada en todos los modelos." }
}

export const AVAILABLE_MODELS = MODELS_FALLBACK.map((id) => ({
  id,
  label: id.replace("gemini-", "Gemini ").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}))
