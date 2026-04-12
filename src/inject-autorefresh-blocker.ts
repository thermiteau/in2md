// Inject the autorefresh blocker into LinkedIn's page world.
// Content scripts run in an isolated world and cannot intercept page-level
// fetch calls, so we inject a <script> tag that runs in the main world.

const injectBlocker = () => {
  const scriptUrl = chrome.runtime.getURL('block-autorefresh.js')

  const script = document.createElement('script')
  script.src = scriptUrl
  script.type = 'text/javascript'
  ;(document.head || document.documentElement).appendChild(script)
  script.addEventListener('load', () => {
    script.remove()
  })
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectBlocker()
} else {
  document.addEventListener('DOMContentLoaded', () => {
    injectBlocker()
  })
}
