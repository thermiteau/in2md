import { createExtractButton, generateFilename, htmlToMarkdown, normalizeProfileUrl, showExtractMenu } from '../lib'
import type { CommentData } from '../types'

const EXTRACT_COMMENTS_BUTTON_ATTR = 'data-la-extract-comments'

const COMMENTS_BUTTON_TEXT = 'Get Coments'

export const extractSingleComment = (params: { commentEl: Element }): CommentData | null => {
  const { commentEl } = params

  const nameEl = commentEl.querySelector('.comments-comment-meta__description-title')

  const name = nameEl?.textContent?.trim() || ''

  if (!name) return null

  const profileLink = commentEl.querySelector<HTMLAnchorElement>('a.comments-comment-meta__description-container')

  const profileUrl = normalizeProfileUrl(profileLink?.getAttribute('href') || '')

  const contentEl = commentEl.querySelector('.comments-comment-item__main-content .update-components-text')

  const content = contentEl ? htmlToMarkdown({ node: contentEl }).trim() : ''

  const isReply = commentEl.classList.contains('comments-comment-entity--reply')

  return {
    name,
    profileUrl,
    content,
    isReply,
    replies: [],
  }
}

// Extract comments from classic DOM (single post pages)
const extractCommentsClassic = (params: { container: Element }): CommentData[] => {
  const { container } = params

  const commentList =
    container.querySelector('.comments-comment-list__container') ??
    container.querySelector('.comments-comments-list') ??
    (container.classList.contains('comments-comment-list__container') ? container : null)

  if (!commentList) return []

  const results: CommentData[] = []

  const allComments = commentList.querySelectorAll('article.comments-comment-entity')

  let currentParent: CommentData | null = null

  for (const article of allComments) {
    const comment = extractSingleComment({ commentEl: article })

    if (!comment) continue

    if (comment.isReply && currentParent) {
      currentParent.replies.push(comment)
    } else {
      currentParent = comment
      results.push(comment)
    }
  }

  return results
}

// Extract comments from feed DOM (obfuscated classes).
// Uses aria-label="View more options for <Name>'s comment." as anchor.
const extractCommentsFeed = (params: { container: Element }): CommentData[] => {
  const { container } = params

  const optionButtons = container.querySelectorAll('button[aria-label$="\u2019s comment."]')

  if (optionButtons.length === 0) return []

  const results: CommentData[] = []

  for (const btn of optionButtons) {
    const label = btn.getAttribute('aria-label') || ''

    const nameMatch = label.match(/^View more options for (.+)\u2019s comment\.$/)

    const name = nameMatch ? nameMatch[1] : ''

    const commentWrapper =
      btn.closest('[componentkey^="replaceableComment_"]') ??
      btn.closest('[componentkey*="comment"]') ??
      btn.parentElement?.parentElement?.parentElement?.parentElement?.parentElement

    if (!commentWrapper) continue

    const profileLinks = commentWrapper.querySelectorAll<HTMLAnchorElement>('a[href*="/in/"]')

    let profileUrl = ''

    for (const link of profileLinks) {
      const href = link.getAttribute('href') || ''

      if (href.includes('/in/')) {
        profileUrl = normalizeProfileUrl(href)
        break
      }
    }

    const textBox = commentWrapper.querySelector('[data-testid="expandable-text-box"]')

    const content = textBox ? htmlToMarkdown({ node: textBox }).trim() : ''

    if (name || content) {
      results.push({
        name,
        profileUrl,
        content,
        isReply: false,
        replies: [],
      })
    }
  }

  return results
}

export const extractComments = (params: { container: Element }): CommentData[] => {
  const { container } = params

  const classic = extractCommentsClassic({ container })

  if (classic.length > 0) return classic

  return extractCommentsFeed({ container })
}

export const formatCommentAsMarkdown = (params: { comment: CommentData; indent: string }): string => {
  const { comment, indent } = params

  const lines: string[] = []
  lines.push(`${indent}**${comment.name}**${comment.profileUrl ? ` ([profile](${comment.profileUrl}))` : ''}`)

  if (comment.content) {
    const indentedContent = comment.content
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n')
    lines.push(indentedContent)
  }

  for (const reply of comment.replies) {
    lines.push('')
    lines.push(
      formatCommentAsMarkdown({
        comment: reply,
        indent: indent + '> ',
      }),
    )
  }

  return lines.join('\n')
}

export const formatCommentsAsMarkdown = (params: { comments: CommentData[] }): string => {
  const { comments } = params

  const sections = comments.map((comment) =>
    formatCommentAsMarkdown({
      comment,
      indent: '',
    }),
  )

  return sections.join('\n\n---\n\n')
}

export { EXTRACT_COMMENTS_BUTTON_ATTR }

export const createExtractCommentsButton = (params: { container: Element }): HTMLButtonElement => {
  const { container } = params

  const btn = createExtractButton({
    dataAttr: EXTRACT_COMMENTS_BUTTON_ATTR,
    label: COMMENTS_BUTTON_TEXT,
    // extraStyle: 'padding: 4px 12px; margin: 8px 0; display: inline-block',
  })

  const handleExtract = () => {
    const comments = extractComments({ container })

    if (comments.length === 0) {
      btn.textContent = 'No comments'
      setTimeout(() => {
        btn.textContent = COMMENTS_BUTTON_TEXT
      }, 2000)
      return
    }

    const md = formatCommentsAsMarkdown({ comments })

    const firstCommenter = comments[0].name || 'comments'

    const filename = generateFilename({
      actorName: firstCommenter,
      content: 'comments',
    })

    showExtractMenu({
      anchorEl: btn,
      markdown: md,
      filename,
      onDone: (label) => {
        btn.textContent = label === 'Copied!' ? `Copied ${comments.length}!` : label
        setTimeout(() => {
          btn.textContent = COMMENTS_BUTTON_TEXT
        }, 2000)
      },
    })
  }

  btn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const comments = extractComments({ container })

    if (comments.length > 0) {
      handleExtract()
      return
    }

    // Comments not expanded — click the comment count trigger to load them.
    // Classic DOM: <button aria-label="N comments on X's post">.
    // Obfuscated feed DOM: <div role="button"> containing <span>N comments</span>.
    let countTrigger: HTMLElement | null = container.querySelector<HTMLButtonElement>(
      'button[aria-label*="comment"][aria-label$=" post"]',
    )

    if (!countTrigger) {
      const roleButtons = container.querySelectorAll<HTMLElement>('div[role="button"]')

      for (const candidate of roleButtons) {
        const text = candidate.querySelector('span')?.textContent?.trim() || ''

        if (/^\d+ comments?$/.test(text)) {
          countTrigger = candidate
          break
        }
      }
    }

    if (!countTrigger) {
      btn.textContent = 'No comments'
      setTimeout(() => {
        btn.textContent = COMMENTS_BUTTON_TEXT
      }, 2000)
      return
    }

    btn.textContent = '...'
    countTrigger.click()

    // Poll for comments to appear in the DOM rather than using a fixed delay.
    let attempts = 0
    const maxAttempts = 20

    const poll = () => {
      attempts++

      const loaded = extractComments({ container })

      if (loaded.length > 0) {
        handleExtract()
        return
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 250)
      } else {
        btn.textContent = 'No comments'
        setTimeout(() => {
          btn.textContent = COMMENTS_BUTTON_TEXT
        }, 2000)
      }
    }

    setTimeout(poll, 250)
  })

  return btn
}
