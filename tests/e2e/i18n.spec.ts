import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { E2E } from './global-setup'

// Language and time zone are shared state: always put the defaults back.
test.afterEach(async () => {
  process.loadEnvFile('.env.local')
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`update settings set value = '"it"' where key = 'default_locale'`
  await sql`update settings set value = '"Europe/Rome"' where key = 'time_zone'`
  await sql.end()
})

test('a member switches language; the choice sticks and the personal link keeps working', async ({ page }) => {
  await page.goto(`/p/${E2E.memberToken}`)
  await expect(page.getByRole('link', { name: 'Segna un periodo' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'it')

  await page.getByRole('combobox', { name: 'Lingua' }).selectOption('en')
  await expect(page.getByRole('link', { name: 'Mark a period' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'Lunch' })).toHaveCount(30)

  // remembered across pages and visits
  await page.getByRole('link', { name: 'Mark a period' }).click()
  await expect(page.getByRole('heading', { name: 'Mark a period' })).toBeVisible()
  await page.goto(`/p/${E2E.memberToken}`)
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue('en')

  await page.getByRole('combobox', { name: 'Language' }).selectOption('de')
  await expect(page.getByRole('link', { name: 'Zeitraum eintragen' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Sprache' }).selectOption('it')
  await expect(page.getByRole('link', { name: 'Segna un periodo' })).toBeVisible()
})

test('the admin sets the community language and time zone', async ({ page, browser }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(E2E.adminEmail)
  await page.getByLabel('Password', { exact: true }).fill(E2E.adminPassword)
  await page.getByRole('button', { name: 'Accedi' }).click()
  await expect(page).toHaveURL(/\/admin$/)

  await page.goto('/admin/impostazioni')
  await page.getByLabel('Fuso orario').selectOption('America/New_York')
  await page.getByLabel('Lingua predefinita').selectOption('es')
  await page.getByRole('button', { name: 'Salva' }).click()
  // The admin has no language cookie, so the new default applies to them too.
  await expect(page.getByText('Ajustes guardados.')).toBeVisible()
  await expect(page.getByLabel('Zona horaria')).toHaveValue('America/New_York')

  // a visitor without a personal choice now sees Spanish
  const other = await browser.newPage()
  await other.goto('/link-non-valido')
  await expect(other.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible()
  await other.close()
})
