import { atom } from 'recoil'
import { IThemeConfig } from '../types/theme'

const themeConfigStore = atom<IThemeConfig>({
  key: 'themeConfigStore',
  default: {
    mode: 'auto',
    primaryColor: '#ff6b35',
    borderRadius: 8
  }
})

export default { themeConfigStore }
