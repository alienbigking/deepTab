import { atom } from 'recoil'

const feedbackListStore = atom({
  key: 'feedbackListStore',
  default: []
})

export default { feedbackListStore }
