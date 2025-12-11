import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, message, Button, Select } from 'antd'
import cn from 'classnames'
import type { Apps, AddAppParams } from './types/appGrid'
import appGridService from './services/appGrid'
import styles from './addAppModal.module.less'
import AddAppModalSidebar, { AddAppModalSidebarMode } from './addAppModalSidebar'
import AddAppModalCustom from './addAppModalCustom'
import AddAppModalWidgets from './addAppModalWidgets'
import AddAppModalNav from './addAppModalNav'

interface AddAppModalProps {
  open: boolean
  editingApp?: Apps | null
  onClose: () => void
  onSuccess: () => void
}

const AddAppModal: React.FC<AddAppModalProps> = (props) => {
  const { open = false, editingApp = null, onClose, onSuccess } = props
  const [form] = Form.useForm()
  const [activeSidebar, setActiveSidebar] = useState<AddAppModalSidebarMode>('nav')
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'recent' | 'popular'>('today')
  const [iconColor, setIconColor] = useState<string>('#1890ff')

  // 编辑时填充表单
  useEffect(() => {
    if (open && editingApp) {
      form.setFieldsValue({
        name: editingApp.name,
        icon: editingApp.icon,
        url: editingApp.url
      })
      setActiveSidebar('custom')
    } else if (open) {
      form.resetFields()
      setActiveSidebar('nav')
      setActiveSubTab('today')
      setIconColor('#1890ff')
    }
  }, [open, editingApp, form])

  const recommendedApps: { key: string; name: string; icon: string; url: string; desc: string }[] =
    [
      {
        key: 'google',
        name: 'Google 搜索',
        icon: '🔍',
        url: 'https://www.google.com',
        desc: '快速打开 Google 搜索'
      },
      {
        key: 'github',
        name: 'GitHub',
        icon: '🐱',
        url: 'https://github.com',
        desc: '访问你的代码仓库'
      },
      {
        key: 'chatgpt',
        name: 'ChatGPT',
        icon: '🤖',
        url: 'https://chat.openai.com',
        desc: 'AI 助手，提升效率'
      },
      {
        key: 'bilibili',
        name: '哔哩哔哩',
        icon: '📺',
        url: 'https://www.bilibili.com',
        desc: '追番与学习两不误'
      },
      {
        key: 'youtube',
        name: 'YouTube',
        icon: '▶️',
        url: 'https://www.youtube.com',
        desc: '全球最大视频平台'
      },
      {
        key: 'twitter',
        name: 'Twitter',
        icon: '🐦',
        url: 'https://twitter.com',
        desc: '关注全球实时热点'
      }
    ]

  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingApp) {
        // 更新应用
        await appGridService.update(editingApp.id, values)
        message.success('更新成功')
      } else {
        // 添加应用
        await appGridService.add(values as AddAppParams)
        message.success('添加成功')
      }

      form.resetFields()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={editingApp ? '编辑应用' : '添加应用'}
      open={open}
      onCancel={handleCancel}
      rootClassName={styles.addAppModalRoot}
      centered
      width={1000}
      bodyStyle={{ minHeight: 600 }}
      footer={null}
      destroyOnClose
    >
      <div className={styles.addAppModal}>
        <AddAppModalSidebar active={activeSidebar} onChange={setActiveSidebar} />

        <div className={styles.addAppContent}>
          <div className={styles.addAppHeader}>
            <div>选择常用网站快速添加，或切换到“自定义图标”手动填写</div>
          </div>

          {/* 第一块：搜索 + 添加到 */}
          <div className={styles.addAppSearchRow}>
            <Input.Search placeholder='搜索站点或应用' allowClear />
            <Select
              style={{ width: 140 }}
              defaultValue='home'
              options={[
                { value: 'home', label: '添加到：主页' },
                { value: 'work', label: '添加到：工作区' }
              ]}
            />
          </div>
          {activeSidebar === 'custom' ? (
            <AddAppModalCustom
              form={form}
              iconColor={iconColor}
              onIconColorChange={setIconColor}
              onSave={handleOk}
              onSaveAndContinue={async () => {
                await handleOk()
                setActiveSidebar('custom')
              }}
            />
          ) : activeSidebar === 'widgets' ? (
            <AddAppModalWidgets
              apps={recommendedApps}
              activeSubTab={activeSubTab}
              onChangeSubTab={(key) => setActiveSubTab(key)}
              onAddApp={async (app) => {
                try {
                  await appGridService.add({
                    name: app.name,
                    icon: app.icon,
                    url: app.url
                  })
                  message.success(`已添加 ${app.name}`)
                  onSuccess()
                  onClose()
                } catch (error) {
                  console.error('添加失败:', error)
                  message.error('添加失败，请稍后重试')
                }
              }}
            />
          ) : (
            <AddAppModalNav
              apps={recommendedApps}
              activeSubTab={activeSubTab}
              onChangeSubTab={(key) => setActiveSubTab(key)}
              onAddApp={async (app) => {
                try {
                  await appGridService.add({
                    name: app.name,
                    icon: app.icon,
                    url: app.url
                  })
                  message.success(`已添加 ${app.name}`)
                  onSuccess()
                  onClose()
                } catch (error) {
                  console.error('添加失败:', error)
                  message.error('添加失败，请稍后重试')
                }
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AddAppModal
