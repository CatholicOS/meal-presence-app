'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { PasswordInput } from '@/components/PasswordInput'
import { useTranslations } from 'next-intl'

const MIN_LENGTH = 8
export function ChangePasswordForm({ email }: { email: string }) {
  const t = useTranslations()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setSaved(false)
    if (next.length < MIN_LENGTH) return setError(t('admin.changePassword.tooShort'))
    if (next !== confirm) return setError(t('admin.changePassword.mismatch'))

    setBusy(true)
    try {
      const supa = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      // Re-verify the current password before allowing the change.
      const { error: signInErr } = await supa.auth.signInWithPassword({ email, password: current })
      if (signInErr) return setError(t('admin.changePassword.wrongCurrent'))
      const { error: updateErr } = await supa.auth.updateUser({ password: next })
      if (updateErr) return setError(t('genericError'))
      setSaved(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      setError(t('genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
      <PasswordInput label={t('admin.changePassword.current')} value={current} onChange={setCurrent} autoComplete="current-password" />
      <PasswordInput label={t('admin.changePassword.next')} value={next} onChange={setNext} autoComplete="new-password" />
      <PasswordInput label={t('admin.changePassword.confirm')} value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="text-sm text-green-700">{t('admin.changePassword.saved')}</p>}
      <button type="submit" disabled={busy} className="rounded-full bg-blue-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
        {t('admin.changePassword.submit')}
      </button>
    </form>
  )
}
