import { afterEach, describe, expect, it } from 'vitest'

import {
  hydrateTapCanvasUIStateFromStorage,
  resetTapCanvasUIStateForStorageScope,
  useUIStore,
} from '../ui/uiStore'
import { activateTapCanvasRequestScope, withTapCanvasRequestSignal } from './requestScope'
import {
  activateTapCanvasStorageScope,
  getTapCanvasScopedStorageKey,
  readTapCanvasStorage,
  writeTapCanvasStorage,
} from './storageScope'

const ALPHA_WORKSPACE = 'user:1|tenant:10|code:alpha|impersonated:0'
const BETA_WORKSPACE = 'user:1|tenant:20|code:beta|impersonated:1'

afterEach(() => {
  localStorage.clear()
  resetTapCanvasUIStateForStorageScope()
})

describe('TapCanvas workspace storage scope', () => {
  it('includes the LinaPro user, tenant and impersonation projection in every key', () => {
    const scope = activateTapCanvasStorageScope(ALPHA_WORKSPACE)

    expect(getTapCanvasScopedStorageKey('draft')).toBe(
      `linapro:tapcanvas-studio:v1:${ALPHA_WORKSPACE}:draft`,
    )

    scope.dispose()
    expect(getTapCanvasScopedStorageKey('draft')).toBeNull()
  })

  it('does not read another tenant workspace draft', () => {
    const alpha = activateTapCanvasStorageScope(ALPHA_WORKSPACE)
    expect(writeTapCanvasStorage('draft', 'alpha-draft')).toBe(true)
    alpha.dispose()

    const beta = activateTapCanvasStorageScope(BETA_WORKSPACE)
    expect(readTapCanvasStorage('draft')).toBeNull()
    expect(writeTapCanvasStorage('draft', 'beta-draft')).toBe(true)
    beta.dispose()

    const alphaAgain = activateTapCanvasStorageScope(ALPHA_WORKSPACE)
    expect(readTapCanvasStorage('draft')).toBe('alpha-draft')
    alphaAgain.dispose()
  })

  it('keeps a newer scope active when an older disposer runs late', () => {
    const alpha = activateTapCanvasStorageScope(ALPHA_WORKSPACE)
    const beta = activateTapCanvasStorageScope(BETA_WORKSPACE)

    alpha.dispose()
    expect(writeTapCanvasStorage('draft', 'beta-draft')).toBe(true)
    expect(getTapCanvasScopedStorageKey('draft')).toContain(BETA_WORKSPACE)

    beta.dispose()
  })

  it('hydrates UI preferences only from the active workspace', () => {
    const alpha = activateTapCanvasStorageScope(ALPHA_WORKSPACE)
    writeTapCanvasStorage('tapcanvas_asset_persist', '0')
    hydrateTapCanvasUIStateFromStorage()
    expect(useUIStore.getState().assetPersistenceEnabled).toBe(false)
    alpha.dispose()

    resetTapCanvasUIStateForStorageScope()
    const beta = activateTapCanvasStorageScope(BETA_WORKSPACE)
    hydrateTapCanvasUIStateFromStorage()
    expect(useUIStore.getState().assetPersistenceEnabled).toBe(true)
    beta.dispose()
  })
})

describe('TapCanvas request scope', () => {
  it('aborts in-flight request signals when the workspace is disposed', () => {
    const scope = activateTapCanvasRequestScope()
    const signal = withTapCanvasRequestSignal().signal

    expect(signal).toBe(scope.signal)
    expect(signal?.aborted).toBe(false)
    scope.dispose()
    expect(signal?.aborted).toBe(true)
  })
})
