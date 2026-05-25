import { create } from 'zustand'
import authService from '../services/auth'
import type { AuthStore } from '../types/auth'

const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isLoading: false,

  setSession: (session) => set({ session }),

  init: async () => {
    set({ isLoading: true })
    try {
      const session = await authService.getSession()
      set({ session })
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (params) => {
    set({ isLoading: true })
    try {
      const session = await authService.login(params)
      set({ session })
      return session
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (params) => {
    set({ isLoading: true })
    try {
      await authService.register(params)
    } finally {
      set({ isLoading: false })
    }
  },

  uploadAvatar: async (file) => {
    set({ isLoading: true })
    try {
      const session = await authService.uploadAvatar(file)
      set({ session })
      return session
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await authService.clearSession()
    set({ session: null })
  }
}))

export default useAuthStore
