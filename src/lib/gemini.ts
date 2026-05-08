// src/lib/gemini.ts
const MODELOS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
]

export async function llamarGemini(
  apiKey: string,
  prompt: string,
  maxTokens = 8192
): Promise<string> {
  for (const modelo of MODELOS) {
    for (let intento = 0; intento < 3; intento++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: maxTokens },
            }),
          }
        )
        if (!res.ok) {
          const err = await res.json()
          const code = err?.error?.code || res.status
          if (code === 429) break // cuota agotada, siguiente modelo
          if (code === 503) {
            await sleep(15000 * (intento + 1))
            continue
          }
          break
        }
        const data = await res.json()
        const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (texto) return texto
      } catch {
        if (intento === 2) break
        await sleep(5000)
      }
    }
  }
  throw new Error('Todos los modelos están saturados o sin cuota. Intenta en unos minutos.')
}

export async function obtenerExegesis(apiKey: string, cita: string): Promise<string> {
  const prompt = `Realiza una exégesis académica y teológica profunda del pasaje: ${cita}.
ES OBLIGATORIO utilizar exactamente esta numeración:
1. Texto (Reina Valera 1960).
2. Referencias Cruzadas.
3. Análisis Lingüístico.
4. Contexto histórico-Cultural.
5. Exégesis Versículo por Versículo.
6. Relación con el Reino de Dios.
7. Aplicación Práctica.
8. Comparación de Versiones.
9. Línea de Tiempo.
10. Mapa Geográfico: [Identifica el lugar geográfico principal de este pasaje y pon el nombre de la ciudad o región entre corchetes, por ejemplo: [[Jerusalén]]].
11. Conclusión.
12. Preguntas para Reflexión.
13. Recursos Adicionales.
Responde directamente con los puntos numerados.`
  return llamarGemini(apiKey, prompt)
}

export async function obtenerComparado(
  apiKey: string,
  cita1: string,
  cita2: string
): Promise<string> {
  const prompt = `Realiza un estudio comparativo teológico y exegético profundo entre estos dos pasajes bíblicos:
- Pasaje A: ${cita1}
- Pasaje B: ${cita2}

ES OBLIGATORIO usar exactamente esta estructura numerada:
1. Textos (Reina Valera 1960). Presenta el texto completo de ambos pasajes.
2. Similitudes Teológicas. ¿Qué temas, conceptos o verdades comparten ambos pasajes?
3. Diferencias y Contrastes. ¿En qué difieren en énfasis, contexto, audiencia o mensaje?
4. Contexto Histórico Comparado. ¿En qué épocas y circunstancias fueron escritos?
5. Análisis Lingüístico Comparado. Palabras clave en hebreo/griego que iluminan la comparación.
6. Progresión Reveladora. ¿Uno anticipa o completa al otro?
7. Puntos de Tensión o Aparente Contradicción. ¿Cómo se resuelve?
8. Síntesis Teológica. ¿Qué verdad unificadora emerge al leerlos juntos?
9. Aplicación Práctica Combinada.
10. Conclusión Comparativa.

Responde directamente con los puntos numerados.`
  return llamarGemini(apiKey, prompt, 6000)
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
