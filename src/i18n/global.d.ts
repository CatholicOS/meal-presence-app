import type messages from '../../messages/it.json'
import type { formats } from './formats'
import type { Locale } from './locales'

// Italian is the source catalogue: every key used in code is checked against it.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: typeof messages
    Formats: typeof formats
  }
}
