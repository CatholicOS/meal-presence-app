import type { Cell } from '@/lib/dates'

type IntervalT = (key: 'none' | 'one' | 'many', values?: Record<string, string | number>) => string

/**
 * "3 pasti, dal pranzo di dom 20 set alla cena di lun 21 set" in the current language.
 * `t` is the 'interval' namespace; `day` formats an ISO date the short way.
 */
export function intervalSummary(t: IntervalT, day: (iso: string) => string, cells: Cell[]): string {
  if (cells.length === 0) return t('none')
  const a = cells[0]
  const b = cells[cells.length - 1]
  if (cells.length === 1) return t('one', { meal: a.meal, day: day(a.date) })
  return t('many', { count: cells.length, fromMeal: a.meal, fromDay: day(a.date), toMeal: b.meal, toDay: day(b.date) })
}
