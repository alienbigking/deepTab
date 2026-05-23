// Deep Tab uses chrome_url_overrides.newtab for the main experience.
// The service worker is intentionally small: it only keeps install/update
// lifecycle logging and avoids the old auto-refresh timer runtime.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Deep Tab extension installed or updated')
})
