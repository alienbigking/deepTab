/**
 * theme 模块类型定义
 */

type ThemeMode = 'default' | 'light' | 'dark' | 'system'

type LegacyThemeMode = 'auto'

interface IThemeConfig {
  mode: ThemeMode
  primaryColor?: string
  borderRadius?: number
}

export { ThemeMode, LegacyThemeMode, IThemeConfig }
