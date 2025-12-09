import { atom } from 'recoil'

const showStore = atom({
  default: false,
  key: 'showStore'
})

const showStore1 = atom({
  default: false,
  key: 'showStore1'
})

export default { showStore, showStore1 }
