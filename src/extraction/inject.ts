import {
  createExtractActorButton,
  createExtractActorButtonClassic,
  findActorAnchors,
  findClassicActorAnchors,
} from './actor'
import { createExtractCommentsButton, EXTRACT_COMMENTS_BUTTON_ATTR } from './comments'
import { createExtractPostButton, EXTRACT_POST_BUTTON_ATTR } from './post'

const findPostContainer = (params: { element: Element }): Element | null => {
  const { element } = params

  let current: Element | null = element

  while (current) {
    const role = current.getAttribute('role')

    // update-v2-social-activity
    if (role === 'listitem' || role === 'article') return current
    current = current.parentElement
  }

  return null
}

const injectExtractButtons = () => {
  const anchors = findActorAnchors()

  for (const anchor of anchors) {
    const btn = createExtractActorButton({ actorAnchor: anchor })

    const parent = anchor.parentElement

    if (parent) {
      // Look for Follow or Connect action button
      const actionBtn = parent.querySelector('button[aria-label^="Follow "], button[aria-label^="Invite "]')

      if (actionBtn?.parentElement) {
        actionBtn.parentElement.insertBefore(btn, actionBtn.nextSibling)
      } else {
        anchor.insertAdjacentElement('afterend', btn)
      }
    }
  }

  // Inject Get User buttons for classic actor anchors (individual post pages,
  // search results feed). These use update-components-actor__* classes where
  // the aria-label lives on the anchor itself, not a child element.
  const classicAnchors = findClassicActorAnchors()

  for (const anchor of classicAnchors) {
    const btn = createExtractActorButtonClassic({ anchor })

    // Insert after the anchor (never inside — nested buttons in anchors are
    // invalid and the anchor would navigate on click).
    anchor.insertAdjacentElement('afterend', btn)
  }

  // Inject E:Post buttons below post text content (feed pages)
  const textBoxes = document.querySelectorAll('[data-testid="expandable-text-box"]')

  for (const textBox of textBoxes) {
    const containingP = textBox.closest('p')

    if (!containingP) continue

    const postContainer = findPostContainer({ element: textBox })

    if (!postContainer) continue

    if (postContainer.querySelector(`[${EXTRACT_POST_BUTTON_ATTR}]`)) continue

    const btn = createExtractPostButton({ postContainer })
    containingP.insertAdjacentElement('afterend', btn)
  }

  // Inject E:Post buttons on individual post pages (classic DOM)
  const articles = document.querySelectorAll('[role="article"]')

  for (const article of articles) {
    if (article.querySelector(`[${EXTRACT_POST_BUTTON_ATTR}]`)) continue

    // Must have classic actor and text content
    const hasActor = !!article.querySelector('.update-components-actor__title')

    const hasText = !!article.querySelector('.update-components-text')

    if (!hasActor || !hasText) continue

    const btn = createExtractPostButton({ postContainer: article })

    // Insert at the top of the post, before the actor section
    const actorContainer = article.querySelector('.feed-shared-update-v2__control-menu-container')

    if (actorContainer) {
      actorContainer.insertAdjacentElement('beforebegin', btn)
    } else {
      article.prepend(btn)
    }
  }

  // Inject Get Comments buttons.
  // All paths deduplicate at the postContainer level to prevent multiple
  // buttons when nested classic comment lists or multiple detection paths match.

  // 1. Comment count buttons — posts where comments are not yet expanded.
  //    Matches "N comment(s) on Name's post" with both possessive forms:
  //    - "Name's post" (name not ending in s)
  //    - "Names' post" (name ending in s, no extra s after apostrophe)
  const commentCountBtns = document.querySelectorAll<HTMLButtonElement>(
    'button[aria-label*="comment"][aria-label$=" post"]',
  )

  for (const countBtn of commentCountBtns) {
    const label = countBtn.getAttribute('aria-label') || ''

    if (!/\d+ comments? on .+[\u2019']s? post$/.test(label)) continue

    const postContainer = findPostContainer({ element: countBtn })

    if (!postContainer) continue

    if (postContainer.querySelector(`[${EXTRACT_COMMENTS_BUTTON_ATTR}]`)) continue

    const btn = createExtractCommentsButton({ container: postContainer })

    // Insert before the social action bar (Like/Comment/Repost/Send) for
    // consistent placement between the counts row and the action buttons.
    const actionBar = postContainer.querySelector('.feed-shared-social-action-bar')

    if (actionBar) {
      actionBar.insertAdjacentElement('beforebegin', btn)
    } else {
      countBtn.insertAdjacentElement('afterend', btn)
    }
  }

  // 2. Classic DOM comment lists (expanded comments on feed and single post pages).
  //    .comments-comments-list contains .comments-comment-list__container, so both
  //    match — the postContainer-level check prevents injecting two buttons.
  const classicCommentLists = document.querySelectorAll('.comments-comment-list__container, .comments-comments-list')

  for (const commentList of classicCommentLists) {
    const parent = commentList.parentElement

    if (!parent) continue

    const postContainer = findPostContainer({ element: commentList })

    if (!postContainer) continue

    if (postContainer.querySelector(`[${EXTRACT_COMMENTS_BUTTON_ATTR}]`)) continue

    const btn = createExtractCommentsButton({ container: parent })
    commentList.insertAdjacentElement('beforebegin', btn)
  }

  // 3. Obfuscated feed DOM — the "N comments" count is a div[role="button"]
  //    containing a span with visible text like "22 comments". No aria-label,
  //    no classic .comments-* classes. Match on the visible text instead.
  const roleButtons = document.querySelectorAll<HTMLElement>('div[role="button"]')

  for (const candidate of roleButtons) {
    const span = candidate.querySelector('span')
    const text = span?.textContent?.trim() || ''

    if (!/^\d+ comments?$/.test(text)) continue

    const postContainer = findPostContainer({ element: candidate })

    if (!postContainer) continue

    if (postContainer.querySelector(`[${EXTRACT_COMMENTS_BUTTON_ATTR}]`)) continue

    const btn = createExtractCommentsButton({ container: postContainer })
    candidate.insertAdjacentElement('afterend', btn)
  }
}

export const startObservingFeed = (): MutationObserver => {
  injectExtractButtons()

  const observer = new MutationObserver(() => {
    injectExtractButtons()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return observer
}
