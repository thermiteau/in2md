import { CONFIG } from '../config'
import { logger } from '../logger'
import type { ScrapedPost, ScraperMessage, ScraperStatus } from '../types'
import { validatePage } from './validate'
import { extractPostData, postKey } from './extract'
import { downloadJSON } from './download'

let scrapeTimeout: ReturnType<typeof setTimeout> | null = null
let isScraping = false
let scrapedData: ScrapedPost[] = []
let processedPosts = new Set<string>()

const getRandomScrollDelay = (): number => {
  if (CONFIG.enableHumanLikeScrolling) {
    return Math.random() * (CONFIG.maxScrollDelay - CONFIG.minScrollDelay) + CONFIG.minScrollDelay
  }

  return CONFIG.scrollInterval
}

const stopScraping = () => {
  if (scrapeTimeout) {
    clearTimeout(scrapeTimeout)
    scrapeTimeout = null
  }

  isScraping = false
}

const startScraping = () => {
  let lastScrollHeight = document.documentElement.scrollHeight
  let staleScrollCount = 0

  const maxStaleScrolls = 5

  const scrapeAndScroll = () => {
    if (!isScraping) return

    try {
      const posts = document.querySelectorAll(CONFIG.selectors.postContainer)
      let newPostsFound = false

      logger.debug({ msg: `Found ${posts.length} post containers on page` })

      posts.forEach((post, index) => {
        const nameElement = post.querySelector(CONFIG.selectors.actorTitle)

        const summaryElement = post.querySelector(CONFIG.selectors.postText)

        if (!nameElement || !summaryElement) {
          logger.debug({ msg: `Post ${index} missing name or summary elements` })
          return
        }

        const name = nameElement.textContent?.trim() || ''

        const summary = summaryElement.textContent?.trim() || ''

        if (!name || !summary) {
          logger.debug({ msg: `Post ${index} has empty name or summary` })
          return
        }

        const dedupKey = postKey({
          name,
          summary,
        })

        if (processedPosts.has(dedupKey)) {
          logger.debug({ msg: `Post ${index} already processed: ${name}` })
          return
        }

        try {
          const entries: ScrapedPost[] = []

          const primaryData = extractPostData({
            container: post,
            isReshare: false,
          })

          if (primaryData) {
            entries.push(primaryData)
            logger.debug({ msg: `Extracted primary post: ${primaryData.name}` })
          }

          let resharedContent: Element | null = null

          for (const selector of CONFIG.selectors.resharedContent) {
            resharedContent = post.querySelector(selector)

            if (resharedContent) {
              logger.debug({ msg: `Found reshared content with selector: ${selector}` })
              break
            }
          }

          if (resharedContent) {
            const resharedActor = resharedContent.querySelector('.update-components-actor__container')

            if (resharedActor) {
              const resharedData = extractPostData({
                container: resharedActor,
                isReshare: true,
              })

              if (resharedData) {
                entries.push(resharedData)
                logger.debug({ msg: `Extracted reshared post: ${resharedData.name}` })
              }
            } else {
              const resharedData = extractPostData({
                container: resharedContent,
                isReshare: true,
              })

              if (resharedData) {
                entries.push(resharedData)
                logger.debug({ msg: `Extracted reshared post (fallback): ${resharedData.name}` })
              }
            }
          }

          for (const entry of entries) {
            const entryKey = postKey({
              name: entry.name,
              summary: entry.summary,
            })

            if (!processedPosts.has(entryKey)) {
              scrapedData.push(entry)
              processedPosts.add(entryKey)
              newPostsFound = true
              logger.info({ msg: `Found new post: ${entry.name} - ${entry.summary.substring(0, 50)}...` })
            }
          }

          processedPosts.add(dedupKey)
          logger.debug({ msg: `Marked post as processed: ${dedupKey.substring(0, 60)}` })
        } catch (err) {
          logger.warn({ msg: `Error processing post ${index}: ${(err as Error).message}` })
        }
      })

      logger.info({
        msg: `Found ${scrapedData.length}/${CONFIG.captureCount} posts (${posts.length} containers on page)`,
      })

      if (scrapedData.length >= CONFIG.captureCount) {
        stopScraping()
        logger.info({ msg: 'Target reached, downloading data...' })
        downloadJSON({ data: scrapedData })
        return
      }

      const currentScrollHeight = document.documentElement.scrollHeight

      if (currentScrollHeight === lastScrollHeight && !newPostsFound) {
        staleScrollCount++
        logger.debug({ msg: `No new content detected (${staleScrollCount}/${maxStaleScrolls})` })

        if (staleScrollCount >= maxStaleScrolls) {
          stopScraping()
          logger.warn({
            msg: `No new content after ${maxStaleScrolls} scroll attempts. Stopping with ${scrapedData.length} posts.`,
          })

          if (scrapedData.length > 0) {
            downloadJSON({ data: scrapedData })
          }

          return
        }
      } else {
        staleScrollCount = 0
        lastScrollHeight = currentScrollHeight
      }

      let scrollDistance = CONFIG.scrollLength

      if (CONFIG.enableHumanLikeScrolling) {
        const variation = (Math.random() - 0.5) * 2 * CONFIG.scrollVariation
        scrollDistance = Math.round(scrollDistance * (1 + variation))
      }

      if (newPostsFound) {
        logger.debug({ msg: `Scrolling by ${scrollDistance}px (new posts found)` })
        window.scrollBy(0, scrollDistance)
      } else {
        const extraScroll = Math.round(scrollDistance * 1.5)
        logger.debug({ msg: `Scrolling by ${extraScroll}px (no new posts)` })
        window.scrollBy(0, extraScroll)
      }

      const delay = getRandomScrollDelay()
      logger.debug({ msg: `Next scrape in ${Math.round(delay)}ms` })
      scrapeTimeout = setTimeout(scrapeAndScroll, delay)
    } catch (err) {
      logger.error({ msg: `Error in scraping cycle: ${(err as Error).message}` })

      const delay = getRandomScrollDelay()
      scrapeTimeout = setTimeout(scrapeAndScroll, delay)
    }
  }

  scrapeAndScroll()
}

export const registerMessageListener = () => {
  chrome.runtime.onMessage.addListener(
    (
      message: ScraperMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: ScraperStatus) => void,
    ) => {
      if (message.action === 'start') {
        if (!isScraping) {
          validatePage({ waitForPosts: true })
            .then((valid) => {
              if (!valid) {
                logger.error({ msg: 'Cannot start scraping - page validation failed' })
                return
              }

              isScraping = true
              scrapedData = []
              processedPosts = new Set()
              startScraping()
              logger.info({ msg: 'Started' })
            })
            .catch((err: Error) => {
              logger.error({ msg: `Validation error: ${err.message}` })
            })
        }

        return true
      } else if (message.action === 'stop') {
        if (isScraping) {
          stopScraping()

          if (scrapedData.length > 0 && CONFIG.saveOnManualStop) {
            logger.info({ msg: `Stopped manually. Saving ${scrapedData.length} posts...` })
            downloadJSON({ data: scrapedData })
          } else if (scrapedData.length > 0) {
            logger.info({
              msg: `Stopped manually. ${scrapedData.length} posts collected but not saved (saveOnManualStop disabled).`,
            })
          } else {
            logger.info({ msg: 'Stopped - no data collected' })
          }
        }
      } else if (message.action === 'status') {
        sendResponse({
          isScraping,
          postsCollected: scrapedData.length,
          targetCount: CONFIG.captureCount,
          progress: `${scrapedData.length}/${CONFIG.captureCount}`,
        })
      }
    },
  )
}
