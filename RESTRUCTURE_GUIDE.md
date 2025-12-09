# 项目重构指南

## 📁 新的项目结构

```
src/pages/
├── newtab.tsx                          # 新标签页主组件
├── newtab.module.less                  # 新标签页样式
├── searchBar/                          # 搜索框模块
│   ├── searchBar.tsx
│   └── searchBar.module.less
├── widgetsContainer/                   # 小部件容器模块
│   ├── widgetsContainer.tsx
│   ├── widgetsContainer.module.less
│   ├── calendarWidget.tsx
│   ├── weatherWidget.tsx
│   ├── todoWidget.tsx
│   └── widgets.module.less
├── appGrid/                            # 应用网格模块
│   ├── appGrid.tsx
│   ├── appIcon.tsx
│   └── appGrid.module.less
├── settingsSidebar/                    # 设置侧边栏模块
│   ├── settingsSidebar.tsx
│   └── settingsSidebar.module.less
└── about/                              # 关于页面（保留）
    ├── about.tsx
    └── about.module.less
```

## 🗑️ 需要删除的旧文件/文件夹

请手动删除以下文件和文件夹：

### 删除旧的 popup 相关模块
```
src/pages/home/                         # 删除
src/pages/notifications/                # 删除
src/pages/dashboard/                    # 删除
src/pages/history/                      # 删除
src/pages/settings/                     # 删除
src/pages/mail/                         # 删除
src/pages/common/                       # 删除
src/pages/main.tsx                      # 删除
```

### 删除旧的 newtab 嵌套结构
```
src/pages/newtab/                       # 整个文件夹删除
```

## ✅ 命名规范（参考 about 模块）

1. **文件夹名**：小驼峰命名 (camelCase)
   - 例如：`searchBar/`, `widgetsContainer/`, `appGrid/`

2. **文件名**：小驼峰命名 (camelCase)
   - 组件文件：`searchBar.tsx`, `appGrid.tsx`
   - 样式文件：`searchBar.module.less`, `appGrid.module.less`

3. **组件名**：大驼峰命名 (PascalCase)
   - 例如：`SearchBar`, `AppGrid`, `WidgetsContainer`

## 🔄 变更说明

### 之前的结构问题
- ❌ 使用了 `index.tsx` 作为组件入口
- ❌ 嵌套层级过深 (`pages/newtab/components/...`)
- ❌ 混合了 popup 和 newtab 的模块

### 现在的结构优势
- ✅ 使用模块名作为文件名 (`searchBar.tsx`)
- ✅ 扁平化结构，所有模块直接在 `pages/` 下
- ✅ 清晰的模块划分，易于维护
- ✅ 遵循统一的命名规范

## 🚀 下一步操作

1. **手动删除**上述列出的旧文件和文件夹
2. **重启 TypeScript 服务器**（VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"）
3. **运行构建**：`npm run build`
4. **测试新标签页**：在 Chrome 中加载扩展，打开新标签页查看效果

## 📝 注意事项

- 新结构已经创建完成，旧文件保留是为了避免数据丢失
- 请确认新结构正常工作后再删除旧文件
- `about` 模块保留作为参考示例
