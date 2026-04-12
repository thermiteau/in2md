import { createExtractButton, generateFilename, normalizeProfileUrl, showExtractMenu } from '../lib'
import type { ActorAriaData, ActorData } from '../types'

const EXTRACT_USER_BUTTON_ATTR = 'data-la-extract'

const USER_BUTTON_TEXT = 'Get User'

// LinkedIn uses different aria-label formats on the actor info div:
// - "Name ProfileType Profile Distance" (e.g. "David Cheal Premium Profile 2nd")
// - "Name, Open to work  Distance" (e.g. "David Cheal, Open to work  3rd+")
// - "Name  Distance" (e.g. "David Cheal  3rd+") — no profile type at all
export const ACTOR_INFO_SELECTOR =
  '[aria-label*="Profile"], [aria-label*="Open to work"], [aria-label*="1st"], [aria-label*="2nd"], [aria-label*="3rd"]'

export const parseActorAriaLabel = (params: { label: string | null }): ActorAriaData | null => {
  const { label } = params

  if (!label) return null

  const normalized = label.replace(/\s+/g, ' ').trim()

  const match = normalized.match(/^(.+?)\s+(Premium|Verified|Basic|Open|Creator)\s+Profile(?:\s+(1st|2nd|3rd\+?))?$/)

  if (match) {
    return {
      name: match[1].trim(),
      profileType: match[2],
      connectionDistance: match[3] || null,
    }
  }

  const fallback = normalized.match(/^(.+?)\s+Profile(?:\s+(1st|2nd|3rd\+?))?$/)

  if (fallback) {
    return {
      name: fallback[1].trim(),
      profileType: null,
      connectionDistance: fallback[2] || null,
    }
  }

  // "Open to work" format: "Name, Open to work  Distance"
  const openToWork = normalized.match(/^(.+?),\s+Open to work\s*(1st|2nd|3rd\+?)?\s*$/)

  if (openToWork) {
    return {
      name: openToWork[1].trim(),
      profileType: 'Open to work',
      connectionDistance: openToWork[2] || null,
    }
  }

  // Bare format: "Name  Distance" (no profile type keyword)
  const bare = normalized.match(/^(.+?)\s+(1st|2nd|3rd\+?)\s*$/)

  if (bare) {
    return {
      name: bare[1].trim(),
      profileType: null,
      connectionDistance: bare[2] || null,
    }
  }

  return null
}

export const extractActorData = (params: { actorAnchor: HTMLAnchorElement }): ActorData | null => {
  const { actorAnchor } = params

  const profileUrl = actorAnchor.getAttribute('href') || ''

  const ariaDiv = actorAnchor.querySelector(ACTOR_INFO_SELECTOR)

  const ariaData = ariaDiv ? parseActorAriaLabel({ label: ariaDiv.getAttribute('aria-label') }) : null

  let name = ''

  if (ariaDiv) {
    const nameEl = ariaDiv.querySelector('p')

    if (nameEl) {
      name = nameEl.textContent?.trim() || ''
    }
  }

  let title = ''

  const container = ariaDiv ? ariaDiv.parentElement : actorAnchor

  if (container && ariaDiv) {
    const allPs = container.querySelectorAll('p')

    for (const p of allPs) {
      const text = p.textContent?.trim() || ''

      if (text && text !== name && !ariaDiv.contains(p)) {
        title = text
        break
      }
    }
  }

  if (!title && ariaDiv) {
    let sibling = ariaDiv.nextElementSibling

    while (sibling) {
      const p = sibling.querySelector('p')

      if (p) {
        const text = p.textContent?.trim() || ''

        if (text && !/^\d+[hmd]\s*•/.test(text) && text.length > 5) {
          title = text
          break
        }
      }

      sibling = sibling.nextElementSibling
    }
  }

  if (!name && !ariaData) return null

  const hasVerifiedSvg = !!actorAnchor.querySelector('svg#verified-small')

  const profileType = ariaData?.profileType ?? null

  const verified = hasVerifiedSvg || profileType === 'Verified'

  return {
    name: name || ariaData?.name || '',
    title,
    profileUrl: normalizeProfileUrl(profileUrl),
    profileType,
    connectionDistance: ariaData?.connectionDistance ?? null,
    verified,
  }
}

// Extract actor data from a classic actor anchor (a.update-components-actor__meta-link).
// Used for individual post pages and search results feed.
export const extractActorDataFromClassicAnchor = (params: { anchor: HTMLAnchorElement }): ActorData | null => {
  const { anchor } = params

  const nameEl = anchor.querySelector('.update-components-actor__title span[aria-hidden="true"]')

  const name = nameEl?.textContent?.trim() || ''

  if (!name) return null

  const titleEl = anchor.querySelector('.update-components-actor__description span[aria-hidden="true"]')

  const title = titleEl?.textContent?.trim() || ''

  const profileUrl = normalizeProfileUrl(anchor.getAttribute('href') || '')

  const supp = anchor.querySelector('.update-components-actor__supplementary-actor-info')

  let connectionDistance: string | null = null

  if (supp) {
    const m = supp.textContent?.match(/(1st|2nd|3rd\+?)/)

    if (m) connectionDistance = m[1]
  }

  const ariaLabel = anchor.getAttribute('aria-label') || ''

  let profileType: string | null = null

  if (/\bPremium\b/i.test(ariaLabel)) profileType = 'Premium'
  else if (/\bVerified\b/i.test(ariaLabel)) profileType = 'Verified'

  const hasVerifiedSvg = !!anchor.querySelector('svg[data-test-icon="verified-small"]')

  return {
    name,
    title,
    profileUrl,
    profileType,
    connectionDistance,
    verified: hasVerifiedSvg || profileType === 'Verified',
  }
}

// Fallback: extract actor data from classic LinkedIn DOM (individual post pages).
// Finds the first classic actor anchor in the container and delegates.
export const extractActorDataClassic = (params: { postContainer: Element }): ActorData | null => {
  const { postContainer } = params

  const anchor = postContainer.querySelector<HTMLAnchorElement>('a.update-components-actor__meta-link')

  if (anchor) return extractActorDataFromClassicAnchor({ anchor })

  // Legacy path: containers that only have the image link, not the meta-link
  const nameEl = postContainer.querySelector('.update-components-actor__title span[aria-hidden="true"]')

  const name = nameEl?.textContent?.trim() || ''

  if (!name) return null

  const titleEl = postContainer.querySelector('.update-components-actor__description span[aria-hidden="true"]')

  const title = titleEl?.textContent?.trim() || ''

  const actorLink = postContainer.querySelector<HTMLAnchorElement>('a.update-components-actor__image')

  const profileUrl = normalizeProfileUrl(actorLink?.getAttribute('href') || '')

  return {
    name,
    title,
    profileUrl,
    profileType: null,
    connectionDistance: null,
    verified: false,
  }
}

export const formatAsMarkdown = (params: { data: ActorData }): string => {
  const { data } = params

  const lines = [`**${data.name}**`]

  if (data.title) lines.push(`- Title: ${data.title}`)

  if (data.profileUrl) lines.push(`- Profile: [Profile](${data.profileUrl})`)

  if (data.profileType) lines.push(`- Profile Type: ${data.profileType}`)

  if (data.verified) {
    lines.push('- Verified: true')
  } else {
    lines.push('- Verified: false')
  }

  if (data.connectionDistance) {
    lines.push(`- Distance: ${data.connectionDistance}`)
  }

  return lines.join('\n')
}

const createActorButton = (params: { extractFn: () => ActorData | null }): HTMLButtonElement => {
  const { extractFn } = params

  const btn = createExtractButton({
    dataAttr: EXTRACT_USER_BUTTON_ATTR,
    label: USER_BUTTON_TEXT,
    extraStyle: 'max-width: 80px',
  })

  btn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const data = extractFn()

    if (!data) {
      btn.textContent = 'No data'
      setTimeout(() => {
        btn.textContent = USER_BUTTON_TEXT
      }, 2000)
      return
    }

    const md = formatAsMarkdown({ data })

    const filename = generateFilename({ actorName: data.name })

    showExtractMenu({
      anchorEl: btn,
      markdown: md,
      filename,
      onDone: (label) => {
        btn.textContent = label
        setTimeout(() => {
          btn.textContent = USER_BUTTON_TEXT
        }, 2000)
      },
    })
  })

  return btn
}

export const createExtractActorButton = (params: { actorAnchor: HTMLAnchorElement }): HTMLButtonElement => {
  return createActorButton({
    extractFn: () => extractActorData({ actorAnchor: params.actorAnchor }),
  })
}

export const createExtractActorButtonClassic = (params: { anchor: HTMLAnchorElement }): HTMLButtonElement => {
  return createActorButton({
    extractFn: () => extractActorDataFromClassicAnchor({ anchor: params.anchor }),
  })
}

export const findClassicActorAnchors = (): HTMLAnchorElement[] => {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('a.update-components-actor__meta-link')

  const results: HTMLAnchorElement[] = []

  for (const anchor of anchors) {
    if (anchor.querySelector(ACTOR_INFO_SELECTOR)) continue

    const meta = anchor.closest('.update-components-actor__meta') || anchor.parentElement

    if (meta?.querySelector(`[${EXTRACT_USER_BUTTON_ATTR}]`)) continue

    if (!anchor.querySelector('.update-components-actor__title span[aria-hidden="true"]')) continue

    results.push(anchor)
  }

  return results
}

export const findActorAnchors = (): HTMLAnchorElement[] => {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href*="/in/"]')

  const results: HTMLAnchorElement[] = []

  for (const anchor of anchors) {
    const ariaDiv = anchor.querySelector(ACTOR_INFO_SELECTOR)

    if (!ariaDiv) continue

    if (anchor.parentElement?.querySelector(`[${EXTRACT_USER_BUTTON_ATTR}]`)) {
      continue
    }

    results.push(anchor)
  }

  return results
}
