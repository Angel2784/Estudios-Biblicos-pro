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
        <body className="min-h-screen text-slate-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
