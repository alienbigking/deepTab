import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import lo from './locales/lo.json'
import my from './locales/my.json'
import nl from './locales/nl.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import th from './locales/th.json'
import vi from './locales/vi.json'
import zhCN from './locales/zh-CN.json'
import { isRtlLanguage, normalizeLanguage, type AppLanguage } from './types'
import { detectLanguageByIp } from './locationLanguage'

const resources = {
  'zh-CN': { translation: zhCN },
  en: { translation: en },
  ja: { translation: ja },
  fr: { translation: fr },
  de: { translation: de },
  ar: { translation: ar },
  es: { translation: es },
  pt: { translation: pt },
  ko: { translation: ko },
  vi: { translation: vi },
  th: { translation: th },
  my: { translation: my },
  lo: { translation: lo },
  nl: { translation: nl },
  ru: { translation: ru }
} as const

const applyDocumentLanguage = (language: string) => {
  const normalized = normalizeLanguage(language)
  document.documentElement.lang = normalized
  document.documentElement.dir = isRtlLanguage(normalized) ? 'rtl' : 'ltr'
}

const i18nReady = i18n.use(initReactI18next).init({
  resources,
  lng: 'zh-CN',
  supportedLngs: Object.keys(resources),
  fallbackLng: 'en',
  load: 'currentOnly',
  interpolation: { escapeValue: false },
  returnNull: false
})

i18n.on('languageChanged', applyDocumentLanguage)
applyDocumentLanguage(i18n.language)

export const initializeAppLanguage = async (): Promise<AppLanguage> => {
  await i18nReady
  let storedLanguage: string | undefined
  try {
    const storage = await chrome.storage.local.get(['appSettings'])
    storedLanguage = storage.appSettings?.language
  } catch {
    // Popup previews outside the extension environment use the browser language.
  }
  const language = storedLanguage
    ? normalizeLanguage(storedLanguage)
    : await detectLanguageByIp()
  await i18n.changeLanguage(language)
  return language
}

export default i18n
