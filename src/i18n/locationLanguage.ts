import { normalizeLanguage, type AppLanguage } from './types'

const LANGUAGE_DETECTION_KEY = 'app_language_detection'
const DETECTION_TTL = 24 * 60 * 60 * 1000
const IP_LOCATION_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en'

interface LanguageDetectionCache {
  countryCode: string
  language: AppLanguage
  detectedAt: number
}

const countries = (codes: string, languages: AppLanguage[]) =>
  Object.fromEntries(codes.split(' ').map((code) => [code, languages]))

const COUNTRY_LANGUAGES: Record<string, AppLanguage[]> = {
  ...countries('CN TW HK MO', ['zh-CN']),
  ...countries('JP', ['ja']),
  ...countries('FR MC', ['fr']),
  ...countries('DE AT LI', ['de']),
  ...countries('ES MX AR CL CO PE VE EC GT CU BO DO HN PY SV NI CR PA UY GQ', ['es']),
  ...countries('PT BR AO MZ CV GW ST TL', ['pt']),
  ...countries('KR KP', ['ko']),
  ...countries('VN', ['vi']),
  ...countries('TH', ['th']),
  ...countries('MM', ['my']),
  ...countries('LA', ['lo']),
  ...countries('NL AW CW SX', ['nl']),
  ...countries('RU BY KZ KG', ['ru']),
  ...countries('SA AE QA KW BH OM YE IQ JO SY LB PS EG LY TN DZ MA SD SO DJ MR KM', ['ar']),
  ...countries('US GB AU NZ IE SG JM TT BS BB BZ GY', ['en']),
  CA: ['en', 'fr'],
  BE: ['nl', 'fr', 'de'],
  CH: ['de', 'fr'],
  LU: ['fr', 'de'],
  ZA: ['en'],
  IN: ['en'],
  PH: ['en']
}

const selectCountryLanguage = (countryCode: string): AppLanguage => {
  const candidates = COUNTRY_LANGUAGES[countryCode]
  if (!candidates?.length) return 'en'

  const browserLanguage = normalizeLanguage(navigator.language)
  return candidates.includes(browserLanguage) ? browserLanguage : candidates[0]
}

const readCachedDetection = async (): Promise<AppLanguage | null> => {
  try {
    const storage = await chrome.storage.local.get([LANGUAGE_DETECTION_KEY])
    const cached = storage[LANGUAGE_DETECTION_KEY] as LanguageDetectionCache | undefined
    if (!cached || Date.now() - cached.detectedAt > DETECTION_TTL) return null
    return normalizeLanguage(cached.language)
  } catch {
    return null
  }
}

const saveDetection = async (cache: LanguageDetectionCache) => {
  try {
    await chrome.storage.local.set({ [LANGUAGE_DETECTION_KEY]: cache })
  } catch {
    // Language detection still works when storage is unavailable.
  }
}

export const detectLanguageByIp = async (): Promise<AppLanguage> => {
  const cached = await readCachedDetection()
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(IP_LOCATION_URL, { signal: controller.signal })
    if (!response.ok) throw new Error(`IP language detection failed: ${response.status}`)

    const data = (await response.json()) as { countryCode?: string }
    const countryCode = String(data.countryCode || '').trim().toUpperCase()
    if (!countryCode) throw new Error('IP language detection returned no country code')

    const language = selectCountryLanguage(countryCode)
    await saveDetection({ countryCode, language, detectedAt: Date.now() })
    return language
  } catch (error) {
    console.warn('IP language detection unavailable, using Simplified Chinese:', error)
    return 'zh-CN'
  } finally {
    window.clearTimeout(timer)
  }
}
