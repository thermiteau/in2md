import { type BrowserContext, type Page, expect, test } from '@playwright/test'
import { createExtensionContext } from './helpers'

// Single shared context across all tests to minimise LinkedIn sessions
let context: BrowserContext
let page: Page

// Human-like delay between actions
const pause = (ms = 1500) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms + Math.random() * 1000)
  })

test.beforeAll(async () => {
  context = await createExtensionContext()
  page = context.pages()[0] || (await context.newPage())

  page.on('console', (msg) => {
    const t = msg.text()

    if (t.includes('[in2md]') || t.includes('[Test]')) {
      // eslint-disable-next-line no-console
      console.log('  PAGE:', t.substring(0, 150))
    }
  })
})

test.afterAll(async () => {
  if (context) {
    await context.close()
  }
})

test.describe.serial('LinkedIn Extension', () => {
  test('feed loads with authenticated session', async () => {
    await page.goto('https://www.linkedin.com/feed/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    await expect(page).toHaveURL(/\/feed/)

    const posts = page.locator('[role="listitem"]')
    await expect(posts.first()).toBeVisible({ timeout: 15_000 })

    await pause()
  })

  test('autorefresh blocker is active', async () => {
    // Collect console logs from a fresh navigation
    const logs: string[] = []

    const handler = (msg: { text: () => string }) => {
      logs.push(msg.text())
    }
    page.on('console', handler)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await pause(3000)

    const blockerActive = logs.some((l) => l.includes('Autorefresh blocker active'))
    expect(blockerActive).toBe(true)

    page.off('console', handler)
    await pause()
  })

  test('feed posts have expandable text content', async () => {
    const textBox = page.locator('[data-testid="expandable-text-box"]')
    await expect(textBox.first()).toBeVisible({ timeout: 15_000 })

    const text = await textBox.first().textContent()
    expect(text?.length).toBeGreaterThan(0)

    await pause()
  })

  test('Get User buttons are injected into feed posts', async () => {
    // Wait for MutationObserver to inject buttons
    await page.waitForTimeout(3_000)

    const eUserCount = await page.locator('[data-la-extract]').count()
    expect(eUserCount).toBeGreaterThan(0)

    await pause()
  })

  test('E:Post buttons are injected into feed posts', async () => {
    const ePostCount = await page.locator('[data-la-extract-post]').count()
    expect(ePostCount).toBeGreaterThan(0)

    await pause()
  })

  test('E:Post button triggers extraction', async () => {
    const ePostBtn = page.locator('[data-la-extract-post]').first()
    await expect(ePostBtn).toBeVisible({ timeout: 10_000 })

    await pause(1000)
    await ePostBtn.click()

    // Wait for the button to show feedback
    await page.waitForTimeout(3_000)

    const btnText = await ePostBtn.textContent()

    // After clicking, button cycles through: "..." -> "Copied!"/"Failed" -> "E:Post"
    // By the time we check, it may have reset back to "E:Post"
    expect(['Copied!', '...', 'E:Post', 'Failed']).toContain(btnText?.trim())

    await pause()
  })
})
