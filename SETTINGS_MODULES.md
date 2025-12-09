# 设置侧边栏模块结构说明

## 📁 10个独立功能模块

每个模块都遵循标准的三层架构：`types/` + `stores/` + `services/`

### 模块列表

1. **subscription** (订阅管理) ✅ 已创建
2. **invitation** (我的邀请)
3. **generalSettings** (常规设置)
4. **wallpaper** (壁纸) ✅ 已创建
5. **theme** (主题切换)
6. **searchEngine** (搜索引擎)
7. **notification** (消息通知)
8. **about** (关于我们)
9. **relatedApps** (相关应用)
10. **feedback** (投诉与反馈)

## 📦 标准模块结构

```
src/pages/[moduleName]/
├── [moduleName].tsx              # 主组件
├── [moduleName].module.less      # 样式文件
├── types/                        # 类型定义层
│   └── [moduleName].ts
├── stores/                       # 状态管理层
│   ├── [moduleName].ts
│   └── index.ts
└── services/                     # 服务层
    ├── [moduleName].ts
    └── index.ts
```

## 🔧 快速创建模块模板

### types/[moduleName].ts
```typescript
/**
 * [moduleName] 模块类型定义
 */

interface I[ModuleName]Data {}
interface I[ModuleName]Config {}

export { I[ModuleName]Data, I[ModuleName]Config }
```

### stores/[moduleName].ts
```typescript
import { atom } from 'recoil'

const [moduleName]Store = atom({
  key: '[moduleName]Store',
  default: null
})

export default { [moduleName]Store }
```

### stores/index.ts
```typescript
import [moduleName]Store from './[moduleName]'

export { [moduleName]Store }
```

### services/[moduleName].ts
```typescript
import { http } from '@/utils'
import { env } from '@/config/env'

export default {
  async getData() {
    try {
      const result = await chrome.storage.local.get(['[moduleName]Data'])
      return result.[moduleName]Data || null
    } catch (error) {
      console.error('获取数据失败:', error)
      return null
    }
  },

  async saveData(data: any) {
    try {
      await chrome.storage.local.set({ [moduleName]Data: data })
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  }
}
```

### services/index.ts
```typescript
import [moduleName]Service from './[moduleName]'

export { [moduleName]Service }
```

### [moduleName].tsx
```typescript
import React from 'react'
import styles from './[moduleName].module.less'

const [ModuleName]: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2>[ModuleName] 功能</h2>
      <p>功能开发中...</p>
    </div>
  )
}

export default [ModuleName]
```

### [moduleName].module.less
```less
.container {
  padding: 20px;
}
```

## 📝 已创建的模块详情

### 1. subscription (订阅管理)
- **类型**: `ISubscriptionStatus`, `ISubscriptionPackage`, `ISubscriptionHistory`
- **服务**: 获取订阅状态、套餐列表、购买订阅、取消订阅
- **状态**: 订阅状态、升级弹窗显示

### 2. wallpaper (壁纸)
- **类型**: `IGradientWallpaper`, `IImageWallpaper`, `IDynamicWallpaper`
- **服务**: 获取渐变/图片/动态壁纸、保存壁纸配置
- **状态**: 壁纸配置、当前标签页、颜色过滤器

## 🚀 使用方式

在 `settingsSidebar.tsx` 中导入并使用：

```typescript
import Subscription from '@/pages/subscription/subscription'
import Wallpaper from '@/pages/wallpaper/wallpaper'
// ... 其他模块

const renderContent = () => {
  switch (activeMenu) {
    case 'subscription':
      return <Subscription />
    case 'wallpaper':
      return <Wallpaper />
    // ... 其他case
    default:
      return <div>功能开发中...</div>
  }
}
```
