export const saveToFile = (params: { text: string; filename: string }) => {
  const { text, filename } = params

  const blob = new Blob([text], { type: 'text/markdown' })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const generateFilename = (params: { actorName: string; content?: string }): string => {
  const { actorName, content } = params

  const nameParts = actorName.trim().split(/\s+/)

  const firstName = nameParts[0] || 'unknown'

  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

  let title = ''

  if (content) {
    // Take first ~50 chars of content, cut at word boundary
    const stripped = content
      .replace(/[*_#[\]()]/g, '')
      .replace(/\n/g, ' ')
      .trim()

    const truncated = stripped.length > 50 ? stripped.slice(0, 50).replace(/\s+\S*$/, '') : stripped

    title = truncated
  }

  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const parts = [sanitize(firstName)]

  if (lastName) parts.push(sanitize(lastName))

  if (title) parts.push(sanitize(title))

  return parts.join('-') + '.md'
}
