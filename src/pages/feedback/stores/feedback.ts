import { create } from 'zustand'

interface FeedbackStore {
  feedbackList: any[]
  setFeedbackList: (list: any[]) => void
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  feedbackList: [],
  setFeedbackList: (feedbackList) => set({ feedbackList })
}))

export default useFeedbackStore
