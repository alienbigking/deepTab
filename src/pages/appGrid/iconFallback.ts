const fallbackGradients = [
  ['#7c3aed', '#38bdf8'],
  ['#f97316', '#facc15'],
  ['#ef4444', '#ec4899'],
  ['#10b981', '#06b6d4'],
  ['#6366f1', '#a855f7'],
  ['#0f172a', '#475569']
]

export const isImageIconSource = (value?: string) =>
  /^(https?:\/\/|data:image\/|src\/assets\/images\/)/i.test(String(value || ''))

export const getIconTextFromName = (value?: string) => {
  const text = String(value || '').trim()
  if (!text) return 'A'
  const chinese = text.match(/[\u4e00-\u9fa5]/g)
  if (chinese?.length) return chinese.slice(0, 2).join('')
  const letters = text.replace(/[^a-z0-9]/gi, '').slice(0, 2)
  return (letters || text.slice(0, 2)).toUpperCase()
}

export const createFallbackIcon = (name?: string) => {
  const text = getIconTextFromName(name)
  const seed = Array.from(String(name || text)).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const [from, to] = fallbackGradients[seed % fallbackGradients.length]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill="url(#g)"/>
      <circle cx="98" cy="28" r="18" fill="rgba(255,255,255,.18)"/>
      <text x="64" y="74" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${text.length > 1 ? 34 : 44}" font-weight="800" fill="#fff">${text}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
