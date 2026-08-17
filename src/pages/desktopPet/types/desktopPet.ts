export interface DesktopPetPosition {
  x: number
  y: number
}

export interface DesktopPetConfig {
  configVersion: number
  enabled: boolean
  animationEnabled: boolean
  quietMode: boolean
  proactiveMessages: boolean
  quoteEnabled: boolean
  sedentaryReminderEnabled: boolean
  todoReminderEnabled: boolean
  weatherCareEnabled: boolean
  holidayGreetingEnabled: boolean
  messageFrequencyMinutes: number
  sedentaryMinutes: number
  size: number
  position: DesktopPetPosition
}

export type DesktopPetMood = 'idle' | 'happy' | 'sleepy' | 'focus'

export interface DesktopPetMessage {
  id: string
  content: string
  mood: DesktopPetMood
  durationSeconds?: number
  important?: boolean
}

export interface DesktopPetFocusTimer {
  mode: 'focus' | 'break'
  status: 'idle' | 'running' | 'paused'
  durationMinutes: number
  endAt: number
  remainingSeconds: number
}
