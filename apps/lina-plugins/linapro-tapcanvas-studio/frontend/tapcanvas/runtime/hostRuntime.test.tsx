import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PluginHostContextValue, PluginHostTenantProjection } from '@linapro/plugin-ui'

import { getCurrentLanguage } from '../canvas/i18n'
import { useUIStore } from '../ui/uiStore'
import { buildTapCanvasWorkspaceKey, TapCanvasHostRuntimeProvider, useTapCanvasHostRuntime } from './hostRuntime'

function host(overrides: Partial<PluginHostContextValue> = {}): PluginHostContextValue & {
  tenant: PluginHostTenantProjection
} {
  return {
    api: { plugin: vi.fn(), pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() },
    locale: 'en-US',
    permissions: new Set(['tapcanvas:flow:read']),
    t: (key) => key,
    tenant: { code: 'alpha', id: 10, impersonated: false, name: 'Alpha' },
    user: { id: 1, name: 'Lina' },
    ...overrides,
  }
}

function RuntimeProbe() {
  const runtime = useTapCanvasHostRuntime()
  return (
    <span
      data-testid="runtime-probe"
      data-language={getCurrentLanguage()}
      data-read-only={useUIStore.getState().viewOnly ? '1' : '0'}
    >
      {runtime.workspaceKey}
    </span>
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('TapCanvas Host Runtime boundary', () => {
  it('builds a workspace identity from user, tenant and impersonation state', () => {
    expect(buildTapCanvasWorkspaceKey(
      { id: 7, name: 'User' },
      { code: 'beta', id: 20, impersonated: true, name: 'Beta' },
    )).toBe('user:7|tenant:20|code:beta|impersonated:1')
  })

  it('uses Host locale and denies editing without update permission', () => {
    render(
      <TapCanvasHostRuntimeProvider host={host()}>
        <RuntimeProbe />
      </TapCanvasHostRuntimeProvider>,
    )

    expect(screen.getByTestId('runtime-probe')).toHaveAttribute('data-language', 'en')
    expect(screen.getByTestId('runtime-probe')).toHaveAttribute('data-read-only', '1')
  })

  it('allows editing with the LinaPro update permission and follows locale changes', () => {
    const view = render(
      <TapCanvasHostRuntimeProvider host={host({ permissions: new Set(['tapcanvas:flow:update']) })}>
        <RuntimeProbe />
      </TapCanvasHostRuntimeProvider>,
    )
    expect(screen.getByTestId('runtime-probe')).toHaveAttribute('data-language', 'en')
    expect(screen.getByTestId('runtime-probe')).toHaveAttribute('data-read-only', '0')

    view.rerender(
      <TapCanvasHostRuntimeProvider host={host({
        locale: 'zh-CN',
        permissions: new Set(['tapcanvas:flow:update']),
      })}>
        <RuntimeProbe />
      </TapCanvasHostRuntimeProvider>,
    )
    expect(screen.getByTestId('runtime-probe')).toHaveAttribute('data-language', 'zh')
  })
})
