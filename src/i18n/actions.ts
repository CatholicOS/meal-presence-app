'use server'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from './locales'

/** Remembers the visitor's language for a year. Setting the cookie re-renders the current page in it. */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
}
