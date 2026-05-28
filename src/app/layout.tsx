import type { Metadata, Viewport } from 'next'
import {
  Cormorant_Garamond,
  Source_Serif_4,
  Noto_Serif_Devanagari,
} from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
})

const notoDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-devanagari',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SadhanaOS — Your Digital Ashram',
    template: '%s · SadhanaOS',
  },
  description:
    'साधना — Disciplined spiritual practice toward self-realization. Track your brahmacharya journey, daily rituals, and inner growth.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'SadhanaOS',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  openGraph: {
    title: 'SadhanaOS — Your Digital Ashram',
    description: 'साधना — Disciplined spiritual practice toward self-realization.',
    type: 'website',
    locale: 'en_US',
  },
}

export const viewport: Viewport = {
  themeColor: '#E8913A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${sourceSerif.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
