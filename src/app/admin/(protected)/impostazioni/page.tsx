import { getTranslations } from 'next-intl/server'
import { LOCALES, LOCALE_NAMES } from '@/i18n/locales'
import { requireAdmin } from '@/server/auth'
import { getSettings } from '@/server/settings'
import { saveSettings } from './actions'

/** Every IANA zone the runtime knows, keeping the saved one even if it is missing from the list. */
function timeZones(current: string): string[] {
  const all = Intl.supportedValuesOf('timeZone')
  return all.includes(current) ? all : [current, ...all]
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin()
  const [t, tCommon, s] = await Promise.all([getTranslations('admin.settings'), getTranslations(), getSettings()])
  const { saved } = await searchParams
  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-2xl font-semibold">{t('title')}</h1>
      <form action={saveSettings} className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
        <label className="block text-sm">
          {t('lunchCutoff')}
          <input type="time" name="lunch_cutoff" defaultValue={s.lunch_cutoff} required className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block text-sm">
          {t('dinnerCutoff')}
          <input type="time" name="dinner_cutoff" defaultValue={s.dinner_cutoff} required className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block text-sm">
          {t('timeZone')}
          <select name="time_zone" defaultValue={s.time_zone} className="mt-1 w-full rounded border p-2">
            {timeZones(s.time_zone).map((z) => <option key={z} value={z}>{z.replaceAll('_', ' ')}</option>)}
          </select>
          <span className="mt-1 block text-xs text-neutral-500">{t('timeZoneHint')}</span>
        </label>
        <label className="block text-sm">
          {t('defaultLocale')}
          <select name="default_locale" defaultValue={s.default_locale} className="mt-1 w-full rounded border p-2">
            {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LOCALE_NAMES[l]}</option>)}
          </select>
          <span className="mt-1 block text-xs text-neutral-500">{t('defaultLocaleHint')}</span>
        </label>
        <button type="submit" className="rounded-full bg-blue-800 px-4 py-2 text-sm font-semibold text-white">{tCommon('save')}</button>
        {saved && <p role="status" className="text-sm text-green-700">{t('saved')}</p>}
      </form>
    </div>
  )
}
