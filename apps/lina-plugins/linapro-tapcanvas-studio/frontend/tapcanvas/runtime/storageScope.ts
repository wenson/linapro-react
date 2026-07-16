const STORAGE_NAMESPACE = 'linapro:tapcanvas-studio:v1'

type ActiveStorageScope = {
  token: symbol
  workspaceKey: string
}

let activeScope: ActiveStorageScope | null = null

function buildScopedKey(workspaceKey: string, key: string): string {
  return `${STORAGE_NAMESPACE}:${workspaceKey}:${key}`
}

function getActiveScopedKey(key: string): string | null {
  const normalizedKey = String(key || '').trim()
  if (!activeScope || !normalizedKey) return null
  return buildScopedKey(activeScope.workspaceKey, normalizedKey)
}

export function activateTapCanvasStorageScope(workspaceKey: string): { dispose: () => void } {
  const normalizedWorkspaceKey = String(workspaceKey || '').trim()
  if (!normalizedWorkspaceKey) {
    throw new Error('TapCanvas storage scope requires a workspace key')
  }

  const token = Symbol(normalizedWorkspaceKey)
  activeScope = { token, workspaceKey: normalizedWorkspaceKey }

  return {
    dispose() {
      if (activeScope?.token === token) activeScope = null
    },
  }
}

export function getTapCanvasScopedStorageKey(key: string): string | null {
  return getActiveScopedKey(key)
}

export function readTapCanvasStorage(key: string): string | null {
  const scopedKey = getActiveScopedKey(key)
  if (!scopedKey || typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(scopedKey)
  } catch {
    return null
  }
}

export function writeTapCanvasStorage(key: string, value: string): boolean {
  const scopedKey = getActiveScopedKey(key)
  if (!scopedKey || typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(scopedKey, value)
    return true
  } catch {
    return false
  }
}

export function removeTapCanvasStorage(key: string): boolean {
  const scopedKey = getActiveScopedKey(key)
  if (!scopedKey || typeof window === 'undefined') return false
  try {
    window.localStorage.removeItem(scopedKey)
    return true
  } catch {
    return false
  }
}
