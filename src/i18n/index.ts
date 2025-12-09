import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json' // 引入英文翻译
import zh from './locales/zh.json' // 引入中文翻译

const resources = {
  en: { translation: en },
  zh: { translation: zh }
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // 默认语言
    fallbackLng: 'en', // 回退语言
    defaultNS: 'translation', // 设置默认命名空间
    interpolation: {
      escapeValue: false // 防止 XSS 攻击
    }
  })

export default i18n
