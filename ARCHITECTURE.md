# deepTab 项目架构规范

## 📁 模块标准结构

每个功能模块都应遵循以下目录结构：

```
src/pages/[moduleName]/
├── [moduleName].tsx              # 主组件
├── [moduleName].module.less      # 样式文件
├── [subComponent].tsx            # 子组件（可选）
├── types/                        # 类型定义层
│   └── [moduleName].ts
├── stores/                       # 状态管理层（Recoil）
│   ├── [moduleName].ts
│   └── index.ts
└── services/                     # 服务层（API/Storage）
    ├── [moduleName].ts
    └── index.ts
```

## 🎯 命名规范

### 1. 文件夹命名
- **小驼峰命名** (camelCase)
- 例如：`searchBar/`, `widgetsContainer/`, `appGrid/`

### 2. 文件命名
- **组件文件**：小驼峰 (camelCase)
  - `searchBar.tsx`, `appGrid.tsx`, `widgetsContainer.tsx`
- **样式文件**：小驼峰 + `.module.less`
  - `searchBar.module.less`, `appGrid.module.less`
- **类型文件**：小驼峰 + `.ts`
  - `types/searchBar.ts`, `types/appGrid.ts`

### 3. 组件命名
- **大驼峰命名** (PascalCase)
- 例如：`SearchBar`, `AppGrid`, `WidgetsContainer`

### 4. 接口命名
- **I + 大驼峰命名**
- 例如：`ISearchSettings`, `IWeatherData`, `ITodoItem`

## 📦 各层职责

### Types 层（类型定义）
```typescript
// types/moduleName.ts
interface IAddParams {}
interface IUpdateParams {}
interface IListParams extends IPagination {}

export { IAddParams, IUpdateParams, IListParams }
```

**职责：**
- 定义模块所有的 TypeScript 接口和类型
- 包括 API 参数、响应数据、组件 Props 等
- 从 `@/pages/common/types/common` 继承公共类型

### Services 层（服务层）
```typescript
// services/moduleName.ts
import { http } from '@/utils'
import { env } from '@/config/env'
import { IAddParams, IListParams } from '../types/moduleName'

export default {
  async getList(params?: IListParams) {
    return http(`${env.HOST_API_URL}api/endpoint`, { params })
  },
  
  async add(params: IAddParams) {
    return http(`${env.HOST_API_URL}api/endpoint`, {
      method: 'POST',
      data: params
    })
  }
}

// services/index.ts
import moduleNameService from './moduleName'
export { moduleNameService }
```

**职责：**
- 封装所有 API 调用
- 封装 `chrome.storage` 操作
- 处理数据转换和错误处理
- 提供统一的数据访问接口

### Stores 层（状态管理）
```typescript
// stores/moduleName.ts
import { atom } from 'recoil'

const dataStore = atom({
  key: 'dataStore',
  default: null
})

const configStore = atom({
  key: 'configStore',
  default: {}
})

export default { dataStore, configStore }

// stores/index.ts
import moduleNameStore from './moduleName'
export { moduleNameStore }
```

**职责：**
- 使用 Recoil 管理全局状态
- 定义 atom（原子状态）
- 每个 atom 必须有唯一的 key
- 提供默认值

## 🔧 核心工具

### HTTP 工具（`@/utils/http`）
```typescript
import { http } from '@/utils'

// GET 请求
const data = await http('url', { params: { id: 1 } })

// POST 请求
const result = await http('url', {
  method: 'POST',
  data: { name: 'test' }
})

// PUT/DELETE 同理
```

**特性：**
- 基于原生 `fetch` API
- 自动添加 token（从 `chrome.storage.local` 读取）
- 支持超时控制（默认 180s）
- 统一错误处理

### 环境配置（`@/config/env`）
```typescript
import { env } from '@/config/env'

console.log(env.HOST_API_URL)      // API 基础地址
console.log(env.isDevelopment)     // 是否开发环境
console.log(env.isProduction)      // 是否生产环境
```

### 路径别名
```typescript
// 使用 @/ 代替相对路径
import { http } from '@/utils'
import { env } from '@/config/env'
import { IPagination } from '@/pages/common/types/common'
```

## 📝 开发流程

### 1. 创建新模块
```bash
src/pages/newModule/
├── newModule.tsx
├── newModule.module.less
├── types/
│   └── newModule.ts
├── stores/
│   ├── newModule.ts
│   └── index.ts
└── services/
    ├── newModule.ts
    └── index.ts
```

### 2. 定义类型（types）
```typescript
// types/newModule.ts
interface INewModuleData {}
interface INewModuleParams {}

export { INewModuleData, INewModuleParams }
```

### 3. 创建服务（services）
```typescript
// services/newModule.ts
import { http } from '@/utils'
import { env } from '@/config/env'

export default {
  async getData() {
    return http(`${env.HOST_API_URL}api/data`)
  }
}
```

### 4. 定义状态（stores）
```typescript
// stores/newModule.ts
import { atom } from 'recoil'

const dataStore = atom({
  key: 'newModuleDataStore',
  default: null
})

export default { dataStore }
```

### 5. 使用在组件中
```typescript
// newModule.tsx
import { useRecoilState } from 'recoil'
import { newModuleStore } from './stores'
import { newModuleService } from './services'

const NewModule: React.FC = () => {
  const [data, setData] = useRecoilState(newModuleStore.dataStore)
  
  useEffect(() => {
    newModuleService.getData().then(setData)
  }, [])
  
  return <div>{/* UI */}</div>
}
```

## 🚀 技术栈

- **React 19** + **TypeScript**
- **Recoil** - 状态管理
- **Ant Design 5** - UI 组件库
- **Less** + **CSS Modules** - 样式
- **i18next** - 国际化
- **dayjs** - 日期处理
- **Chrome Extension API** - 扩展能力

## ⚠️ 注意事项

1. **不要使用 UmiJS 依赖**
   - ❌ `@umijs/max`
   - ❌ `@@/core/history`
   - ✅ 使用原生 `fetch` 和 Chrome API

2. **路径别名配置**
   - `tsconfig.json` 中配置 `"@/*": ["src/*"]`
   - `webpack.config.js` 中配置 `alias: { '@': path.resolve(__dirname, 'src') }`

3. **Chrome 扩展特性**
   - 使用 `chrome.storage.local` 存储数据
   - 使用 `chrome.runtime.sendMessage` 通信
   - 不能使用传统的路由（如 `react-router`）

4. **编码规范**
   - 不使用分号
   - 单引号
   - 2 空格缩进
   - 中文注释

## 📚 参考模块

- **appGrid** - 完整的 API 调用示例
- **searchBar** - Chrome Storage 使用示例
- **widgetsContainer** - 混合 API + Storage 示例
- **settingsSidebar** - 配置管理示例
