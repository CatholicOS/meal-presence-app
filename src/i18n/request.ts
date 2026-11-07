import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_TIME_ZONE } from '@/lib/dates'
import { getSettings } from '@/server/settings'
import { formats } from './formats'
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, isLocale } from './locales'

/**
 * Locale: the visitor's own choice (cookie), else the community default from Impostazioni.
 * There is no locale in the URL, so personal links and home-screen shortcuts never change.
 */
export default getRequestConfig(async () => {
  const store = await cookies()
  let defaultLocale: Locale = DEFAULT_LOCALE
  let timeZone = DEFAULT_TIME_ZONE
  try {
    const s = await getSettings()
    defaultLocale = s.default_locale
    timeZone = s.time_zone
  } catch (err) {
    // Pages must still render (e.g. the offline page, error screens) when the database is unreachable.
    console.error(err)
  }
  const fromCookie = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(fromCookie) ? fromCookie : defaultLocale
  return {
    locale,
    timeZone,
    formats,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
