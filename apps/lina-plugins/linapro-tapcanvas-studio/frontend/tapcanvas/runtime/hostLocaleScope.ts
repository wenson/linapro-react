import type { PluginHostLocale } from '@linapro/plugin-ui'

type ActiveHostLocale = {
  locale: PluginHostLocale
  token: symbol
}

let activeHostLocale: ActiveHostLocale | null = null

export function activateTapCanvasHostLocale(locale: PluginHostLocale): { dispose: () => void } {
  const token = Symbol(locale)
  activeHostLocale = { locale, token }
  return {
    dispose() {
      if (activeHostLocale?.token === token) activeHostLocale = null
    },
  }
}

export function getTapCanvasHostLocale(): PluginHostLocale {
  return activeHostLocale?.locale ?? 'zh-CN'
}
