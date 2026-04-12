export const copyToClipboard = async (params: { text: string }): Promise<boolean> => {
  const { text } = params

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
