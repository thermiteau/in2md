import { createExtractButton, generateFilename, htmlToMarkdown, normalizeProfileUrl, showExtractMenu } from '../lib'
import type { ActorData, PostData } from '../types'
import { ACTOR_INFO_SELECTOR, extractActorData, extractActorDataClassic, formatAsMarkdown } from './actor'

const EXTRACT_POST_BUTTON_ATTR = 'data-la-extract-post'

const POST_BUTTON_TEXT = 'Get Post'

const extractContentFromNode = (params: { textNode: Element }): { content: string; hashtags: string[] } => {
  const { textNode } = params

  const content = htmlToMarkdown({ node: textNode }).trim()

  const hashtagLinks = textNode.querySelectorAll('a[href*="HASH_TAG_FROM_FEED"]')

  const hashtags: string[] = []

  for (const link of hashtagLinks) {
    const text = link.textContent?.trim() || ''

    if (text) hashtags.push(text)
  }

  let cleanContent = content

  for (const tag of hashtags) {
    cleanContent = cleanContent.replace(tag, '').trim()
  }

  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim()

  return { content: cleanContent, hashtags }
}

// Extract post content from classic DOM (individual post pages)
export const extractPostContentClassic = (params: {
  postContainer: Element
}): { content: string; hashtags: string[] } | null => {
  const { postContainer } = params

  const textNode = postContainer.querySelector('.update-components-text span.break-words')

  if (!textNode) return null

  return extractContentFromNode({ textNode })
}

export const extractPostContent = (params: {
  postContainer: Element
}): { content: string; hashtags: string[] } | null => {
  const { postContainer } = params

  const textNode = postContainer.querySelector('[data-testid="expandable-text-box"]')

  if (!textNode) return null

  return extractContentFromNode({ textNode })
}

export const formatPostAsMarkdown = (params: { data: PostData }): string => {
  const { data } = params

  const lines: string[] = [formatAsMarkdown({ data: data.actor })]

  if (data.postUrl) {
    lines.push(`- Post: [Link](${data.postUrl})`)
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(data.content)

  if (data.hashtags.length > 0) {
    lines.push('')
    lines.push(data.hashtags.join(' '))
  }

  return lines.join('\n')
}

const urnToPostUrl = (urn: string): string | null => {
  const m = urn.match(/urn:li:activity:(\d+)/)

  if (m) return `https://www.linkedin.com/feed/update/urn:li:activity:${m[1]}/`

  const s = urn.match(/urn:li:share:(\d+)/)

  if (s) return `https://www.linkedin.com/feed/update/urn:li:share:${s[1]}/`

  return null
}

// Extract the post URL. Prefers the data-urn attribute on the article element
// (available on feed and search results). Falls back to opening the control
// menu briefly to read the activity URN from Report/Embed links.
const extractPostUrl = (params: { postContainer: Element }): Promise<string | null> => {
  const { postContainer } = params

  return new Promise((resolve) => {
    const currentUrl = window.location.href

    if (currentUrl.includes('/posts/') || currentUrl.includes('/feed/update/')) {
      resolve(currentUrl)
      return
    }

    // Try data-urn on the container or nearest article ancestor/descendant
    const urnEl = postContainer.closest('[data-urn]') ?? postContainer.querySelector('[data-urn]')

    const dataUrn = urnEl?.getAttribute('data-urn') || postContainer.getAttribute('data-urn')

    if (dataUrn) {
      resolve(urnToPostUrl(dataUrn))
      return
    }

    // Fallback: open the control menu to find the URN
    const menuBtn = postContainer.querySelector<HTMLButtonElement>(
      'button[aria-label^="Open control menu for post by "]',
    )

    if (!menuBtn) {
      resolve(null)
      return
    }

    menuBtn.click()

    setTimeout(() => {
      const menu = document.querySelector('[role="menu"]')

      let postUrl: string | null = null

      if (menu) {
        const reportLink = menu.querySelector<HTMLAnchorElement>('a[href*="updateUrn="]')

        if (reportLink) {
          const href = reportLink.getAttribute('href') || ''

          const urnMatch = href.match(/updateUrn=urn%3Ali%3Aactivity%3A(\d+)/)

          if (urnMatch) {
            postUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${urnMatch[1]}/`
          }
        }

        if (!postUrl) {
          const embedLink = menu.querySelector<HTMLAnchorElement>('a[href*="targetUrn="]')

          if (embedLink) {
            const href = embedLink.getAttribute('href') || ''

            const urnMatch = href.match(/targetUrn=urn%3Ali%3Ashare%3A(\d+)/)

            if (urnMatch) {
              postUrl = `https://www.linkedin.com/feed/update/urn:li:share:${urnMatch[1]}/`
            }
          }
        }
      }

      menuBtn.click()

      resolve(postUrl)
    }, 150)
  })
}

export { EXTRACT_POST_BUTTON_ATTR }

export const createExtractPostButton = (params: { postContainer: Element }): HTMLButtonElement => {
  const { postContainer } = params

  const btn = createExtractButton({
    dataAttr: EXTRACT_POST_BUTTON_ATTR,
    label: POST_BUTTON_TEXT,
  })

  btn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Try feed-style extraction first, then classic (individual post page)
    let actor: ActorData | null = null

    const allAnchors = postContainer.querySelectorAll<HTMLAnchorElement>('a[href*="/in/"]')

    for (const a of allAnchors) {
      if (a.querySelector(ACTOR_INFO_SELECTOR)) {
        actor = extractActorData({ actorAnchor: a })
        break
      }
    }

    if (!actor) {
      actor = extractActorDataClassic({ postContainer })
    }

    // Fallback for company posts: extract name from control menu aria-label
    // and URL from company link
    if (!actor) {
      const controlBtn = postContainer.querySelector('button[aria-label^="Open control menu for post by "]')

      if (controlBtn) {
        const label = controlBtn.getAttribute('aria-label') || ''

        const nameMatch = label.match(/^Open control menu for post by (.+)$/)

        const companyName = nameMatch ? nameMatch[1] : ''

        const companyLink = postContainer.querySelector<HTMLAnchorElement>('a[href*="/company/"]')

        const companyUrl = normalizeProfileUrl(companyLink?.getAttribute('href') || '')

        if (companyName) {
          actor = {
            name: companyName,
            title: '',
            profileUrl: companyUrl,
            profileType: 'Company',
            connectionDistance: null,
            verified: false,
          }
        }
      }
    }

    if (!actor) {
      btn.textContent = 'No User'
      setTimeout(() => {
        btn.textContent = POST_BUTTON_TEXT
      }, 2000)
      return
    }

    const postContent = extractPostContent({ postContainer }) ?? extractPostContentClassic({ postContainer })

    if (!postContent) {
      btn.textContent = 'No content'
      setTimeout(() => {
        btn.textContent = POST_BUTTON_TEXT
      }, 2000)
      return
    }

    btn.textContent = '...'

    extractPostUrl({ postContainer })
      .then((postUrl) => {
        const postData: PostData = {
          actor,
          content: postContent.content,
          hashtags: postContent.hashtags,
          postUrl,
        }

        const md = formatPostAsMarkdown({ data: postData })

        const filename = generateFilename({
          actorName: actor.name,
          content: postContent.content,
        })

        btn.textContent = POST_BUTTON_TEXT

        showExtractMenu({
          anchorEl: btn,
          markdown: md,
          filename,
          onDone: (label) => {
            btn.textContent = label
            setTimeout(() => {
              btn.textContent = POST_BUTTON_TEXT
            }, 2000)
          },
        })
      })
      .catch(() => {
        btn.textContent = 'Failed'
        setTimeout(() => {
          btn.textContent = POST_BUTTON_TEXT
        }, 2000)
      })
  })

  return btn
}
