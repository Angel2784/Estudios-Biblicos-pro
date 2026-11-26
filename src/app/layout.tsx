import type { Metadata, Viewport } from 'next'
import { Crimson_Pro, Inter } from 'next/font/google'
import './globals.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-crimson',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Estudio Bíblico Pro',
  description: 'Exégesis académica y teológica profunda.',
  manifest: '/manifest.json',
}
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#05070a',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${crimsonPro.variable} ${inter.variable}`}>
      <body className="min-h-screen relative text-slate-100 antialiased overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  )
}
