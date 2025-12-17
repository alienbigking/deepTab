import fs from 'fs'
import path from 'path'

const OUT_DIR = path.resolve(process.cwd(), 'src/assets/images/searchEngines')

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function downloadTo(url, filePathBase, attempts = 2) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchWithTimeout(url, 8000)
      if (!res.ok) throw new Error(`download_failed: ${res.status} ${res.statusText} ${url}`)
      const contentType = (res.headers.get('content-type') || '').toLowerCase()
      const ext = contentType.includes('svg')
        ? 'svg'
        : contentType.includes('png')
          ? 'png'
          : contentType.includes('icon')
            ? 'ico'
            : 'png'
      const outPath = `${filePathBase}.${ext}`
      const ab = await res.arrayBuffer()
      fs.writeFileSync(outPath, Buffer.from(ab))
      return { outPath, contentType }
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastErr
}

const engines = [
  { id: 'baidu', domain: 'baidu.com', iconSlugs: ['baidu'] },
  { id: 'google', domain: 'google.com', iconSlugs: ['google'] },
  {
    id: 'bing',
    domain: 'bing.com',
    iconSlugs: ['microsoftbing', 'bing'],
    extraSvgUrls: ['https://www.vectorlogo.zone/logos/bing/bing-icon.svg']
  },
  { id: 'duckduckgo', domain: 'duckduckgo.com', iconSlugs: ['duckduckgo'] }
]

function candidates(domain, iconSlugs, extraSvgUrls) {
  const urls = []

  for (const u of extraSvgUrls || []) {
    urls.push(u)
  }

  for (const slug of iconSlugs || []) {
    urls.push(`https://cdn.simpleicons.org/${encodeURIComponent(slug)}`)
    urls.push(`https://simpleicons.org/icons/${encodeURIComponent(slug)}.svg`)
  }

  urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`)
  urls.push(`https://faviconkit.com/${domain}/256`)
  urls.push(`https://www.bing.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`)
  urls.push(`https://www.${domain}/favicon.ico`)
  urls.push(`https://${domain}/favicon.ico`)
  return urls
}

function cleanupOtherExts(base, keepExt) {
  for (const ext of ['svg', 'png', 'ico']) {
    if (ext === keepExt) continue
    const p = `${base}.${ext}`
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p)
    } catch {
      // ignore
    }
  }
}

async function main() {
  ensureDir(OUT_DIR)

  const failed = []

  for (const e of engines) {
    const base = path.join(OUT_DIR, e.id)
    let ok = false
    let last

    for (const url of candidates(e.domain, e.iconSlugs, e.extraSvgUrls)) {
      try {
        process.stdout.write(`Trying ${e.id}: ${url}\n`)
        last = await downloadTo(url, base)
        process.stdout.write(
          `Downloaded ${e.id}: ${url} -> ${path.relative(process.cwd(), last.outPath)} (${last.contentType})\n`
        )
        const keepExt = String(last.outPath).split('.').pop() || ''
        cleanupOtherExts(base, keepExt)
        ok = true
        break
      } catch (err) {
        last = err
      }
    }

    if (!ok) {
      failed.push({ id: e.id, err: last })
      process.stdout.write(`Failed ${e.id}: ${String(last?.message || last)}\n`)
    }
  }

  if (failed.length) {
    process.stdout.write(`\nCompleted with failures: ${failed.map((x) => x.id).join(', ')}\n`)
    process.exitCode = 1
  } else {
    process.stdout.write(`\nAll icons downloaded successfully.\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
