import type { Messages } from 'next-intl'
import { z } from 'zod'
import { getFormatter, getTranslations } from 'next-intl/server'
import { intervalSummary } from '@/i18n/summary'
import { type Cell, type IsoDate, type Meal, isIsoDate, toUtcDate } from '@/lib/dates'
import { expandInterval } from '@/lib/interval'
import { requireAdmin } from '@/server/auth'
import { db } from '@/server/db'

interface LogRow {
  id: string
  actor: 'member' | 'admin'
  kind: string
  start_date: IsoDate
  start_meal: Meal
  end_date: IsoDate
  end_meal: Meal
  state: boolean
  created_at: string
  undone_by: string | null
  persons: { full_name: string } | null
}

function safeCells(r: LogRow): Cell[] | null {
  try {
    return expandInterval(r.start_date, r.start_meal, r.end_date, r.end_meal)
  } catch {
    return null
  }
}

export default async function LogPage({ searchParams }: { searchParams: Promise<{ p?: string; from?: string; to?: string }> }) {
  await requireAdmin()
  const [t, tInterval, format] = await Promise.all([getTranslations(), getTranslations('interval'), getFormatter()])
  const day = (iso: IsoDate) => format.dateTime(toUtcDate(iso), 'dayShort')
  const kindLabel = (kind: string) => {
    const key = `kind.${kind}` as `kind.${keyof Messages['kind']}`
    return t.has(key) ? t(key) : kind
  }
  const summary = (r: LogRow) => {
    const cells = safeCells(r)
    return cells ? intervalSummary(tInterval, day, cells) : '—'
  }
  const { p, from, to } = await searchParams

  const { data: persons } = await db.from('persons').select('id, full_name').order('full_name')
  let q = db
    .from('changes')
    .select('id, actor, kind, start_date, start_meal, end_date, end_meal, state, created_at, undone_by, persons!changes_person_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (p && z.uuid().safeParse(p).success) q = q.eq('person_id', p)
  if (from && isIsoDate(from)) q = q.gte('start_date', from)
  if (to && isIsoDate(to)) q = q.lte('end_date', to)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as LogRow[]

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t('admin.log.title')}</h1>
      <form className="no-print mb-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="block">
          {t('admin.log.person')}
          <select name="p" defaultValue={p ?? ''} className="mt-1 block rounded border p-2">
            <option value="">{t('admin.log.all')}</option>
            {(persons ?? []).map((x) => (
              <option key={x.id} value={x.id}>{x.full_name}</option>
            ))}
          </select>
        </label>
        <label className="block">{t('admin.log.from')}<input type="date" name="from" defaultValue={from ?? ''} className="mt-1 block rounded border p-2" /></label>
        <label className="block">{t('admin.log.to')}<input type="date" name="to" defaultValue={to ?? ''} className="mt-1 block rounded border p-2" /></label>
        <button type="submit" className="rounded-full border px-4 py-2">{t('admin.log.filter')}</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-2">{t('admin.log.when')}</th>
              <th className="p-2">{t('admin.log.person')}</th>
              <th className="p-2">{t('admin.log.actor')}</th>
              <th className="p-2">{t('admin.log.kind')}</th>
              <th className="p-2">{t('admin.log.interval')}</th>
              <th className="p-2">{t('admin.log.state')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="p-3 text-neutral-500">{t('admin.log.empty')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className={`border-t ${r.undone_by ? 'text-neutral-400 line-through' : ''}`}>
                <td className="whitespace-nowrap p-2">{format.dateTime(new Date(r.created_at), 'dateTime')}</td>
                <td className="p-2">{r.persons?.full_name ?? '—'}</td>
                <td className="p-2">{r.actor === 'admin' ? t('admin.log.actorAdmin') : t('admin.log.actorMember')}</td>
                <td className="p-2">{kindLabel(r.kind)}{r.undone_by && <span className="ml-1 text-xs">({t('admin.log.undone')})</span>}</td>
                <td className="p-2">{summary(r)}</td>
                <td className="p-2">{t(r.state ? 'state.present' : 'state.absent')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
