// Block LinkedIn's feed autorefresh.
//
// LinkedIn triggers a feed refresh when the tab regains focus after being
// backgrounded. The request is a POST to the pagination endpoint with
// sessionEventTrigger:"AutoRefresh" and requestType:"Refresh" in the body.
//
// This script must run in the PAGE world (not the content script isolated
// world) so it can intercept fetch calls made by LinkedIn's own code.

const BLOCKED_MARKERS = ['"AutoRefresh"', '"requestType":"Refresh"']

const originalFetch = window.fetch

const patchedFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method?.toUpperCase() === 'POST' && init.body) {
    const body = typeof init.body === 'string' ? init.body : null

    if (body) {
      const isAutoRefresh = BLOCKED_MARKERS.every((marker) => body.includes(marker))

      if (isAutoRefresh) {
        // eslint-disable-next-line no-console
        console.log(
          '[in2md] Blocked autorefresh request:',
          typeof input === 'string' ? input.substring(0, 100) : 'Request',
        )
        return Promise.resolve(
          new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }
    }
  }

  return originalFetch.call(window, input, init) as ReturnType<typeof fetch>
}

window.fetch = patchedFetch
// eslint-disable-next-line no-console
console.log('[in2md] Autorefresh blocker active')
