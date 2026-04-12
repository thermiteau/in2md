import { copyToClipboard } from './clipboard'
import { saveToFile } from './file'

const MENU_STYLE = [
  'position: absolute',
  'z-index: 10000',
  'background: white',
  'border: 1px solid #e0e0e0',
  'border-radius: 8px',
  'box-shadow: 0 4px 12px rgba(0,0,0,0.15)',
  'padding: 4px 0',
  'min-width: 120px',
].join(';')

const MENU_ITEM_STYLE = [
  'display: block',
  'width: 100%',
  'padding: 8px 16px',
  'font-size: 13px',
  'font-weight: 500',
  'color: #333',
  'background: transparent',
  'border: none',
  'cursor: pointer',
  'text-align: left',
  'line-height: 1.4',
].join(';')

export const showExtractMenu = (params: {
  anchorEl: HTMLButtonElement
  markdown: string
  filename: string
  onDone: (label: string) => void
}) => {
  const { anchorEl, markdown, filename, onDone } = params

  // Remove any existing menu
  document.querySelectorAll('[data-la-menu]').forEach((el) => el.remove())

  const menu = document.createElement('div')
  menu.setAttribute('data-la-menu', 'true')
  menu.style.cssText = MENU_STYLE

  const copyItem = document.createElement('button')
  copyItem.type = 'button'
  copyItem.textContent = 'Copy'
  copyItem.style.cssText = MENU_ITEM_STYLE

  copyItem.addEventListener('mouseenter', () => {
    copyItem.style.background = 'rgba(10, 102, 194, 0.08)'
  })

  copyItem.addEventListener('mouseleave', () => {
    copyItem.style.background = 'transparent'
  })

  copyItem.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    menu.remove()

    copyToClipboard({ text: markdown })
      .then((ok) => onDone(ok ? 'Copied!' : 'Failed'))
      .catch(() => onDone('Failed'))
  })

  const saveItem = document.createElement('button')
  saveItem.type = 'button'
  saveItem.textContent = 'Save'
  saveItem.style.cssText = MENU_ITEM_STYLE

  saveItem.addEventListener('mouseenter', () => {
    saveItem.style.background = 'rgba(10, 102, 194, 0.08)'
  })

  saveItem.addEventListener('mouseleave', () => {
    saveItem.style.background = 'transparent'
  })

  saveItem.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    menu.remove()

    saveToFile({
      text: markdown,
      filename,
    })
    onDone('Saved!')
  })

  menu.appendChild(copyItem)
  menu.appendChild(saveItem)

  // Position relative to the button
  anchorEl.style.position = 'relative'
  anchorEl.insertAdjacentElement('afterend', menu)

  const rect = anchorEl.getBoundingClientRect()
  menu.style.position = 'fixed'
  menu.style.left = `${rect.left}px`
  menu.style.top = `${rect.bottom + 4}px`

  // Close menu on outside click
  const closeHandler = (ev: MouseEvent) => {
    if (!menu.contains(ev.target as Node)) {
      menu.remove()
      document.removeEventListener('click', closeHandler, true)
    }
  }

  // Delay adding the listener so this click doesn't immediately close it
  setTimeout(() => {
    document.addEventListener('click', closeHandler, true)
  }, 0)
}
