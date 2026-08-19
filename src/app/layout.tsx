import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Estudio Bíblico Pro',
  description: 'Exégesis académica y teológica profunda.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#080a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="min-h-screen relative text-slate-100 antialiased overflow-x-hidden">
          
          {/* Fondo de Biblioteca Mística y Luces Cálidas detrás del cristal */}
          <div 
            className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 35%, rgba(245, 175, 60, 0.25) 0%, rgba(10, 12, 18, 0.85) 60%, #06070a 100%), url('https://images.unsplash.com/photo-1507842229451-79b1be8d62ee?q=80&w=2000&auto=format&fit=crop')`
            }}
          />

          {/* Resplandor central de runas doradas */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/15 rounded-full blur-[110px]" />
          </div>

          {/* Contenido de la Aplicación */}
          <div className="relative z-10">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
