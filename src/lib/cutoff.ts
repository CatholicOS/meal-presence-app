import { type Cell, DEFAULT_TIME_ZONE, MEALS, addDays, localParts } from '@/lib/dates'

export interface CutoffSettings {
  lunch_cutoff: string // 'HH:MM' in time_zone
  dinner_cutoff: string
  time_zone: string // IANA name, e.g. 'Europe/Rome'
}

export const DEFAULT_SETTINGS: CutoffSettings = { lunch_cutoff: '10:00', dinner_cutoff: '10:00', time_zone: DEFAULT_TIME_ZONE }

export function parseHm(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s)
  if (!m) throw new Error(`invalid time: ${s}`)
  return Number(m[1]) * 60 + Number(m[2])
}

export function cutoffFor(meal: Cell['meal'], settings: CutoffSettings): string {
  return meal === 'lunch' ? settings.lunch_cutoff : settings.dinner_cutoff
}

/** A cell is locked when its day is past, or it is today and local time (settings.time_zone) >= that meal's cutoff. */
export function isLocked(cell: Cell, now: Date, settings: CutoffSettings): boolean {
  const { date: today, minutes } = localParts(now, settings.time_zone)
  if (cell.date < today) return true
  if (cell.date > today) return false
  return minutes >= parseHm(cutoffFor(cell.meal, settings))
}

/** Earliest cell a member may still edit. */
export function firstUnlockedCell(now: Date, settings: CutoffSettings): Cell {
  const { date: today } = localParts(now, settings.time_zone)
  for (const meal of MEALS) {
    const cell = { date: today, meal }
    if (!isLocked(cell, now, settings)) return cell
  }
  return { date: addDays(today, 1), meal: 'lunch' }
}
