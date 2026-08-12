import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, cita, cita1, cita2, estilo } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar la GEMINI_API_KEY en las variables de entorno de Vercel.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let prompt = ''
    if (action === 'exegesis') {
      prompt = `Realiza una exégesis académica y profunda del siguiente pasaje bíblico: "${cita}". Incluye contexto histórico, análisis lingüístico de términos clave y aplicación práctica.`
    } else if (action === 'comparado') {
      prompt = `Realiza un estudio comparativo teológico profundo entre estos dos pasajes: Pasaje A: "${cita1}" y Pasaje B: "${cita2}". Analiza similitudes, diferencias y relación teológica.`
    } else if (action === 'sermon') {
      const tipo = estilo === 'devocional' ? 'un devocional breve' : 'un sermón expositivo estructurado'
      prompt = `Genera ${tipo} basado en el siguiente pasaje bíblico: "${cita}".`
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    return NextResponse.json({ texto: response.text() })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al procesar con la IA'
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
