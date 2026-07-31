export const APP_LANGUAGES = [
  'zh-CN',
  'en',
  'ja',
  'fr',
  'de',
  'ar',
  'es',
  'pt',
  'ko',
  'vi',
  'th',
  'my',
  'lo',
  'nl',
  'ru'
] as const

export type AppLanguage = (typeof APP_LANGUAGES)[number]

export const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ko', label: '한국어' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
  { value: 'my', label: 'မြန်မာ' },
  { value: 'lo', label: 'ລາວ' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'ru', label: 'Русский' }
]

export const normalizeLanguage = (value?: string | null): AppLanguage => {
  const language = String(value || '').toLowerCase()
  if (language.startsWith('zh')) return 'zh-CN'
  const matched = APP_LANGUAGES.find((item) => item.toLowerCase() === language)
  if (matched) return matched
  const base = language.split('-')[0]
  return APP_LANGUAGES.find((item) => item.toLowerCase() === base) || 'en'
}

export const isRtlLanguage = (language?: string | null) =>
  normalizeLanguage(language) === 'ar'
