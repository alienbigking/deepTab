import type { Locale } from 'antd/es/locale'
import arEG from 'antd/locale/ar_EG'
import deDE from 'antd/locale/de_DE'
import enUS from 'antd/locale/en_US'
import esES from 'antd/locale/es_ES'
import frFR from 'antd/locale/fr_FR'
import jaJP from 'antd/locale/ja_JP'
import koKR from 'antd/locale/ko_KR'
import myMM from 'antd/locale/my_MM'
import nlNL from 'antd/locale/nl_NL'
import ptPT from 'antd/locale/pt_PT'
import ruRU from 'antd/locale/ru_RU'
import thTH from 'antd/locale/th_TH'
import viVN from 'antd/locale/vi_VN'
import zhCN from 'antd/locale/zh_CN'
import type { AppLanguage } from './types'
import { normalizeLanguage } from './types'

const locales: Record<AppLanguage, Locale> = {
  'zh-CN': zhCN,
  en: enUS,
  ja: jaJP,
  fr: frFR,
  de: deDE,
  ar: arEG,
  es: esES,
  pt: ptPT,
  ko: koKR,
  vi: viVN,
  th: thTH,
  my: myMM,
  lo: enUS,
  nl: nlNL,
  ru: ruRU
}

export const getAntdLocale = (language?: string | null) => locales[normalizeLanguage(language)]
