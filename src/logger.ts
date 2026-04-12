import { CONFIG } from './config'

interface LoggerParams {
  msg: string
}

/* eslint-disable no-console */
export const debug = (params: LoggerParams) => {
  const { msg } = params

  if (CONFIG.logging.enabled && CONFIG.logging.level === 'debug') {
    console.log(`[DEBUG] ${msg}`)
  }
}

export const info = (params: LoggerParams) => {
  const { msg } = params

  if (CONFIG.logging.enabled && ['debug', 'info'].includes(CONFIG.logging.level)) {
    console.log(`LinkedIn Scraper: ${msg}`)
  }
}

export const warn = (params: LoggerParams) => {
  const { msg } = params

  if (CONFIG.logging.enabled && ['debug', 'info', 'warn'].includes(CONFIG.logging.level)) {
    console.warn(`LinkedIn Scraper: ${msg}`)
  }
}

export const error = (params: LoggerParams) => {
  const { msg } = params

  if (CONFIG.logging.enabled) {
    console.error(`LinkedIn Scraper: ${msg}`)
  }
}
/* eslint-enable no-console */

export const logger = {
  debug,
  info,
  warn,
  error,
}
