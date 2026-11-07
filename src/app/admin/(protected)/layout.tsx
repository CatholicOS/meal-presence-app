import Link from 'next/link'
import { LanguageMenu } from '@/components/LanguageMenu'
import { NavLink } from '@/components/admin/NavLink'
import { getTranslations } from 'next-intl/server'
import { getPersonFromCookie, requireAdmin } from '@/server/auth'
import { signOut } from './actions'

const NAV = [
  ['/admin', 'kitchen'],
  ['/admin/persone', 'persons'],
  ['/admin/gruppi', 'groups'],
  ['/admin/stagioni', 'seasons'],
  ['/admin/impostazioni', 'settings'],
  ['/admin/registro', 'log'],
  ['/admin/password', 'password'],
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations()
  await requireAdmin()
  const person = await getPersonFromCookie()
  return (
    <div className="min-h-screen">
      <nav className="no-print flex flex-wrap items-center gap-4 border-b bg-white px-4 py-3 text-sm">
        <span className="font-semibold">{t('appName')}</span>
        {NAV.map(([href, key]) => (
          <NavLink key={href} href={href} label={t(`admin.nav.${key}`)} />
        ))}
        <div className="ml-auto flex items-center gap-4">
          <LanguageMenu />
          {person && <Link href="/" className="text-blue-800 hover:underline">{t('admin.myMeals')}</Link>}
          <form action={signOut}>
            <button type="submit" className="text-neutral-600 hover:underline">{t('admin.logout')}</button>
          </form>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
