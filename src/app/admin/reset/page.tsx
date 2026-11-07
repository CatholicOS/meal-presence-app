import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ResetRequestForm } from '@/components/admin/ResetRequestForm'

export default function ResetRequestPage() {
  const t = useTranslations()
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">{t('admin.reset.title')}</h1>
      <p className="mb-6 text-sm text-neutral-600">{t('admin.reset.intro')}</p>
      <ResetRequestForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="text-blue-800 hover:underline">{t('admin.reset.backToLogin')}</Link>
      </p>
    </main>
  )
}
