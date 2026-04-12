import type { Config } from './types'

export const CONFIG: Config = {
  scrollLength: 2000,
  captureCount: 20,
  scrollInterval: 3000,

  saveOnManualStop: true,

  enableHumanLikeScrolling: true,
  minScrollDelay: 2000,
  maxScrollDelay: 5000,
  scrollVariation: 0.3,

  selectors: {
    postContainer: '.fie-impression-container',
    actorTitle: '.update-components-actor__title span[aria-hidden="true"]',
    actorDescription: '.update-components-actor__description span[aria-hidden="true"]',
    postText: '.update-components-text span[dir="ltr"]',
    articleLink: 'a[data-test-app-aware-link]',
    resharedContent: [
      '.feed-shared-update-v2__reshared-update',
      '.update-components-mini-update-v2__reshared-content',
      '.feed-shared-update-v2__update-content-wrapper',
    ],
  },

  urlPatterns: {
    pulseArticle: '/pulse/',
    excludePatterns: ['/in/', '/company/', '.jpg'],
  },

  filename: {
    prefix: 'linkedin_posts',
    includeTimestamp: true,
    extension: '.json',
  },

  logging: {
    enabled: true,
    level: 'debug',
  },
}
