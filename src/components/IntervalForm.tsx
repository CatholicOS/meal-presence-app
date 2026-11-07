'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { intervalSummary } from '@/i18n/summary'
import { type Cell, type IsoDate, MEALS, type Meal, toUtcDate } from '@/lib/dates'
import { validateInterval } from './intervalForm.logic'
import { Toast, useToast } from './Toast'

const ISSUE_KEY = {
  start_too_early: 'period.startTooEarly',
  invalid_interval: 'period.invalidInterval',
  too_long: 'period.tooLong',
} as const

export function IntervalForm({ min }: { min: Cell }) {
  const t = useTranslations()
  const tInterval = useTranslations('interval')
  const format = useFormatter()
  const day = (iso: IsoDate) => format.dateTime(toUtcDate(iso), 'dayShort')
  const router = useRouter()
  const { msg, show } = useToast()
  const [state, setState] = useState(false) // false = assente
  const [startDate, setStartDate] = useState(min.date)
  const [startMeal, setStartMeal] = useState<Meal>(min.meal)
  const [endDate, setEndDate] = useState(min.date)
  const [endMeal, setEndMeal] = useState<Meal>('dinner')
  const [busy, setBusy] = useState(false)

  const { cells, error } = validateInterval({ startDate, startMeal, endDate, endMeal }, min)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (error || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/choices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ start_date: startDate, start_meal: startMeal, end_date: endDate, end_meal: endMeal, state }),
      })
      if (!res.ok) {
        show(res.status === 409 ? t('period.lockedError') : t('genericError'), true)
        return
      }
      const body = (await res.json().catch(() => null)) as { change_id?: string } | null
      if (!body?.change_id) {
        show(t('genericError'), true)
        return
      }
      router.push(`/periodo/conferma?c=${body.change_id}`)
    } catch {
      show(t('genericError'), true)
    } finally {
      setBusy(false)
    }
  }

  const seg = (value: boolean, label: string) => (
    <button
      type="button"
      onClick={() => setState(value)}
      aria-pressed={state === value}
      className={`flex-1 rounded-full py-3 font-semibold ${state === value ? 'bg-blue-800 text-white' : 'bg-white text-neutral-600'}`}
    >
      {label}
    </button>
  )
  const mealSelect = (value: Meal, onChange: (m: Meal) => void, name: string) => (
    <select name={name} value={value} onChange={(e) => onChange(e.target.value as Meal)} className="rounded-lg border p-3">
      {MEALS.map((m) => (
        <option key={m} value={m}>{t(`meal.${m}`)}</option>
      ))}
    </select>
  )

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex gap-2 rounded-full bg-neutral-200 p-1">
        {seg(false, t('period.absent'))}
        {seg(true, t('period.present'))}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('period.from')}</span>
        <div className="flex gap-2">
          <input type="date" name="start_date" value={startDate} min={min.date} onChange={(e) => setStartDate(e.target.value)} className="flex-1 rounded-lg border p-3" required />
          {mealSelect(startMeal, setStartMeal, 'start_meal')}
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('period.to')}</span>
        <div className="flex gap-2">
          <input type="date" name="end_date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 rounded-lg border p-3" required />
          {mealSelect(endMeal, setEndMeal, 'end_meal')}
        </div>
      </label>
      <p className={`rounded-lg p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-900'}`} data-testid="summary">
        {error ? t(ISSUE_KEY[error]) : `${state ? t('period.present') : t('period.absent')}: ${intervalSummary(tInterval, day, cells)}`}
      </p>
      <button type="submit" disabled={!!error || busy} className="w-full rounded-full bg-blue-800 py-4 font-semibold text-white disabled:opacity-40">
        {t('save')}
      </button>
      <Toast msg={msg} />
    </form>
  )
}
