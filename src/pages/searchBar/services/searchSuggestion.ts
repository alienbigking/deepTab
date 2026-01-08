const parseOsJson = (raw: any): string[] => {
  if (!Array.isArray(raw)) return []
  const list = raw[1]
  if (!Array.isArray(list)) return []
  return list.map((it) => String(it || '').trim()).filter(Boolean)
}

export default {
  async getBingSuggestions(keyword: string): Promise<string[]> {
    const q = String(keyword || '').trim()
    if (!q) return []

    try {
      const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`
      const res = await fetch(url)
      if (!res.ok) return []
      const json = await res.json()
      return parseOsJson(json)
    } catch {
      return []
    }
  }
}
