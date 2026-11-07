import 'server-only'
import { cache } from 'react'
import { type CutoffSettings, DEFAULT_SETTINGS } from '@/lib/cutoff'
import { isTimeZone } from '@/lib/dates'
import { DEFAULT_LOCALE, type Locale, isLocale } from '@/i18n/locales'
import { db } from './db'

export interface AppSettings extends CutoffSettings {
  default_locale: Locale
}

const KEYS = ['lunch_cutoff', 'dinner_cutoff', 'time_zone', 'default_locale'] as const

/** Community settings, with safe defaults for anything missing or invalid. Memoised per request. */
export const getSettings = cache(async (): Promise<AppSettings> => {
  const { data, error } = await db.from('settings').select('key, value').in('key', [...KEYS])
  if (error) throw new Error(`settings: ${error.message}`)
  const s: AppSettings = { ...DEFAULT_SETTINGS, default_locale: DEFAULT_LOCALE }
  for (const row of (data ?? []) as { key: (typeof KEYS)[number]; value: unknown }[]) {
    const v = row.value
    if (row.key === 'time_zone') { if (isTimeZone(v)) s.time_zone = v }
    else if (row.key === 'default_locale') { if (isLocale(v)) s.default_locale = v }
    else if (typeof v === 'string') s[row.key] = v
  }
  return s
})
