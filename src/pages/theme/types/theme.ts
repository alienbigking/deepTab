/**
 * theme 模块类型定义
 */

type ThemeMode = 'light' | 'dark' | 'auto'

interface IThemeConfig {
  mode: ThemeMode
  primaryColor: string
  borderRadius: number
}

export { ThemeMode, IThemeConfig }
