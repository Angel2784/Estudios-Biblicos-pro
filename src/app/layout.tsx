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
  themeColor: '#0a0d14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="min-h-screen relative bg-[#080a0f] text-slate-100 overflow-x-hidden antialiased">
          
          {/* Luces y resplandores ambientales detrás del cristal (Efecto Imagen 2) */}
          <div className="fixed inset-0 pointer-events-none z-0">
            {/* Resplandor dorado superior central */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
            {/* Resplandor cálido intermedio */}
            <div className="absolute top-[35%] left-[20%] w-[500px] h-[400px] bg-amber-600/8 rounded-full blur-[160px]" />
            {/* Tono místico inferior */}
            <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[500px] bg-indigo-950/20 rounded-full blur-[150px]" />
          </div>

          {/* Contenido principal encima de los fondos */}
          <div className="relative z-10">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
