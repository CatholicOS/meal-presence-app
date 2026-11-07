import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser'
import { createFormatter, createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import de from '../../messages/de.json'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import fr from '../../messages/fr.json'
import it_ from '../../messages/it.json'
import pt from '../../messages/pt.json'
import { formats } from './formats'
import { LOCALES, type Locale } from './locales'
import { intervalSummary } from './summary'

const CATALOGUES: Record<Locale, object> = { it: it_, en, es, fr, pt, de }

/** Flattens a catalogue to { 'a.b.c': message }. */
function flatten(obj: object, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[prefix + k] = v
    else Object.assign(out, flatten(v as object, `${prefix}${k}.`))
  }
  return out
}

/** Names of the ICU arguments a message uses ({name}, {count, plural, …}, {meal, select, …}). */
function argNames(elements: MessageFormatElement[], into = new Set<string>()): Set<string> {
  for (const el of elements) {
    if (el.type === TYPE.argument || el.type === TYPE.number || el.type === TYPE.date || el.type === TYPE.time) into.add(el.value)
    if (el.type === TYPE.plural || el.type === TYPE.select) {
      into.add(el.value)
      for (const opt of Object.values(el.options)) argNames(opt.value, into)
    }
  }
  return into
}

const source = flatten(it_)

describe.each(LOCALES)('messages/%s.json', (locale) => {
  const messages = flatten(CATALOGUES[locale])

  it('has exactly the Italian keys', () => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(source).sort())
  })

  it('uses the same ICU arguments as Italian in every message, and every message parses', () => {
    for (const [key, msg] of Object.entries(messages)) {
      const args = [...argNames(parse(msg))].sort()
      const expected = [...argNames(parse(source[key]))].sort()
      expect({ key, args }).toEqual({ key, args: expected })
    }
  })
})

function i18n(locale: Locale) {
  const messages = CATALOGUES[locale] as typeof it_
  return {
    t: createTranslator({ locale, messages }),
    tInterval: createTranslator({ locale, messages, namespace: 'interval' }),
    format: createFormatter({ locale, formats, timeZone: 'Europe/Rome' }),
  }
}

describe('plurals and interpolation', () => {
  it('follows each language’s plural rules', () => {
    expect(i18n('it').t('absentCount', { count: 1 })).toBe('1 assente')
    expect(i18n('it').t('absentCount', { count: 3 })).toBe('3 assenti')
    expect(i18n('es').t('presentCount', { count: 2 })).toBe('2 presentes')
    // French: 0 and 1 are singular
    expect(i18n('fr').t('absentCount', { count: 0 })).toBe('0 absent')
    expect(i18n('fr').t('absentCount', { count: 2 })).toBe('2 absents')
    expect(i18n('it').t('period.overwrittenMore', { count: 1 })).toBe('+1 altro')
    expect(i18n('pt').t('period.overwrittenMore', { count: 4 })).toBe('+4 outras')
  })

  it('picks the right article for the meal', () => {
    expect(i18n('it').t('admin.kitchen.absentAt', { meal: 'dinner' })).toBe('Assenti a cena')
    expect(i18n('es').t('admin.kitchen.presentAt', { meal: 'lunch' })).toBe('Presentes en el almuerzo')
    expect(i18n('fr').t('admin.kitchen.absentAt', { meal: 'dinner' })).toBe('Absents au dîner')
    expect(i18n('de').t('admin.kitchen.presentAt', { meal: 'lunch' })).toBe('Anwesend beim Mittagessen')
  })
})

describe('intervalSummary', () => {
  const cells = [
    { date: '2026-09-20', meal: 'lunch' as const },
    { date: '2026-09-20', meal: 'dinner' as const },
    { date: '2026-09-21', meal: 'lunch' as const },
  ]
  const summary = (locale: Locale, c = cells) => {
    const { tInterval, format } = i18n(locale)
    return intervalSummary(tInterval, (iso) => format.dateTime(new Date(`${iso}T00:00:00Z`), 'dayShort'), c)
  }

  it('describes a range in Italian, with the meal-dependent preposition', () => {
    expect(summary('it')).toBe('3 pasti, dal pranzo di dom 20 set al pranzo di lun 21 set')
    expect(summary('it', cells.slice(1))).toBe('2 pasti, dalla cena di dom 20 set al pranzo di lun 21 set')
  })

  it('describes a single meal and an empty interval', () => {
    expect(summary('en', cells.slice(0, 1))).toBe('1 meal: lunch on Sun, Sep 20')
    expect(summary('de', [])).toBe('Keine Mahlzeiten')
  })

  it('formats dates in the visitor’s language', () => {
    expect(summary('es')).toBe('3 comidas, desde el almuerzo del dom, 20 sept hasta el almuerzo del lun, 21 sept')
  })
})
