import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { SwRegister } from '@/components/SwRegister'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  return {
    title: t('appName'),
    description: t('description'),
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: t('appName') },
    icons: { apple: '/icons/icon-192.png' },
  }
}

export const viewport: Viewport = { themeColor: '#1e3a8a', width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={await getLocale()}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {/* Locale, messages, time zone and formats come from src/i18n/request.ts. */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <SwRegister />
      </body>
    </html>
  )
}
