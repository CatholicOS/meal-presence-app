'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createSeason, deleteSeason, type SeasonResult, updateSeason } from '@/app/admin/(protected)/stagioni/actions'
import { daysInMonth, type SeasonInput } from '@/app/admin/(protected)/stagioni/schema'
import { useFormatter, useTranslations } from 'next-intl'

export interface SeasonListRow {
  id: string
  label: string
  start_md: string | null
  end_md: string | null
  start_date: string | null
  end_date: string | null
  lunch_default: boolean
  dinner_default: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
/** Month names in the current language (January first). */
function useMonths(): string[] {
  const format = useFormatter()
  return Array.from({ length: 12 }, (_, i) => format.dateTime(new Date(Date.UTC(2024, i, 1)), 'month'))
}
/** 'MM-DD' → '1 ottobre' / '1 October' / '1. Oktober' in the current language. */
function useFormatMd(): (md: string | null) => string {
  const format = useFormatter()
  return (md) => {
    if (!md) return ''
    const [m, d] = md.split('-').map(Number)
    return format.dateTime(new Date(Date.UTC(2024, m - 1, d)), 'monthDay')
  }
}

/** Month + day dropdowns posting a single 'MM-DD' value under `name`; the day list follows the chosen month. */
function MonthDaySelect({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  const t = useTranslations()
  const months = useMonths()
  const [dm, dd] = defaultValue.split('-').map(Number)
  const [month, setMonth] = useState(dm || 1)
  const [day, setDay] = useState(dd || 1)
  const max = daysInMonth(month)
  return (
    <fieldset className="block text-sm">
      <legend>{label}</legend>
      <input type="hidden" name={name} value={`${pad(month)}-${pad(day)}`} />
      <div className="mt-1 flex gap-2">
        <select aria-label={`${label} – ${t('admin.seasons.month')}`} value={month} onChange={(e) => { const m = Number(e.target.value); setMonth(m); setDay((d) => Math.min(d, daysInMonth(m))) }} className="w-full rounded border p-2">
          {months.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
        </select>
        <select aria-label={`${label} – ${t('admin.seasons.day')}`} value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-20 rounded border p-2">
          {Array.from({ length: max }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>
      </div>
    </fieldset>
  )
}

function toInput(fd: FormData): SeasonInput {
  const common = {
    label: String(fd.get('label') ?? ''),
    lunch_default: fd.get('lunch_default') === 'on',
    dinner_default: fd.get('dinner_default') === 'on',
  }
  return fd.get('kind') === 'one_off'
    ? { kind: 'one_off', ...common, start_date: String(fd.get('start_date') ?? ''), end_date: String(fd.get('end_date') ?? '') }
    : { kind: 'recurring', ...common, start_md: String(fd.get('start_md') ?? ''), end_md: String(fd.get('end_md') ?? '') }
}

export function SeasonsEditor({ rows }: { rows: SeasonListRow[] }) {
  const t = useTranslations()
  const formatMd = useFormatMd()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState<SeasonListRow | 'new' | null>(null)
  const [kind, setKind] = useState<'recurring' | 'one_off'>('recurring')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function run(fn: () => Promise<SeasonResult | void>) {
    start(async () => {
      try {
        const r = await fn()
        setError(r && 'error' in r ? t('admin.seasons.overlap', { label: r.with }) : null)
      } catch (err) {
        console.error(err)
        setError(t('genericError'))
      } finally {
        router.refresh()
      }
    })
  }

  function open(row: SeasonListRow | 'new') {
    setEditing(row)
    setKind(row !== 'new' && row.start_date ? 'one_off' : 'recurring')
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = toInput(new FormData(e.currentTarget))
    run(async () => {
      if (!editing) return
      const r = editing === 'new' ? await createSeason(input) : await updateSeason(editing.id, input)
      if ('ok' in r) setEditing(null)
      return r
    })
  }

  const row = editing !== 'new' ? editing : null
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">{t('admin.seasons.hint')}</p>
      <button type="button" onClick={() => open('new')} className="rounded-full bg-blue-800 px-4 py-2 text-sm font-semibold text-white">{t('admin.seasons.add')}</button>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      {editing && (
        <form key={editing === 'new' ? 'new' : editing.id} onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
          <label className="block text-sm">{t('admin.seasons.label')}<input name="label" required defaultValue={row?.label ?? ''} className="mt-1 w-full rounded border p-2" /></label>
          <label className="block text-sm">
            {t('admin.seasons.kind')}
            <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as 'recurring' | 'one_off')} className="mt-1 w-full rounded border p-2">
              <option value="recurring">{t('admin.seasons.recurring')}</option>
              <option value="one_off">{t('admin.seasons.oneOff')}</option>
            </select>
          </label>
          {kind === 'recurring' ? (
            <>
              <MonthDaySelect name="start_md" label={t('admin.seasons.startMd')} defaultValue={row?.start_md ?? '10-01'} />
              <MonthDaySelect name="end_md" label={t('admin.seasons.endMd')} defaultValue={row?.end_md ?? '06-30'} />
            </>
          ) : (
            <>
              <label className="block text-sm">{t('admin.seasons.startDate')}<input type="date" name="start_date" required defaultValue={row?.start_date ?? ''} className="mt-1 w-full rounded border p-2" /></label>
              <label className="block text-sm">{t('admin.seasons.endDate')}<input type="date" name="end_date" required defaultValue={row?.end_date ?? ''} className="mt-1 w-full rounded border p-2" /></label>
            </>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="lunch_default" defaultChecked={row?.lunch_default ?? true} />{t('admin.seasons.lunchDefault')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dinner_default" defaultChecked={row?.dinner_default ?? true} />{t('admin.seasons.dinnerDefault')}</label>
          <div className="flex gap-2 md:col-span-4">
            <button type="submit" disabled={pending} className="rounded-full bg-blue-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{t('save')}</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full border px-4 py-2 text-sm">{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 text-left">
          <tr><th className="p-2">{t('admin.seasons.label')}</th><th className="p-2">{t('admin.seasons.period')}</th><th className="p-2">{t('admin.seasons.lunchDefault')}</th><th className="p-2">{t('admin.seasons.dinnerDefault')}</th><th className="p-2"></th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.label}</td>
              <td className="p-2">{r.start_date ? `${r.start_date} → ${r.end_date}` : `${t('admin.seasons.recurring')}: ${formatMd(r.start_md)} → ${formatMd(r.end_md)}`}</td>
              <td className="p-2">{r.lunch_default ? t('period.present') : t('period.absent')}</td>
              <td className="p-2">{r.dinner_default ? t('period.present') : t('period.absent')}</td>
              <td className="p-2">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => open(r)} className="rounded border px-2 py-1">{t('edit')}</button>
                  {confirmDelete === r.id ? (
                    <button type="button" disabled={pending} onClick={() => run(async () => { await deleteSeason(r.id); setConfirmDelete(null) })} className="rounded bg-red-600 px-2 py-1 text-white">{t('confirmDelete')}</button>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(r.id)} className="rounded border border-red-300 px-2 py-1 text-red-700">{t('delete')}</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
