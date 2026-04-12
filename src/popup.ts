const manifest = chrome.runtime.getManifest()

const versionEl = document.getElementById('version')

if (versionEl) {
  versionEl.textContent = `ver: ${manifest.version}`
}
