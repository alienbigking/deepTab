import type { AppCategory } from '@/pages/appCategory/types/appCategory'
import type { AppNode, IconSettings } from '@/pages/appGrid/types/appGrid'
import type { BottomBarPins } from '@/pages/bottomBar/types/bottomBar'
import type { IGeneralSettings } from '@/pages/generalSettings/types/generalSettings'
import type { INotificationSettings } from '@/pages/notification/types/notification'
import type { ISearchSettings } from '@/pages/searchBar/types/searchBar'
import type { ISearchEngineConfig } from '@/pages/searchEngine/types/searchEngine'
import type { IAppSettings } from '@/pages/settingsSidebar/types/settingsSidebar'
import type { IThemeConfig } from '@/pages/theme/types/theme'
import type { IWallpaperConfig } from '@/pages/wallpaper/types/wallpaper'
import type { ITodoItem, IWidgetConfig } from '@/pages/widgetsContainer/types/widgetsContainer'

export interface DeepTabSyncPayload {
  appGridData?: AppNode[]
  appGridIconSettings?: IconSettings
  appCategories?: AppCategory[]
  wallpaperConfig?: IWallpaperConfig
  themeConfig?: IThemeConfig
  generalSettings?: IGeneralSettings
  searchEngineConfig?: ISearchEngineConfig
  searchSettings?: ISearchSettings
  widgetConfig?: IWidgetConfig
  todoList?: ITodoItem[]
  bottomBarPins?: BottomBarPins
  notificationSettings?: INotificationSettings
  appSettings?: IAppSettings
}

export interface DeepTabSyncRecord {
  id: string
  userId: string
  version: number
  payload: DeepTabSyncPayload
  createDate: number
  updateDate: number
}
