import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Form, Input, message, Select, Empty } from 'antd'
import type { Apps, AddAppParams } from './types/appGrid'
import appGridService from './services/appGrid'
import styles from './addAppModal.module.less'
import AddAppModalSidebar, { AddAppModalSidebarMode } from './addAppModalSidebar'
import AddAppModalCustom from './addAppModalCustom'
import AddAppModalWidgets from './addAppModalWidgets'
import AddAppModalNav from './addAppModalNav'
import useAppCategoryStore from '@/pages/appCategory/stores/appCategory'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'

interface AddAppModalProps {
  open: boolean
  editingApp?: Apps | null
  onClose: () => void
  onSuccess: () => void
}

type AppCategory = 'all' | 'efficiency' | 'ai' | 'dev' | 'study' | 'video' | 'social' | 'shopping' | 'design'
type AppSort = 'today' | 'recent' | 'popular'

interface RecommendedApp {
  key: string
  name: string
  icon: string
  url: string
  desc: string
  category: Exclude<AppCategory, 'all'>
  popularity: number
  updatedAt: string
  iconBg?: string
  widgetSpan?: 2 | 4
}

const categoryItems: { key: AppCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'efficiency', label: '效率' },
  { key: 'ai', label: 'AI' },
  { key: 'dev', label: '开发' },
  { key: 'study', label: '学习' },
  { key: 'video', label: '视频' },
  { key: 'social', label: '社交' },
  { key: 'shopping', label: '购物' },
  { key: 'design', label: '设计' }
]

const navApps: RecommendedApp[] = [
  {
    key: 'google',
    name: 'Google 搜索',
    icon: 'G',
    iconBg: '#4285f4',
    url: 'https://www.google.com',
    desc: '快速打开 Google 搜索',
    category: 'efficiency',
    popularity: 9800,
    updatedAt: '2026-05-01'
  },
  {
    key: 'github',
    name: 'GitHub',
    icon: 'GH',
    iconBg: '#111827',
    url: 'https://github.com',
    desc: '访问你的代码仓库',
    category: 'dev',
    popularity: 9400,
    updatedAt: '2026-04-28'
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    icon: 'AI',
    iconBg: '#10a37f',
    url: 'https://chat.openai.com',
    desc: 'AI 助手，提升效率',
    category: 'ai',
    popularity: 9600,
    updatedAt: '2026-05-18'
  },
  {
    key: 'bilibili',
    name: '哔哩哔哩',
    icon: 'B',
    iconBg: '#13a8ff',
    url: 'https://www.bilibili.com',
    desc: '视频、番剧与学习内容',
    category: 'video',
    popularity: 8800,
    updatedAt: '2026-04-18'
  },
  {
    key: 'youtube',
    name: 'YouTube',
    icon: 'YT',
    iconBg: '#ff0033',
    url: 'https://www.youtube.com',
    desc: '全球视频平台',
    category: 'video',
    popularity: 9300,
    updatedAt: '2026-04-22'
  },
  {
    key: 'x',
    name: 'X',
    icon: 'X',
    iconBg: '#111111',
    url: 'https://x.com',
    desc: '关注全球实时热点',
    category: 'social',
    popularity: 7900,
    updatedAt: '2026-05-03'
  },
  {
    key: 'zhihu',
    name: '知乎',
    icon: '知',
    iconBg: '#1677ff',
    url: 'https://www.zhihu.com',
    desc: '中文问答社区',
    category: 'study',
    popularity: 7600,
    updatedAt: '2026-03-30'
  },
  {
    key: 'taobao',
    name: '淘宝',
    icon: '淘',
    iconBg: '#ff6a00',
    url: 'https://www.taobao.com',
    desc: '综合购物平台',
    category: 'shopping',
    popularity: 8500,
    updatedAt: '2026-04-05'
  },
  {
    key: 'figma',
    name: 'Figma',
    icon: 'F',
    iconBg: '#a259ff',
    url: 'https://www.figma.com',
    desc: '在线设计协作工具',
    category: 'design',
    popularity: 8100,
    updatedAt: '2026-05-14'
  }
]

const widgetApps: RecommendedApp[] = [
  {
    key: 'widget_calendar',
    name: '日历',
    icon: '27',
    iconBg: '#f59e0b',
    url: 'deeptab://widget/calendar',
    widgetSpan: 4,
    desc: '在主页添加日期与进度小组件入口',
    category: 'efficiency',
    popularity: 7200,
    updatedAt: '2026-05-10'
  },
  {
    key: 'widget_weather',
    name: '天气',
    icon: '☁',
    iconBg: '#38bdf8',
    url: 'deeptab://widget/weather',
    widgetSpan: 4,
    desc: '快速查看城市天气和预报',
    category: 'efficiency',
    popularity: 7000,
    updatedAt: '2026-05-11'
  },
  {
    key: 'widget_todo',
    name: '待办',
    icon: '✓',
    iconBg: '#7c3aed',
    url: 'deeptab://widget/todo',
    widgetSpan: 4,
    desc: '管理今天要完成的事项',
    category: 'efficiency',
    popularity: 6800,
    updatedAt: '2026-05-12'
  },
  {
    key: 'widget_hot_search',
    name: '热搜',
    icon: '热',
    iconBg: '#ef4444',
    url: 'deeptab://widget/hotSearch',
    widgetSpan: 4,
    desc: '追踪各平台热门榜单',
    category: 'social',
    popularity: 7400,
    updatedAt: '2026-05-13'
  }
]

const normalizeUrl = (value: string) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^(https?:\/\/|deeptab:\/\/)/i.test(raw)) return raw
  return `https://${raw}`
}

const faviconUrlFromInput = (value: string) => {
  const normalized = normalizeUrl(value)
  if (!normalized || normalized.startsWith('deeptab://')) return ''
  try {
    const url = new URL(normalized)
    return `${url.protocol}//${url.hostname}/favicon.ico`
  } catch {
    return ''
  }
}

const faviconUrlsFromInput = (value: string) => {
  const normalized = normalizeUrl(value)
  if (!normalized || normalized.startsWith('deeptab://')) return []
  try {
    const url = new URL(normalized)
    const origin = `${url.protocol}//${url.hostname}`
    return [
      `${origin}/favicon.ico`,
      `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`,
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`
    ]
  } catch {
    return []
  }
}

const fallbackNameFromUrl = (value: string) => {
  const normalized = normalizeUrl(value)
  if (!normalized || normalized.startsWith('deeptab://')) return ''
  try {
    const hostname = new URL(normalized).hostname.replace(/^www\./, '')
    return hostname.split('.')[0] || hostname
  } catch {
    return ''
  }
}

const isUrlLikeText = (value: string) => {
  const text = String(value || '').trim()
  if (!text) return false
  if (/^https?:\/\//i.test(text)) return true
  return /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(text)
}

const displayNameFromValues = (name: string, url: string) => {
  const text = String(name || '').trim()
  return isUrlLikeText(text) ? fallbackNameFromUrl(url) || text : text
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const fetchImageAsDataUrl = async (url: string) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'omit'
    })
    if (!response.ok) return ''

    const blob = await response.blob()
    if (!blob.size || !blob.type.startsWith('image/')) return ''
    return blobToDataUrl(blob)
  } catch {
    return ''
  } finally {
    window.clearTimeout(timer)
  }
}

const canRenderImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const image = new Image()
    const timer = window.setTimeout(() => resolve(false), 2000)
    image.onload = () => {
      window.clearTimeout(timer)
      resolve(true)
    }
    image.onerror = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
    image.src = src
  })

const resolveFaviconIcon = async (url: string) => {
  const candidates = faviconUrlsFromInput(url)

  for (const candidate of candidates) {
    const dataUrl = await fetchImageAsDataUrl(candidate)
    if (dataUrl && (await canRenderImage(dataUrl))) return dataUrl
  }

  return ''
}

const iconTextFromName = (value: string) => {
  const text = String(value || '').trim()
  if (!text) return 'A'
  const chinese = text.match(/[\u4e00-\u9fa5]/g)
  if (chinese?.length) return chinese.slice(0, 8).join('')
  const letters = text.replace(/[^a-z0-9]/gi, '').slice(0, 8)
  return (letters || text.slice(0, 8)).toUpperCase()
}

const decodeHtmlText = (value: string) => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value.replace(/\s+/g, ' ').trim()
}

const getWebsiteTitle = async (value: string) => {
  const normalized = normalizeUrl(value)
  if (!normalized || normalized.startsWith('deeptab://')) return ''
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(normalized, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'omit'
    })
    if (!response.ok) return ''
    const html = await response.text()
    const siteNameMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    return decodeHtmlText(siteNameMatch?.[1] || titleMatch?.[1] || '')
  } finally {
    window.clearTimeout(timer)
  }
}

const AddAppModal: React.FC<AddAppModalProps> = (props) => {
  const { open = false, editingApp = null, onClose, onSuccess } = props
  const [form] = Form.useForm()
  const [activeSidebar, setActiveSidebar] = useState<AddAppModalSidebarMode>('nav')
  const [activeSubTab, setActiveSubTab] = useState<AppSort>('today')
  const [iconColor, setIconColor] = useState<string>('#1890ff')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [targetCategoryId, setTargetCategoryId] = useState('home')
  const [activeCategory, setActiveCategory] = useState<AppCategory>('all')
  const [saving, setSaving] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const autoFillIdRef = useRef(0)
  const lastAutoNameRef = useRef('')
  const urlValue = Form.useWatch('url', form)
  const categories = useAppCategoryStore((s) => s.categories)
  const initCategories = useAppCategoryStore((s) => s.init)

  useEffect(() => {
    void initCategories()
  }, [initCategories])

  useEffect(() => {
    if (open && editingApp) {
      form.setFieldsValue({
        name: editingApp.name,
        icon: editingApp.icon,
        iconText: /^(https?:\/\/|data:image\/)/.test(editingApp.icon)
          ? iconTextFromName(editingApp.name)
          : editingApp.icon.slice(0, 8),
        url: editingApp.url
      })
      setIconColor(editingApp.iconBg || '#1890ff')
      setTargetCategoryId(editingApp.categoryId || 'home')
      setActiveSidebar('custom')
    } else if (open) {
      form.resetFields()
      setActiveSidebar('nav')
      setActiveSubTab('today')
      setIconColor('#1890ff')
      setSearchKeyword('')
      setTargetCategoryId('home')
      setActiveCategory('all')
      lastAutoNameRef.current = ''
    }
  }, [open, editingApp, form])

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: `添加到：${category.name}`
  }))

  const recommendedApps = activeSidebar === 'widgets' ? widgetApps : navApps

  const filteredRecommendedApps = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    const list = recommendedApps.filter((app) => {
      const matchCategory = activeCategory === 'all' || app.category === activeCategory
      const matchKeyword =
        !keyword ||
        [app.name, app.url, app.desc].some((value) => value.toLowerCase().includes(keyword))
      return matchCategory && matchKeyword
    })

    return [...list].sort((a, b) => {
      if (activeSubTab === 'popular') return b.popularity - a.popularity
      if (activeSubTab === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      return 0
    })
  }, [activeCategory, activeSidebar, activeSubTab, recommendedApps, searchKeyword])

  const handleSidebarChange = (mode: AddAppModalSidebarMode) => {
    setActiveSidebar(mode)
    setActiveCategory('all')
    setActiveSubTab('today')
  }

  const autoFillWebsiteInfo = async (url: string, manual = false) => {
    const requestId = autoFillIdRef.current + 1
    autoFillIdRef.current = requestId
    const icon = faviconUrlFromInput(url)
    const fallbackName = fallbackNameFromUrl(url)

    if (!icon) {
      if (manual) message.warning('请先输入有效的网站地址')
      return
    }

    const currentName = String(form.getFieldValue('name') || '').trim()
    const canFillName = !currentName || currentName === lastAutoNameRef.current

    form.setFieldValue('icon', icon)
    if (fallbackName && canFillName) {
      form.setFieldValue('name', fallbackName)
      form.setFieldValue('iconText', iconTextFromName(fallbackName))
      lastAutoNameRef.current = fallbackName
    }

    setAutoFilling(true)
    try {
      const title = await getWebsiteTitle(url)
      if (autoFillIdRef.current !== requestId) return
      const latestName = String(form.getFieldValue('name') || '').trim()
      const canOverwriteName = !latestName || latestName === fallbackName || latestName === lastAutoNameRef.current
      if (title && canOverwriteName) {
        form.setFieldValue('name', title)
        form.setFieldValue('iconText', iconTextFromName(title))
        lastAutoNameRef.current = title
      }
      if (manual) message.success(title ? '已获取网站信息' : '已获取网站图标')
    } catch (error) {
      if (manual) message.info('已获取网站图标，网站名称读取失败')
    } finally {
      if (autoFillIdRef.current === requestId) setAutoFilling(false)
    }
  }

  useEffect(() => {
    if (!open || activeSidebar !== 'custom' || editingApp) return
    const url = String(urlValue || '').trim()
    if (!url) return

    const timer = window.setTimeout(() => {
      void autoFillWebsiteInfo(url)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [activeSidebar, editingApp, open, urlValue])

  const handleFetchIcon = () => {
    void autoFillWebsiteInfo(form.getFieldValue('url'), true)
  }

  const addRecommendedApp = async (app: RecommendedApp) => {
    setSaving(true)
    try {
      const icon = await resolveFaviconIcon(app.url)
      await appGridService.add({
        name: app.name,
        icon: icon || app.icon,
        iconBg: app.iconBg,
        url: normalizeUrl(app.url),
        categoryId: targetCategoryId,
        widgetSpan: app.widgetSpan
      })
      message.success(`已添加 ${app.name}`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('添加失败:', error)
      message.error('添加失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const saveCustomApp = async (closeAfterSave: boolean) => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      const { iconText: _iconText, ...appValues } = values
      const icon = String(values.icon || '').trim()
      const name = displayNameFromValues(values.name, values.url)
      const iconText = iconTextFromName(values.iconText || name)
      const resolvedIcon = /^https?:\/\//i.test(icon)
        ? await resolveFaviconIcon(values.url)
        : icon
      const payload = {
        ...appValues,
        name,
        icon: resolvedIcon || iconText,
        iconBg: iconColor,
        url: normalizeUrl(values.url),
        categoryId: targetCategoryId
      }

      if (editingApp) {
        await appGridService.update(editingApp.id, payload)
        message.success('更新成功')
        onSuccess()
        onClose()
        return
      }

      await appGridService.add(payload as AddAppParams)
      message.success('添加成功')
      onSuccess()

      if (closeAfterSave) {
        form.resetFields()
        onClose()
      } else {
        form.resetFields()
        setIconColor('#1890ff')
      }
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const listNode =
    filteredRecommendedApps.length === 0 ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='没有找到匹配的应用' />
    ) : activeSidebar === 'widgets' ? (
      <AddAppModalWidgets
        apps={filteredRecommendedApps}
        activeCategory={activeCategory}
        categories={categoryItems}
        activeSubTab={activeSubTab}
        loading={saving}
        onChangeCategory={setActiveCategory}
        onChangeSubTab={setActiveSubTab}
        onAddApp={addRecommendedApp}
      />
    ) : (
      <AddAppModalNav
        apps={filteredRecommendedApps}
        activeCategory={activeCategory}
        categories={categoryItems}
        activeSubTab={activeSubTab}
        loading={saving}
        onChangeCategory={setActiveCategory}
        onChangeSubTab={setActiveSubTab}
        onAddApp={addRecommendedApp}
      />
    )

  return (
    <Modal
      title={editingApp ? '编辑应用' : '添加应用'}
      open={open}
      onCancel={handleCancel}
      rootClassName={styles.addAppModalRoot}
      centered
      width={1000}
      transitionName=''
      maskTransitionName={modalMaskTransitionName}
      maskStyle={modalMaskStyle}
      styles={{ body: { height: 'min(720px, calc(100vh - 160px))' } }}
      footer={null}
      destroyOnHidden
    >
      <div className={styles.addAppModal}>
        <AddAppModalSidebar active={activeSidebar} onChange={handleSidebarChange} />

        <div className={styles.addAppContent}>
          <div className={styles.addAppHeader}>
            <div>{editingApp ? '调整应用信息和所属分类' : '选择常用网站快速添加，或切换到“自定义图标”手动填写'}</div>
          </div>

          <div className={styles.addAppSearchRow}>
            <Input.Search
              placeholder={activeSidebar === 'custom' ? '自定义模式无需搜索' : '搜索站点或应用'}
              allowClear
              disabled={activeSidebar === 'custom'}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <Select
              style={{ width: 160 }}
              value={targetCategoryId}
              options={categoryOptions.length ? categoryOptions : [{ value: 'home', label: '添加到：主页' }]}
              onChange={setTargetCategoryId}
            />
          </div>

          {activeSidebar === 'custom' ? (
            <AddAppModalCustom
              form={form}
              iconColor={iconColor}
              loading={saving}
              autoFilling={autoFilling}
              onIconColorChange={setIconColor}
              onFetchIcon={handleFetchIcon}
              onSave={() => void saveCustomApp(true)}
              onSaveAndContinue={() => void saveCustomApp(false)}
            />
          ) : (
            listNode
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AddAppModal
