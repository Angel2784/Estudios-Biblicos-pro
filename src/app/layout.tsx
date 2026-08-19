import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Estudio Bíblico Pro',
  description: 'Exégesis académica y teológica profunda.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Estudio Bíblico Pro' },
  openGraph: {
    title: 'Estudio Bíblico Pro',
    description: 'Exégesis académica',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#080a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="min-h-screen relative bg-[#07090e] text-slate-100 antialiased overflow-x-hidden">
          
          {/* Fondo místico ambiental con runas y resplandor dorado (Efecto de la imagen) */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Círculo místico de runas / resplandor central */}
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,_rgba(245,190,80,0.14)_0%,_rgba(215,140,40,0.06)_45%,_transparent_70%)] blur-[70px]" />
            {/* Resplandor lateral izquierdo (columna) */}
            <div className="absolute top-[5%] -left-[10%] w-[500px] h-[700px] bg-amber-700/10 rounded-full blur-[140px]" />
            {/* Resplandor lateral derecho (biblioteca) */}
            <div className="absolute top-[25%] -right-[10%] w-[500px] h-[700px] bg-amber-900/15 rounded-full blur-[140px]" />
          </div>

          {/* Contenido de la App encima del fondo */}
          <div className="relative z-10">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
