import { type BrowserContext, firefox } from "@playwright/test"
import fs from "fs"
import path from "path"

const BUILD_DIR = path.resolve(__dirname, "../../build")

const STORAGE_STATE = path.resolve(__dirname, "../.auth/linkedin.json")

// Inject the extension's content scripts into a Playwright context.
// This simulates what the extension does, minus chrome.* API calls
// which aren't available outside an extension context.
export const injectExtensionScripts = async (params: {
  context: BrowserContext
}) => {
  const { context } = params

  const blockAutorefreshJs = fs.readFileSync(
    path.join(BUILD_DIR, "block-autorefresh.js"),
    "utf-8",
  )

  const extractJs = fs.readFileSync(
    path.join(BUILD_DIR, "extract.js"),
    "utf-8",
  )

  // Autorefresh blocker runs in page world — inject early
  await context.addInitScript({ content: blockAutorefreshJs })

  // Extract script needs to run after DOM is ready, and needs
  // chrome.runtime.getManifest stubbed for popup.js compatibility.
  // The extract.js script only uses DOM APIs, no chrome.* calls.
  await context.addInitScript({
    content: `
      // Stub chrome.runtime for scripts that reference it
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }
      if (!chrome.runtime) {
        chrome.runtime = {
          getManifest: () => ({ version: 'test' }),
          getURL: (path) => path,
          onMessage: { addListener: () => {} },
        };
      }

      if (window.location.hostname.includes('linkedin.com')) {
        document.addEventListener('DOMContentLoaded', () => {
          try {
            ${extractJs}
          } catch(e) {
            console.error('[Test] extract.js error:', e.message);
          }
        });
      }
    `,
  })
}

export const loadLinkedInSession = async (params: {
  context: BrowserContext
}) => {
  const { context } = params

  if (!fs.existsSync(STORAGE_STATE)) {
    throw new Error(
      "No LinkedIn session found. Run 'make test-auth' first.",
    )
  }

  const storageState = JSON.parse(
    fs.readFileSync(STORAGE_STATE, "utf-8"),
  )

  if (storageState.cookies) {
    await context.addCookies(storageState.cookies)
  }
}

// Launch a persistent Firefox context with extension scripts injected
export const createExtensionContext = async () => {
  const context = await firefox.launchPersistentContext("", {
    headless: false,
    viewport: { width: 1280, height: 900 },
  })

  await injectExtensionScripts({ context })
  await loadLinkedInSession({ context })

  return context
}
