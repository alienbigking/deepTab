/**
 * generalSettings 模块类型定义
 */

interface IGeneralSettings {
  language: 'zh' | 'en'
  timeFormat: '12' | '24'
  showWeather: boolean
  showClock: boolean
  autoSave: boolean
  animations: boolean
}

export { IGeneralSettings }
