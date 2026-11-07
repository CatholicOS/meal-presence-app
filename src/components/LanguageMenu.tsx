'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { setLocale } from '@/i18n/actions'
import { LOCALES, LOCALE_NAMES } from '@/i18n/locales'

/** Compact language picker; each language is listed under its own name. */
export function LanguageMenu({ className = '' }: { className?: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const [pending, start] = useTransition()
  return (
    <select
      aria-label={t('language')}
      title={t('language')}
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value
        start(() => setLocale(next))
      }}
      className={`rounded border bg-white px-1.5 py-1 text-sm disabled:opacity-60 ${className}`}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} lang={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  )
}
