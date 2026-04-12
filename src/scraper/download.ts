import { CONFIG } from '../config'
import { logger } from '../logger'
import type { ScrapedPost } from '../types'

export const downloadJSON = (params: { data: ScrapedPost[] }) => {
  const { data } = params

  try {
    let filename = CONFIG.filename.prefix

    if (CONFIG.filename.includeTimestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      filename += `_${timestamp}`
    }

    filename += CONFIG.filename.extension

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    setTimeout(() => URL.revokeObjectURL(url), 60_000)

    logger.info({ msg: `Downloaded ${data.length} posts to ${filename}` })
  } catch (err) {
    logger.error({ msg: `Error downloading JSON: ${(err as Error).message}` })
  }
}
