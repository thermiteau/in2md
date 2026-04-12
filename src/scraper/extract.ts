import { CONFIG } from '../config'
import { logger } from '../logger'
import type { ScrapedPost } from '../types'

export const extractArticleUrl = (params: { container: Element }): string => {
  const { container } = params

  try {
    const links = Array.from(container.querySelectorAll(CONFIG.selectors.articleLink))

    for (const link of links) {
      const href = link.getAttribute('href')

      if (
        href &&
        href.includes(CONFIG.urlPatterns.pulseArticle) &&
        !CONFIG.urlPatterns.excludePatterns.some((pattern) => href.includes(pattern))
      ) {
        return href.startsWith('https') ? href : `https://www.linkedin.com${href}`
      }
    }
  } catch (err) {
    logger.warn({ msg: `Error extracting article URL: ${(err as Error).message}` })
  }

  return ''
}

export const extractPostData = (params: { container: Element; isReshare: boolean }): ScrapedPost | null => {
  const { container, isReshare } = params

  try {
    const name = container.querySelector(CONFIG.selectors.actorTitle)?.textContent?.trim() || ''

    const role = container.querySelector(CONFIG.selectors.actorDescription)?.textContent?.trim() || ''

    const summary = container.querySelector(CONFIG.selectors.postText)?.textContent?.trim() || ''

    const articleUrl = extractArticleUrl({ container })

    if (name && summary) {
      return {
        name,
        role,
        summary,
        articleUrl,
        isReshare,
      }
    }
  } catch (err) {
    logger.warn({ msg: `Error extracting post data: ${(err as Error).message}` })
  }

  return null
}

export const postKey = (params: { name: string; summary: string }): string => {
  const { name, summary } = params

  return `${name}::${summary}`
}
