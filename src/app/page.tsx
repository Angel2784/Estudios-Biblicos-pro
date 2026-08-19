'use client'

import { useState } from 'react'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.error) {
        setResponse('Error: ' + data.error)
      } else {
        setResponse(data.text)
      }
    } catch (err) {
      setResponse('Ocurrió un error al conectar con el servidor.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Estudios Bíblicos Pro</h1>
          <div className="space-x-4">
            <a href="/sign-in" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Iniciar Sesión
            </a>
            <a href="/sign-up" className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700">
              Registrarse
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Generador de Estudios y Consultas</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Escribe tu consulta o tema de estudio bíblico aquí..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              {loading ? 'Generando...' : 'Generar con IA'}
            </button>
          </form>

          {response && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap text-gray-700">
              {response}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
