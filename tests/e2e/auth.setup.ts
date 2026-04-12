import { test as setup } from "@playwright/test"
import path from "path"
import fs from "fs"

const STORAGE_STATE = path.resolve(__dirname, "../.auth/linkedin.json")

setup("authenticate with LinkedIn", async ({ browser }) => {
  // Skip if we already have a valid session
  if (fs.existsSync(STORAGE_STATE)) {
    const stats = fs.statSync(STORAGE_STATE)

    const ageHours =
      (Date.now() - stats.mtimeMs) / (1000 * 60 * 60)

    // Reuse session if less than 12 hours old
    if (ageHours < 12) {
      // eslint-disable-next-line no-console
      console.log(
        `Reusing existing session (${Math.round(ageHours)}h old)`,
      )
      return
    }
  }

  // Open a browser window for manual login
  const context = await browser.newContext()

  const page = await context.newPage()

  await page.goto("https://www.linkedin.com/login")

  // eslint-disable-next-line no-console
  console.log("\n=== Manual Login Required ===")
  // eslint-disable-next-line no-console
  console.log("1. Log in to LinkedIn in the browser window")
  // eslint-disable-next-line no-console
  console.log("2. Complete any 2FA/captcha if prompted")
  // eslint-disable-next-line no-console
  console.log("3. Wait until the feed loads")
  // eslint-disable-next-line no-console
  console.log("Session will be saved automatically.\n")

  // Wait for the feed page to confirm login succeeded
  await page.waitForURL("**/feed/**", { timeout: 120_000 })

  // Give a moment for cookies to settle
  await page.waitForTimeout(2000)

  // Save the authenticated session
  await context.storageState({ path: STORAGE_STATE })

  // eslint-disable-next-line no-console
  console.log(`Session saved to ${STORAGE_STATE}`)

  await context.close()
})
