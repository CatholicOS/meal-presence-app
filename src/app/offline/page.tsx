import { getTranslations } from 'next-intl/server'

export default async function OfflinePage() {
  const t = await getTranslations('offline')
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-3 text-neutral-600">{t('body')}</p>
    </main>
  )
}
