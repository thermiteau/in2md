const BASE_STYLE = [
  'color: #e61c1c',
  'background: transparent',
  'border: 1px solid #ef0a0a',
  'border-radius: 5px',
  'cursor: pointer',
  'width: 100%',
  'display: inline-block',
  'padding: 4px',
].join(';')

export const createExtractButton = (params: {
  dataAttr: string
  label: string
  extraStyle?: string
}): HTMLButtonElement => {
  const { dataAttr, label, extraStyle } = params

  const btn = document.createElement('button')
  btn.setAttribute(dataAttr, 'true')
  btn.type = 'button'
  btn.textContent = label
  btn.style.cssText = `${BASE_STYLE};${extraStyle}`

  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(10, 102, 194, 0.1)'
  })

  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'transparent'
  })

  return btn
}
