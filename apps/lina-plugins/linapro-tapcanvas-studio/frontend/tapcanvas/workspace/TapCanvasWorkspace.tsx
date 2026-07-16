import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'

import type { PluginHostContextValue, PluginHostTenantProjection } from '@linapro/plugin-ui'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { buildTapCanvasTheme } from '../theme/tapCanvasTheme'
import { ToastHost } from '../ui/toast'
import { TapCanvasHostRuntimeProvider } from '../runtime/hostRuntime'
import TapCanvasDeferredPanels from './TapCanvasDeferredPanels'
import { TapCanvasPortalProvider } from './TapCanvasPortalContext'
import './tapcanvas-workspace.css'
import './tapcanvas-studio-scoped.css'

const Canvas = lazy(() => import('../canvas/Canvas'))

interface TapCanvasWorkspaceProps {
  accessLabel: string
  canUpdateFlow: boolean
  host: PluginHostContextValue & { tenant: PluginHostTenantProjection }
  tenantName: string
  title: string
  userName: string
}

function readHostColorScheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'light'
  return document.body.getAttribute('theme-mode') === 'dark' ? 'dark' : 'light'
}

function useHostColorScheme() {
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>(readHostColorScheme)

  useEffect(() => {
    const body = document.body
    const sync = () => setColorScheme(readHostColorScheme())
    const observer = new MutationObserver(sync)
    observer.observe(body, { attributeFilter: ['theme-mode'], attributes: true })
    sync()
    return () => observer.disconnect()
  }, [])

  return colorScheme
}

export default function TapCanvasWorkspace({
  accessLabel,
  canUpdateFlow,
  host,
  tenantName,
  title,
  userName,
}: TapCanvasWorkspaceProps) {
  const colorScheme = useHostColorScheme()
  const rootRef = useRef<HTMLElement>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)
  const theme = useMemo(
    () => buildTapCanvasTheme(colorScheme, portalTarget ?? undefined),
    [colorScheme, portalTarget],
  )

  return (
    <TapCanvasHostRuntimeProvider host={host}>
      <section
        className="tapcanvas-studio-root"
        data-access={canUpdateFlow ? 'editable' : 'read-only'}
        data-testid="tapcanvas-studio-workspace"
        ref={rootRef}
      >
        <MantineProvider
        cssVariablesSelector=".tapcanvas-studio-root"
        forceColorScheme={colorScheme}
        getRootElement={() => rootRef.current ?? undefined}
        theme={theme}
      >
        <header className="tapcanvas-studio-toolbar">
          <div className="tapcanvas-studio-toolbar__identity">
            <strong>{title}</strong>
            <span>{tenantName}</span>
          </div>
          <div className="tapcanvas-studio-toolbar__context" aria-label={accessLabel}>
            <span>{userName}</span>
            <span className="tapcanvas-studio-toolbar__access">{accessLabel}</span>
          </div>
        </header>

        <div className="tapcanvas-studio-canvas-frame">
          {portalTarget ? (
            <TapCanvasPortalProvider target={portalTarget}>
              <Suspense
                fallback={(
                  <div className="tapcanvas-studio-canvas-loading" role="status">
                    Loading canvas…
                  </div>
                )}
              >
                <Canvas className="tapcanvas-studio-canvas" />
              </Suspense>
              <TapCanvasDeferredPanels />
              <ToastHost className="tapcanvas-studio-toast-host" />
              <Notifications
                portalProps={{ target: portalTarget }}
                position="top-right"
                zIndex={10_500}
              />
            </TapCanvasPortalProvider>
          ) : null}
        </div>

        <div
          className="tapcanvas-studio-portal-root"
          data-testid="tapcanvas-studio-portal-root"
          ref={setPortalTarget}
        />
        </MantineProvider>
      </section>
    </TapCanvasHostRuntimeProvider>
  )
}
