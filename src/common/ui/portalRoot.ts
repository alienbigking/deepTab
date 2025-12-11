let portalRoot: HTMLElement | null = null

export const setPortalRoot = (el: HTMLElement | null) => {
  portalRoot = el
}

export const getPortalRoot = (): HTMLElement | null => portalRoot
