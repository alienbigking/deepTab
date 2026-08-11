import React, { useEffect, useState } from 'react'
import { App, Button, Form, Input, Modal, Tabs } from 'antd'
import useAuthStore from './stores/auth'
import styles from './authModal.module.less'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      message.success(t('auth.loginSuccess', { defaultValue: 'Signed in successfully' }))
      onClose()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || t('auth.loginFailed', { defaultValue: 'Sign-in failed. Check your account and password.' }))
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
      message.success(t('auth.registerSuccess', { defaultValue: 'Registration complete. Please sign in.' }))
      loginForm.setFieldsValue({
        userIdentifier: values.identifier,
        password: values.password
      })
      setMode('login')
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || t('auth.registerFailed', { defaultValue: 'Registration failed. Try again later.' }))
    }
  }

  return (
    <Modal
      open={open}
      title={t('auth.title', { defaultValue: 'Deep Tab account' })}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      rootClassName={styles.authModalRoot}
      className={styles.authModal}
      transitionName=''
      maskTransitionName={modalMaskTransitionName}
      maskStyle={modalMaskStyle}
      destroyOnHidden
    >
      <Tabs
        activeKey={mode}
        onChange={(key) => setMode(key as AuthMode)}
        items={[
          {
            key: 'login',
            label: t('auth.login', { defaultValue: 'Sign in' }),
            children: (
              <Form form={loginForm} layout='vertical' requiredMark={false}>
                <Form.Item
                  name='userIdentifier'
                  label={t('auth.account', { defaultValue: 'Account' })}
                  rules={[{ required: true, message: t('auth.accountRequired', { defaultValue: 'Enter a username, email, or phone number' }) }]}
                >
                  <Input autoComplete='username' placeholder={t('auth.accountPlaceholder', { defaultValue: 'Username / Email / Phone' })} />
                </Form.Item>
                <Form.Item
                  name='password'
                  label={t('auth.password', { defaultValue: 'Password' })}
                  rules={[{ required: true, message: t('auth.passwordRequired', { defaultValue: 'Enter your password' }) }]}
                >
                  <Input.Password autoComplete='current-password' placeholder={t('auth.passwordRequired', { defaultValue: 'Enter your password' })} />
                </Form.Item>
                <div className={styles.footer}>
                  <Button onClick={onClose}>{t('common.cancel')}</Button>
                  <Button type='primary' loading={isLoading} onClick={handleLogin}>
                    {t('auth.login', { defaultValue: 'Sign in' })}
                  </Button>
                </div>
              </Form>
            )
          },
          {
            key: 'register',
            label: t('auth.register', { defaultValue: 'Register' }),
            children: (
              <Form form={registerForm} layout='vertical' requiredMark={false}>
                <Form.Item
                  name='identifier'
                  label={t('auth.account', { defaultValue: 'Account' })}
                  rules={[
                    { required: true, message: t('auth.accountRequired', { defaultValue: 'Enter a username, email, or phone number' }) },
                    { min: 3, message: t('auth.accountMin', { defaultValue: 'Account must contain at least 3 characters' }) }
                  ]}
                >
                  <Input autoComplete='username' placeholder={t('auth.accountPlaceholder', { defaultValue: 'Username / Email / Phone' })} />
                </Form.Item>
                <Form.Item name='nickname' label={t('auth.nickname', { defaultValue: 'Nickname' })}>
                  <Input autoComplete='nickname' placeholder={t('auth.optional', { defaultValue: 'Optional' })} />
                </Form.Item>
                <Form.Item
                  name='password'
                  label={t('auth.password', { defaultValue: 'Password' })}
                  rules={[
                    { required: true, message: t('auth.passwordRequired', { defaultValue: 'Enter your password' }) },
                    { min: 6, message: t('auth.passwordMin', { defaultValue: 'Password must contain at least 6 characters' }) }
                  ]}
                >
                  <Input.Password autoComplete='new-password' placeholder={t('auth.passwordRequired', { defaultValue: 'Enter your password' })} />
                </Form.Item>
                <div className={styles.footer}>
                  <Button onClick={onClose}>{t('common.cancel')}</Button>
                  <Button type='primary' loading={isLoading} onClick={handleRegister}>
                    {t('auth.register', { defaultValue: 'Register' })}
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
