import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useWidgetsContainerStore from '@/pages/widgetsContainer/stores/widgetsContainer'
import widgetsContainerService from '@/pages/widgetsContainer/services/widgetsContainer'
import petFocusTimerService, { PET_FOCUS_TIMER_EVENT } from '../services/petFocusTimer'
import petMessagesService from '../services/petMessages'
import type { DesktopPetConfig, DesktopPetMessage, DesktopPetMood } from '../types/desktopPet'

const TODO_SEEN_KEY = 'desktopPetTodoReminderSeen'
const MESSAGE_GAP_MS = 12_000

const fixedHolidayKeys: Record<string, string> = {
  '01-01': 'newYear',
  '02-14': 'valentinesDay',
  '03-08': 'womensDay',
  '04-01': 'aprilFoolsDay',
  '05-01': 'laborDay',
  '10-31': 'halloween',
  '12-24': 'christmasEve',
  '12-25': 'christmasDay'
}

const chineseSolarHolidays: Record<string, string> = {
  '01-01': '元旦',
  '05-01': '劳动节',
  '06-01': '儿童节',
  '09-10': '教师节',
  '10-01': '国庆节'
}

const chineseLunarHolidays: Record<string, string> = {
  '正月-1': '春节',
  '正月-15': '元宵节',
  '五月-5': '端午节',
  '八月-15': '中秋节',
  '九月-9': '重阳节'
}

const getChineseHoliday = (date: Date, dateKey: string) => {
  try {
    const text = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      month: 'long',
      day: 'numeric'
    }).format(date)
    const match = text.match(/(.+月)(\d+)日/)
    const lunarKey = match ? `${match[1].replace(/^闰/, '')}-${Number(match[2])}` : ''
    return chineseLunarHolidays[lunarKey] || chineseSolarHolidays[dateKey] || ''
  } catch {
    return chineseSolarHolidays[dateKey] || ''
  }
}

const randomItem = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const getGreetingPeriod = () => {
  const hour = new Date().getHours()
  if (hour < 6) return 'lateNight'
  if (hour < 11) return 'morning'
  if (hour < 14) return 'noon'
  if (hour < 18) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'restEarly'
}

export default function usePetCompanion(config: DesktopPetConfig) {
  const { t, i18n } = useTranslation()
  const weather = useWidgetsContainerStore((state) => state.weatherData)
  const todos = useWidgetsContainerStore((state) => state.todoList)
  const [message, setMessage] = useState<DesktopPetMessage | null>(null)
  const [mood, setMood] = useState<DesktopPetMood>('idle')
  const hideTimerRef = useRef<number | null>(null)
  const lastMessageAtRef = useRef(0)
  const activeSinceRef = useRef(Date.now())
  const lastQuoteAtRef = useRef(Date.now())
  const lastWeatherAtRef = useRef(0)
  const lastHolidayDateRef = useRef('')
  const focusCompletionRef = useRef('')
  const lastGreetingPeriodRef = useRef('')

  const showMessage = useCallback(
    (
      content: string,
      nextMood: DesktopPetMood = 'happy',
      durationSeconds = 6,
      important = false
    ) => {
      if (!content || (!important && Date.now() - lastMessageAtRef.current < MESSAGE_GAP_MS)) return
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      const next = {
        id: `${Date.now()}_${Math.random()}`,
        content,
        mood: nextMood,
        durationSeconds,
        important
      }
      setMessage(next)
      setMood(nextMood)
      lastMessageAtRef.current = Date.now()
      hideTimerRef.current = window.setTimeout(() => {
        setMessage(null)
        setMood('idle')
      }, durationSeconds * 1000)
    },
    []
  )

  const timeGreeting = useCallback(() => {
    return t(`pet.messages.${getGreetingPeriod()}`)
  }, [t])

  const showRandomEncouragement = useCallback(async () => {
    const language = i18n.resolvedLanguage || i18n.language || 'en'
    const remote = config.quoteEnabled
      ? await petMessagesService.getRandom(
          language,
          Math.random() > 0.5 ? 'wisdom' : 'encouragement'
        )
      : null
    const fallback = randomItem([
      t('pet.messages.happyToday'),
      t('pet.messages.takeItEasy'),
      t('pet.messages.smallStep'),
      t('pet.messages.beKindToYourself')
    ])
    showMessage(remote?.content || fallback, 'happy', remote?.durationSeconds || 6)
  }, [config.quoteEnabled, i18n.language, i18n.resolvedLanguage, showMessage, t])

  const checkTodo = useCallback(async () => {
    if (!config.todoReminderEnabled) return false
    const currentTodos = todos.length ? todos : await widgetsContainerService.getTodoList()
    const due = currentTodos.find(
      (item) => !item.completed && item.reminderAt && item.reminderAt <= Date.now()
    )
    if (!due) return false
    const key = `${due.id}:${due.reminderAt}`
    const stored = await chrome.storage.local.get([TODO_SEEN_KEY])
    const seen = Array.isArray(stored[TODO_SEEN_KEY]) ? stored[TODO_SEEN_KEY] : []
    if (seen.includes(key)) return false
    await chrome.storage.local.set({ [TODO_SEEN_KEY]: [...seen.slice(-99), key] })
    showMessage(t('pet.messages.todoDue', { task: due.text }), 'happy', 8, true)
    return true
  }, [config.todoReminderEnabled, showMessage, t, todos])

  const checkFocus = useCallback(async () => {
    const timer = await petFocusTimerService.get()
    if (timer.status !== 'running') {
      if (timer.status === 'paused') setMood('focus')
      else setMood((current) => (current === 'focus' ? 'idle' : current))
      return false
    }
    setMood('focus')
    if (timer.endAt > Date.now()) return false
    const completionKey = `${timer.mode}:${timer.endAt}`
    if (focusCompletionRef.current === completionKey) return false
    focusCompletionRef.current = completionKey
    await petFocusTimerService.reset()
    showMessage(
      timer.mode === 'focus' ? t('pet.messages.focusComplete') : t('pet.messages.breakComplete'),
      'happy',
      8,
      true
    )
    return true
  }, [showMessage, t])

  const checkWeather = useCallback(() => {
    if (
      !config.weatherCareEnabled ||
      !weather ||
      Date.now() - lastWeatherAtRef.current < 6 * 60 * 60 * 1000
    )
      return false
    let content = ''
    if ((weather.precipitationProbability || 0) >= 60 || /rain|storm/.test(weather.condition))
      content = t('pet.messages.rainCare')
    else if (weather.temperature >= 32) content = t('pet.messages.hotCare')
    else if (weather.temperature <= 8) content = t('pet.messages.coldCare')
    if (!content) return false
    lastWeatherAtRef.current = Date.now()
    showMessage(content, 'happy', 7)
    return true
  }, [config.weatherCareEnabled, showMessage, t, weather])

  const checkHoliday = useCallback(() => {
    if (!config.holidayGreetingEnabled) return false
    const now = new Date()
    const dateKey = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const language = i18n.resolvedLanguage || i18n.language || 'en'
    const holiday =
      language === 'zh-CN'
        ? getChineseHoliday(now, dateKey)
        : fixedHolidayKeys[dateKey]
          ? t(`internationalHolidays.${fixedHolidayKeys[dateKey]}`)
          : ''
    if (lastHolidayDateRef.current === dateKey || !holiday) return false
    lastHolidayDateRef.current = dateKey
    showMessage(t('pet.messages.holidayGreeting', { holiday }), 'happy', 8)
    return true
  }, [config.holidayGreetingEnabled, i18n.language, i18n.resolvedLanguage, showMessage, t])

  useEffect(() => {
    if (!config.enabled || config.quietMode || !config.proactiveMessages) return
    const initial = window.setTimeout(() => {
      lastGreetingPeriodRef.current = getGreetingPeriod()
      if (!checkHoliday())
        showMessage(timeGreeting(), new Date().getHours() >= 22 ? 'sleepy' : 'happy', 7)
    }, 10_000)
    const tick = window.setInterval(async () => {
      if (document.hidden || config.quietMode) return
      if (await checkFocus()) return
      if (await checkTodo()) return
      if (checkWeather() || checkHoliday()) return
      const greetingPeriod = getGreetingPeriod()
      if (lastGreetingPeriodRef.current && lastGreetingPeriodRef.current !== greetingPeriod) {
        lastGreetingPeriodRef.current = greetingPeriod
        showMessage(
          timeGreeting(),
          greetingPeriod === 'restEarly' || greetingPeriod === 'lateNight' ? 'sleepy' : 'happy',
          7
        )
        return
      }
      if (
        config.sedentaryReminderEnabled &&
        Date.now() - activeSinceRef.current >= config.sedentaryMinutes * 60_000
      ) {
        activeSinceRef.current = Date.now()
        showMessage(
          randomItem([
            t('pet.messages.standUp'),
            t('pet.messages.drinkWater'),
            t('pet.messages.lookFar')
          ]),
          'happy',
          8
        )
        return
      }
      if (
        config.quoteEnabled &&
        Date.now() - lastQuoteAtRef.current >= config.messageFrequencyMinutes * 60_000
      ) {
        lastQuoteAtRef.current = Date.now()
        await showRandomEncouragement()
      }
    }, 30_000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(tick)
    }
  }, [
    checkFocus,
    checkHoliday,
    checkTodo,
    checkWeather,
    config.enabled,
    config.messageFrequencyMinutes,
    config.proactiveMessages,
    config.quietMode,
    config.quoteEnabled,
    config.sedentaryMinutes,
    config.sedentaryReminderEnabled,
    showMessage,
    showRandomEncouragement,
    t,
    timeGreeting
  ])

  useEffect(() => {
    const onFocusChange = () => void checkFocus()
    const focusTick = window.setInterval(() => void checkFocus(), 5000)
    window.addEventListener(PET_FOCUS_TIMER_EVENT, onFocusChange)
    return () => {
      window.clearInterval(focusTick)
      window.removeEventListener(PET_FOCUS_TIMER_EVENT, onFocusChange)
    }
  }, [checkFocus])

  useEffect(
    () => () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    },
    []
  )

  return {
    message,
    mood,
    greet: () => showMessage(timeGreeting(), 'happy', 5, true),
    play: () =>
      showMessage(
        randomItem([t('pet.messages.playOne'), t('pet.messages.playTwo')]),
        'happy',
        5,
        true
      ),
    dragged: () => showMessage(t('pet.messages.newPlace'), 'happy', 4, true)
  }
}
