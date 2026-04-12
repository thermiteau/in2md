export const htmlToMarkdown = (params: { node: Node }): string => {
  const { node } = params

  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '')
      .replace(/\p{Extended_Pictographic}\s*/gu, '')
      .replace(/ {2,}/g, ' ')
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement

  const tag = el.tagName.toLowerCase()

  // Skip the "more" button
  if (tag === 'button' && el.getAttribute('data-testid') === 'expandable-text-button') {
    return ''
  }

  // Skip visually-hidden elements (e.g. "hashtag" prefix in hashtag links)
  if (el.classList.contains('visually-hidden')) {
    return ''
  }

  const childText = Array.from(el.childNodes)
    .map((child) => htmlToMarkdown({ node: child }))
    .join('')

  if (tag === 'br') return '\n'

  if (tag === 'strong' || tag === 'b') return `**${childText}**`

  if (tag === 'em' || tag === 'i') return `*${childText}*`

  if (tag === 'a') {
    const href = el.getAttribute('href') || ''

    // Hashtag links — just return the text
    if (href.includes('HASH_TAG_FROM_FEED')) return childText

    if (href) return `[${childText}](${href})`
  }

  return childText
}
