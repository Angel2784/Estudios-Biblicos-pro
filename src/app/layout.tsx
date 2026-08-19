import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Estudio Bíblico Pro',
  description: 'Exégesis académica y teológica profunda.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#05070a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="min-h-screen relative text-slate-100 antialiased overflow-x-hidden">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
