import React, { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { App, Button, Dropdown, Form, Input, Popover } from 'antd'
import {
  PlusOutlined,
  HomeOutlined,
  RobotOutlined,
  HighlightOutlined,
  CodeOutlined,
  ShoppingOutlined,
  FolderOutlined,
  StarOutlined,
  HeartOutlined,
  TagOutlined,
  ToolOutlined,
  UserOutlined
} from '@ant-design/icons'
import styles from './appCategorySidebar.module.less'
import useAppCategoryStore from './stores/appCategory'
import type { CategoryIconKey } from './types/appCategory'

const iconMap: Record<CategoryIconKey, React.ReactNode> = {
  home: <HomeOutlined />,
  ai: <RobotOutlined />,
  design: <HighlightOutlined />,
  code: <CodeOutlined />,
  shop: <ShoppingOutlined />,
  folder: <FolderOutlined />,
  star: <StarOutlined />,
  heart: <HeartOutlined />,
  tag: <TagOutlined />,
  tool: <ToolOutlined />
}

const iconOptions: Array<{ key: CategoryIconKey; node: React.ReactNode }> = [
  { key: 'home', node: iconMap.home },
  { key: 'ai', node: iconMap.ai },
  { key: 'design', node: iconMap.design },
  { key: 'code', node: iconMap.code },
  { key: 'shop', node: iconMap.shop },
  { key: 'folder', node: iconMap.folder },
  { key: 'star', node: iconMap.star },
  { key: 'heart', node: iconMap.heart },
  { key: 'tag', node: iconMap.tag },
  { key: 'tool', node: iconMap.tool }
]

const BUILTIN_CATEGORY_IDS = new Set(['home', 'ai', 'design', 'dev', 'shop'])

interface CategoryEditorForm {
  name: string
  icon: CategoryIconKey
}

interface AppCategorySidebarProps {
  position?: 'left' | 'right'
}

const AppCategorySidebar: React.FC<AppCategorySidebarProps> = (props) => {
  const { position = 'right' } = props
  const { message, modal } = App.useApp()
  const {
    categories,
    activeCategoryId,
    init,
    setActiveCategoryId,
    addCategory,
    updateCategory,
    deleteCategory
  } = useAppCategoryStore()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorForm] = Form.useForm<CategoryEditorForm>()
  const editorIcon = Form.useWatch('icon', editorForm)

  useEffect(() => {
    void init()

    const onChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes?.app_categories) return
      void init()
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [init])

  const visibleCategories = useMemo(
    () => categories.slice().sort((a, b) => a.order - b.order),
    [categories]
  )

  const nextCategoryName = () => {
    const used = visibleCategories
      .map((c) => c.name)
      .filter((n) => /^分类\d+$/.test(n))
      .map((n) => Number(n.replace('分类', '')))
      .filter((n) => Number.isFinite(n))
    const next = (used.length ? Math.max(...used) : 0) + 1
    return `分类${next}`
  }

  const openAddEditor = () => {
    setEditorMode('add')
    setEditingId(null)
    editorForm.setFieldsValue({ name: nextCategoryName(), icon: 'folder' })
    setEditorOpen(true)
  }

  const openEditEditor = (id: string) => {
    const current = visibleCategories.find((c) => c.id === id)
    if (!current) return
    setEditorMode('edit')
    setEditingId(id)
    editorForm.setFieldsValue({ name: current.name, icon: current.icon })
    setEditorOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await editorForm.validateFields()
      if (editorMode === 'add') {
        await addCategory({ name: values.name, icon: values.icon })
        message.success('分类已添加')
      } else if (editingId) {
        await updateCategory(editingId, { name: values.name, icon: values.icon })
        message.success('分类已更新')
      }
      setEditorOpen(false)
    } catch (error) {
      console.error('保存分类失败:', error)
    }
  }

  const handleDelete = (id: string) => {
    if (BUILTIN_CATEGORY_IDS.has(id)) {
      message.warning('内置分类不支持删除')
      return
    }

    setEditorOpen(false)

    modal.confirm({
      title: '确认删除分类',
      content: '删除后该分类将消失（该分类下的应用暂不会自动迁移）',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCategory(id)
          message.success('分类已删除')
        } catch (error) {
          console.error('删除分类失败:', error)
        }
      }
    })
  }

  const popoverContent = (
    <div className={cn(styles.addPopover)}>
      <Form form={editorForm} layout='vertical'>
        <div className={cn(styles.addPopoverTitle)}>
          <Form.Item name='name' rules={[{ required: true, message: '请输入分类名称' }]} noStyle>
            <Input className={cn(styles.nameInput)} maxLength={12} bordered={false} />
          </Form.Item>
        </div>

        <Form.Item name='icon' initialValue='folder' noStyle>
          <div className={cn(styles.iconGrid)}>
            {iconOptions.map((opt) => (
              <div
                key={opt.key}
                className={cn(
                  styles.iconItem,
                  (editorIcon || 'folder') === opt.key && styles.active
                )}
                onClick={() => editorForm.setFieldValue('icon', opt.key)}
              >
                {opt.node}
              </div>
            ))}
          </div>
        </Form.Item>

        <div className={cn(styles.addPopoverFooter)}>
          <Button type='text' className={cn(styles.addPopoverBtn)} onClick={handleSave} block>
            {editorMode === 'add' ? '添加分类' : '保存分类'}
          </Button>
        </div>
      </Form>
    </div>
  )

  return (
    <>
      <div className={cn(styles.sidebarWrap, position === 'left' && styles.left)}>
        <div className={cn(styles.labels)}>
          <div className={cn(styles.labelsSpacer)} />
          <div className={cn(styles.labelItems)}>
            {visibleCategories.map((c) => (
              <div key={c.id} className={cn(styles.label)}>
                {c.name}
              </div>
            ))}
          </div>
        </div>

        <div className={cn(styles.bar)}>
          <div className={cn(styles.avatar)}>
            <UserOutlined style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)' }} />
          </div>

          <div className={cn(styles.divider)} />

          <div className={cn(styles.items)}>
            {visibleCategories.map((c) => (
              <Dropdown
                key={c.id}
                trigger={['contextMenu']}
                menu={{
                  items: [
                    { key: 'edit', label: '编辑' },
                    {
                      key: 'delete',
                      label: '删除',
                      danger: true,
                      disabled: BUILTIN_CATEGORY_IDS.has(c.id)
                    }
                  ],
                  onClick: ({ key }) => {
                    if (key === 'edit') openEditEditor(c.id)
                    if (key === 'delete') handleDelete(c.id)
                  }
                }}
              >
                <div
                  className={cn(styles.item, c.id === activeCategoryId && styles.active)}
                  onClick={() => {
                    setEditorOpen(false)
                    setActiveCategoryId(c.id)
                  }}
                >
                  {iconMap[c.icon] || iconMap.folder}
                </div>
              </Dropdown>
            ))}
          </div>

          <div className={cn(styles.bottom)}>
            <Popover
              content={popoverContent}
              trigger='click'
              placement='leftBottom'
              open={editorOpen}
              onOpenChange={(v) => {
                if (v) {
                  openAddEditor()
                  return
                }
                setEditorOpen(false)
              }}
            >
              <div className={cn(styles.addBtn)}>
                <PlusOutlined />
              </div>
            </Popover>
          </div>
        </div>
      </div>
    </>
  )
}

export default AppCategorySidebar
