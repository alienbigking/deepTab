import React, { useEffect, useState } from 'react'
import { App, Button, Card, Slider, Space, Switch } from 'antd'
import {
  AimOutlined,
  CoffeeOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import petImage from '@/assets/images/pet/capybara-lulu.png'
import desktopPetService, { defaultDesktopPetConfig } from './services/desktopPet'
import type { DesktopPetConfig } from './types/desktopPet'
import styles from './desktopPetSettings.module.less'
import petFocusTimerService, { PET_FOCUS_TIMER_EVENT } from './services/petFocusTimer'
import type { DesktopPetFocusTimer } from './types/desktopPet'

const DesktopPetSettings: React.FC = () => {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [config, setConfig] = useState<DesktopPetConfig>(defaultDesktopPetConfig)
  const [focusTimer, setFocusTimer] = useState<DesktopPetFocusTimer | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    void desktopPetService.getConfig().then(setConfig)
  }, [])

  useEffect(() => {
    const load = () => void petFocusTimerService.get().then(setFocusTimer)
    load()
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    window.addEventListener(PET_FOCUS_TIMER_EVENT, load)
    return () => {
      window.clearInterval(tick)
      window.removeEventListener(PET_FOCUS_TIMER_EVENT, load)
    }
  }, [])

  const updateConfig = (patch: Partial<DesktopPetConfig>) => {
    const next = { ...config, ...patch }
    setConfig(next)
    void desktopPetService.saveConfig(next)
  }

  const resetPosition = async () => {
    const next = await desktopPetService.resetPosition()
    setConfig(next)
    message.success(t('pet.resetDone', { defaultValue: 'Pet position reset' }))
  }

  const remainingSeconds =
    focusTimer?.status === 'running'
      ? Math.max(0, Math.ceil((focusTimer.endAt - now) / 1000))
      : focusTimer?.remainingSeconds || 0
  const timerLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`

  return (
    <div className={styles.container}>
      <Card
        title={t('pet.title', { defaultValue: 'Desktop pet' })}
        className='dtSettingsCard'
        variant='borderless'
      >
        <div className={styles.layout}>
          <div className={styles.preview}>
            <div className={styles.previewGlow} />
            <img src={petImage} alt='' />
          </div>

          <div className={styles.settings}>
            <p className={styles.description}>
              {t('pet.description', {
                defaultValue: 'Add a draggable animated companion to your home page.'
              })}
            </p>

            <div className={styles.row}>
              <span>{t('pet.enabled', { defaultValue: 'Show desktop pet' })}</span>
              <Switch checked={config.enabled} onChange={(enabled) => updateConfig({ enabled })} />
            </div>

            <div className={styles.row}>
              <span>{t('pet.proactiveMessages')}</span>
              <Switch
                checked={config.proactiveMessages}
                onChange={(proactiveMessages) => updateConfig({ proactiveMessages })}
              />
            </div>
            <div className={styles.row}>
              <span>{t('pet.quietMode')}</span>
              <Switch
                checked={config.quietMode}
                onChange={(quietMode) => updateConfig({ quietMode })}
              />
            </div>
            <div className={styles.optionGrid}>
              {(
                [
                  ['quoteEnabled', 'pet.quoteEnabled'],
                  ['sedentaryReminderEnabled', 'pet.sedentaryReminder'],
                  ['todoReminderEnabled', 'pet.todoReminder'],
                  ['weatherCareEnabled', 'pet.weatherCare'],
                  ['holidayGreetingEnabled', 'pet.holidayGreeting']
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  <span>{t(label)}</span>
                  <Switch
                    size='small'
                    checked={config[key]}
                    onChange={(checked) => updateConfig({ [key]: checked })}
                  />
                </label>
              ))}
            </div>

            <div className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span>{t('pet.messageFrequency')}</span>
                <b>{config.messageFrequencyMinutes} min</b>
              </div>
              <Slider
                min={15}
                max={180}
                step={15}
                value={config.messageFrequencyMinutes}
                onChange={(messageFrequencyMinutes) => updateConfig({ messageFrequencyMinutes })}
              />
            </div>
            <div className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span>{t('pet.sedentaryInterval')}</span>
                <b>{config.sedentaryMinutes} min</b>
              </div>
              <Slider
                min={30}
                max={180}
                step={15}
                value={config.sedentaryMinutes}
                onChange={(sedentaryMinutes) => updateConfig({ sedentaryMinutes })}
              />
            </div>

            <div className={styles.focusPanel}>
              <div>
                <span>{t('pet.focusTimer')}</span>
                <strong>{timerLabel}</strong>
                <em>{focusTimer?.mode === 'break' ? t('pet.breakMode') : t('pet.focusMode')}</em>
              </div>
              <Space wrap>
                <Button
                  size='small'
                  icon={<PlayCircleOutlined />}
                  onClick={() => void petFocusTimerService.start('focus', 25)}
                >
                  {t('pet.startFocus')}
                </Button>
                <Button
                  size='small'
                  icon={<CoffeeOutlined />}
                  onClick={() => void petFocusTimerService.start('break', 5)}
                >
                  {t('pet.startBreak')}
                </Button>
                {focusTimer?.status === 'running' ? (
                  <Button
                    size='small'
                    icon={<PauseOutlined />}
                    onClick={() => void petFocusTimerService.pause()}
                  >
                    {t('pet.pause')}
                  </Button>
                ) : focusTimer?.status === 'paused' ? (
                  <Button
                    size='small'
                    icon={<PlayCircleOutlined />}
                    onClick={() => void petFocusTimerService.resume()}
                  >
                    {t('pet.resume')}
                  </Button>
                ) : null}
                <Button
                  size='small'
                  icon={<ReloadOutlined />}
                  onClick={() => void petFocusTimerService.reset()}
                >
                  {t('common.reset', { defaultValue: 'Reset' })}
                </Button>
              </Space>
            </div>

            <div className={styles.row}>
              <span>{t('pet.animation', { defaultValue: 'Pet animations' })}</span>
              <Switch
                checked={config.animationEnabled}
                onChange={(animationEnabled) => updateConfig({ animationEnabled })}
              />
            </div>

            <div className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span>{t('pet.size', { defaultValue: 'Pet size' })}</span>
                <b>{config.size}px</b>
              </div>
              <Slider
                min={100}
                max={240}
                value={config.size}
                onChange={(size) => updateConfig({ size })}
              />
            </div>

            <Button icon={<AimOutlined />} onClick={() => void resetPosition()}>
              {t('pet.resetPosition', { defaultValue: 'Reset pet position' })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DesktopPetSettings
