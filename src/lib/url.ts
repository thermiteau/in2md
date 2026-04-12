export const normalizeProfileUrl = (raw: string): string => {
  let url = raw

  if (url.includes('?')) {
    url = url.split('?')[0]
  }

  if (url && !url.startsWith('https')) {
    url = `https://www.linkedin.com${url}`
  }

  return url
}
