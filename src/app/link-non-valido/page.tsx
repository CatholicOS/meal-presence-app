import Link from 'next/link'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { LanguageMenu } from '@/components/LanguageMenu'
import { ADMIN_HINT_COOKIE } from '@/lib/cookie'

export default async function InvalidLinkPage() {
  const t = await getTranslations()
  const showAdmin = (await cookies()).has(ADMIN_HINT_COOKIE)
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div className="mb-4 flex justify-end"><LanguageMenu /></div>
      <h1 className="text-2xl font-semibold">{t('invalidLink.title')}</h1>
      <p className="mt-3 text-neutral-600">{t('invalidLink.body')}</p>
      {showAdmin && (
        <p className="mt-6">
          <Link href="/admin" className="text-blue-800 hover:underline">{t('member.adminArea')}</Link>
        </p>
      )}
    </main>
  )
}
