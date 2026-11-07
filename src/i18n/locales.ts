export const LOCALES = ['it', 'en', 'es', 'fr', 'pt', 'de'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'it'
/** Personal language choice (the language menu); without it the community default applies. */
export const LOCALE_COOKIE = 'locale'

/** Each language named in itself, as shown in the language menu. */
export const LOCALE_NAMES: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
}


export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}
