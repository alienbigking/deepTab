import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import 'dayjs/locale/de'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/ja'
import 'dayjs/locale/ko'
import 'dayjs/locale/lo'
import 'dayjs/locale/my'
import 'dayjs/locale/nl'
import 'dayjs/locale/pt'
import 'dayjs/locale/ru'
import 'dayjs/locale/th'
import 'dayjs/locale/vi'
import 'dayjs/locale/zh-cn'
import i18n from './index'
import { normalizeLanguage, type AppLanguage } from './types'

const localeMap: Record<AppLanguage, string> = {
  'zh-CN': 'zh-cn', en: 'en', ja: 'ja', fr: 'fr', de: 'de', ar: 'ar', es: 'es', pt: 'pt',
  ko: 'ko', vi: 'vi', th: 'th', my: 'my', lo: 'lo', nl: 'nl', ru: 'ru'
}

const applyDayjsLocale = (language: string) => dayjs.locale(localeMap[normalizeLanguage(language)])

i18n.on('languageChanged', applyDayjsLocale)
applyDayjsLocale(i18n.language)
