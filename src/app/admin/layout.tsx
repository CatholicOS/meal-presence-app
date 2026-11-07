import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

// Admin pages point to their own manifest (start_url /admin), so "Add to Home Screen" from here
// installs a separate icon that opens the admin area instead of the member page.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return {
    manifest: '/admin.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: t('appName') },
  }
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
