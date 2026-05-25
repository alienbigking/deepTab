import React, { useEffect, useState } from 'react'
import { App, Button, Form, Input, Modal, Tabs } from 'antd'
import useAuthStore from './stores/auth'
import styles from './authModal.module.less'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

type AuthMode = 'login' | 'register'

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const { message } = App.useApp()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!open) return
    loginForm.resetFields()
    registerForm.resetFields()
    setMode('login')
  }, [loginForm, open, registerForm])

  const handleLogin = async () => {
    try {
      const values = await loginForm.validateFields()
      await login({
        userIdentifier: values.userIdentifier,
        password: values.password
      })
      message.success('登录成功')
      onClose()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || '登录失败，请检查账号或密码')
    }
  }

  const handleRegister = async () => {
    try {
      const values = await registerForm.validateFields()
      await register({
        username: values.identifier,
        password: values.password,
        nickname: values.nickname
      })
      message.success('注册成功，请登录')
      loginForm.setFieldsValue({
        userIdentifier: values.identifier,
        password: values.password
      })
      setMode('login')
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || '注册失败，请稍后再试')
    }
  }

  return (
    <Modal
      open={open}
      title='Deep Tab 账号'
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      className={styles.authModal}
      destroyOnHidden
    >
      <Tabs
        activeKey={mode}
        onChange={(key) => setMode(key as AuthMode)}
        items={[
          {
            key: 'login',
            label: '登录',
            children: (
              <Form form={loginForm} layout='vertical' requiredMark={false}>
                <Form.Item
                  name='userIdentifier'
                  label='账号'
                  rules={[{ required: true, message: '请输入用户名、邮箱或手机号' }]}
                >
                  <Input autoComplete='username' placeholder='用户名 / 邮箱 / 手机号' />
                </Form.Item>
                <Form.Item
                  name='password'
                  label='密码'
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password autoComplete='current-password' placeholder='请输入密码' />
                </Form.Item>
                <div className={styles.footer}>
                  <Button onClick={onClose}>取消</Button>
                  <Button type='primary' loading={isLoading} onClick={handleLogin}>
                    登录
                  </Button>
                </div>
              </Form>
            )
          },
          {
            key: 'register',
            label: '注册',
            children: (
              <Form form={registerForm} layout='vertical' requiredMark={false}>
                <Form.Item
                  name='identifier'
                  label='账号'
                  rules={[
                    { required: true, message: '请输入用户名、邮箱或手机号' },
                    { min: 3, message: '账号至少 3 个字符' }
                  ]}
                >
                  <Input autoComplete='username' placeholder='用户名 / 邮箱 / 手机号' />
                </Form.Item>
                <Form.Item name='nickname' label='昵称'>
                  <Input autoComplete='nickname' placeholder='可选' />
                </Form.Item>
                <Form.Item
                  name='password'
                  label='密码'
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少 6 个字符' }
                  ]}
                >
                  <Input.Password autoComplete='new-password' placeholder='请输入密码' />
                </Form.Item>
                <div className={styles.footer}>
                  <Button onClick={onClose}>取消</Button>
                  <Button type='primary' loading={isLoading} onClick={handleRegister}>
                    注册
                  </Button>
                </div>
              </Form>
            )
          }
        ]}
      />
    </Modal>
  )
}

export default AuthModal
