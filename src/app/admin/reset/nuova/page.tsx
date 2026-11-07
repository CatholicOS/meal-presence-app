import { useTranslations } from 'next-intl'
import { NewPasswordForm } from '@/components/admin/NewPasswordForm'

export default function NewPasswordPage() {
  const t = useTranslations()
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">{t('admin.reset.newTitle')}</h1>
      <NewPasswordForm />
    </main>
  )
}
