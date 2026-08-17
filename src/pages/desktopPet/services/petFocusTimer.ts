import type { DesktopPetFocusTimer } from '../types/desktopPet'

export const PET_FOCUS_TIMER_KEY = 'desktopPetFocusTimer'
export const PET_FOCUS_TIMER_EVENT = 'dt:petFocusTimerChanged'

const idleTimer: DesktopPetFocusTimer = {
  mode: 'focus',
  status: 'idle',
  durationMinutes: 25,
  endAt: 0,
  remainingSeconds: 25 * 60
}

const normalize = (value?: Partial<DesktopPetFocusTimer>): DesktopPetFocusTimer => ({
  mode: value?.mode === 'break' ? 'break' : 'focus',
  status: value?.status === 'running' || value?.status === 'paused' ? value.status : 'idle',
  durationMinutes: Math.max(1, Math.min(Number(value?.durationMinutes) || 25, 120)),
  endAt: Number(value?.endAt) || 0,
  remainingSeconds: Math.max(0, Number(value?.remainingSeconds) || 0)
})

const notify = () => window.dispatchEvent(new CustomEvent(PET_FOCUS_TIMER_EVENT))

export default {
  async get(): Promise<DesktopPetFocusTimer> {
    const result = await chrome.storage.local.get([PET_FOCUS_TIMER_KEY])
    return result[PET_FOCUS_TIMER_KEY] ? normalize(result[PET_FOCUS_TIMER_KEY]) : idleTimer
  },
  async save(timer: DesktopPetFocusTimer): Promise<void> {
    await chrome.storage.local.set({ [PET_FOCUS_TIMER_KEY]: normalize(timer) })
    notify()
  },
  async start(mode: 'focus' | 'break', durationMinutes: number): Promise<void> {
    const seconds = Math.max(1, durationMinutes) * 60
    await this.save({
      mode,
      status: 'running',
      durationMinutes,
      endAt: Date.now() + seconds * 1000,
      remainingSeconds: seconds
    })
  },
  async pause(): Promise<void> {
    const timer = await this.get()
    if (timer.status !== 'running') return
    await this.save({
      ...timer,
      status: 'paused',
      remainingSeconds: Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)),
      endAt: 0
    })
  },
  async resume(): Promise<void> {
    const timer = await this.get()
    if (timer.status !== 'paused') return
    await this.save({
      ...timer,
      status: 'running',
      endAt: Date.now() + timer.remainingSeconds * 1000
    })
  },
  async reset(): Promise<void> {
    await this.save(idleTimer)
  }
}
