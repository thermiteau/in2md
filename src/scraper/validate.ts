import { CONFIG } from '../config'
import { logger } from '../logger'

export const validatePage = (params: { waitForPosts: boolean }): Promise<boolean> => {
  const { waitForPosts } = params

  return new Promise((resolve) => {
    const url = window.location.href

    if (!url.includes('linkedin.com')) {
      logger.error({ msg: 'Not on LinkedIn page' })
      resolve(false)
      return
    }

    if (!url.includes('/search/results/')) {
      logger.warn({ msg: 'Not on LinkedIn search results page. This might not work as expected.' })
    }

    if (document.readyState !== 'complete') {
      logger.warn({ msg: 'Page not fully loaded yet' })
      resolve(false)
      return
    }

    const posts = document.querySelectorAll(CONFIG.selectors.postContainer)

    if (posts.length > 0) {
      logger.info({ msg: `Page validated. Found ${posts.length} post containers.` })
      resolve(true)
      return
    }

    if (!waitForPosts) {
      logger.warn({ msg: 'No post containers found.' })
      resolve(false)
      return
    }

    let retries = 0

    const maxRetries = 5

    const retryInterval = setInterval(() => {
      retries++

      const found = document.querySelectorAll(CONFIG.selectors.postContainer)

      if (found.length > 0) {
        clearInterval(retryInterval)
        logger.info({ msg: `Page validated after ${retries} retries. Found ${found.length} post containers.` })
        resolve(true)
      } else if (retries >= maxRetries) {
        clearInterval(retryInterval)
        logger.warn({
          msg: 'No post containers found after retries. Starting anyway — posts may appear after scrolling.',
        })
        resolve(true)
      }
    }, 1000)
  })
}
