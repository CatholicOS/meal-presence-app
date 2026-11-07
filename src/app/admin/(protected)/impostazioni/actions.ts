'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'
import { isTimeZone } from '@/lib/dates'
import { requireAdmin } from '@/server/auth'
import { db } from '@/server/db'

const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const schema = z.object({
  lunch_cutoff: hm,
  dinner_cutoff: hm,
  default_locale: z.enum(LOCALES),
  time_zone: z.string().refine(isTimeZone),
})

export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin()
  const s = schema.parse(Object.fromEntries(['lunch_cutoff', 'dinner_cutoff', 'default_locale', 'time_zone'].map((k) => [k, formData.get(k)])))
  const { error } = await db.from('settings').upsert(Object.entries(s).map(([key, value]) => ({ key, value })))
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  redirect('/admin/impostazioni?saved=1')
}
