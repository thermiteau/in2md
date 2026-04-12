import { startObservingFeed } from './inject'

if (window.location.hostname.includes('linkedin.com')) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startObservingFeed()
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      startObservingFeed()
    })
  }
}
