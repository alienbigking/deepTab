/**
 * generalSettings 模块类型定义
 */

type BarVisibility = 'alwaysShow' | 'alwaysHide'
type SidebarPosition = 'left' | 'right'
type SearchOpenMethod = 'newTab' | 'currentTab'
type SearchBarStyle = 'default'

interface IGeneralSettings {
  controlBar: {
    sidebar: BarVisibility
    sidebarPosition: SidebarPosition
    bottomBar: BarVisibility
  }

  search: {
    searchBarStyle: SearchBarStyle
    openMethod: SearchOpenMethod
    searchSuggestions: boolean
    searchHistory: boolean
    tabSwitchEngine: boolean
    keepSearchValue: boolean
  }

  other: {
    scrollSensitivity: number
    useSystemFont: boolean
    showIcp: boolean
  }
}

export { IGeneralSettings }
