import { render, screen } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PluginHostContextValue } from '@linapro/plugin-ui'

import StudioWorkspace, { StudioModuleBoundary } from './studio-workspace'

let currentHost: PluginHostContextValue
let nextInstanceId = 0
const unmountedInstances: number[] = []

vi.mock('@linapro/plugin-ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@linapro/plugin-ui')>()
  return {
    ...original,
    useLinaPluginHost: () => currentHost,
  }
})

vi.mock('../tapcanvas/workspace/TapCanvasWorkspace', () => {
  function MockTapCanvasWorkspace({ canUpdateFlow, host }: {
    canUpdateFlow: boolean
    host: PluginHostContextValue
  }) {
    const instanceId = useRef(++nextInstanceId).current
    useEffect(() => () => {
      unmountedInstances.push(instanceId)
    }, [instanceId])
    return (
      <div
        data-access={canUpdateFlow ? 'editable' : 'read-only'}
        data-instance={instanceId}
        data-tenant={host.tenant?.code}
        data-testid="mock-tapcanvas-workspace"
      />
    )
  }
  return { default: MockTapCanvasWorkspace }
})

function buildHost(overrides: Partial<PluginHostContextValue> = {}): PluginHostContextValue {
  return {
    api: { plugin: vi.fn(), pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() },
    locale: 'zh-CN',
    permissions: new Set(['tapcanvas:flow:read']),
    t: (key) => key,
    tenant: { code: 'alpha', id: 10, impersonated: false, name: 'Alpha' },
    user: { id: 1, name: 'Lina' },
    ...overrides,
  }
}

beforeEach(() => {
  currentHost = buildHost()
  nextInstanceId = 0
  unmountedInstances.length = 0
})

describe('TapCanvas Studio workspace entry', () => {
  it('blocks the workspace when LinaPro has no active tenant', () => {
    currentHost = buildHost({ tenant: null })
    render(<StudioWorkspace />)

    expect(screen.getByTestId('tapcanvas-studio-tenant-required')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-tapcanvas-workspace')).not.toBeInTheDocument()
  })

  it('projects LinaPro update permission into editable and read-only modes', async () => {
    const view = render(<StudioWorkspace />)
    expect(await screen.findByTestId('mock-tapcanvas-workspace')).toHaveAttribute('data-access', 'read-only')

    currentHost = buildHost({ permissions: new Set(['tapcanvas:flow:update']) })
    view.rerender(<StudioWorkspace />)
    expect(await screen.findByTestId('mock-tapcanvas-workspace')).toHaveAttribute('data-access', 'editable')
  })

  it('unmounts the old workspace when tenant or impersonation identity changes', async () => {
    const view = render(<StudioWorkspace />)
    const first = Number((await screen.findByTestId('mock-tapcanvas-workspace')).getAttribute('data-instance'))

    currentHost = buildHost({
      tenant: { code: 'beta', id: 20, impersonated: false, name: 'Beta' },
    })
    view.rerender(<StudioWorkspace />)
    const second = Number((await screen.findByTestId('mock-tapcanvas-workspace')).getAttribute('data-instance'))
    expect(second).not.toBe(first)
    expect(unmountedInstances).toContain(first)

    currentHost = buildHost({
      tenant: { code: 'beta', id: 20, impersonated: true, name: 'Beta' },
    })
    view.rerender(<StudioWorkspace />)
    const third = Number((await screen.findByTestId('mock-tapcanvas-workspace')).getAttribute('data-instance'))
    expect(third).not.toBe(second)
    expect(unmountedInstances).toContain(second)
  })

  it('fails closed when the canvas module is unavailable', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const BrokenModule = () => {
      throw new Error('module unavailable')
    }

    render(
      <StudioModuleBoundary description="Module unavailable" title="Canvas unavailable">
        <BrokenModule />
      </StudioModuleBoundary>,
    )

    expect(screen.getByTestId('tapcanvas-studio-module-unavailable')).toHaveTextContent('Canvas unavailable')
    consoleError.mockRestore()
  })
})
