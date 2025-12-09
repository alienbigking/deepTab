import { atom } from 'recoil'

const relatedAppsStore = atom({
  key: 'relatedAppsStore',
  default: []
})

export default { relatedAppsStore }
