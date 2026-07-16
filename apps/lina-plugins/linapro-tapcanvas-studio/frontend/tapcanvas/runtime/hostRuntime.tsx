import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react'

import type {
  PluginHostApi,
  PluginHostContextValue,
  PluginHostLocale,
  PluginHostTenantProjection,
  PluginHostUserProjection,
} from '@linapro/plugin-ui'

import { useRFStore } from '../canvas/store'
import { activateHostTranslator, setLanguage } from '../canvas/i18n'
import {
  hydrateSystemPromptPresetsFromStorage,
  resetSystemPromptPresetsForStorageScope,
} from '../canvas/systemPromptPresets'
import { useInsertMenuStore } from '../canvas/insertMenuStore'
import { useUploadRuntimeStore } from '../domain/upload-runtime/store/uploadRuntimeStore'
import {
  hydrateTapCanvasUIStateFromStorage,
  resetTapCanvasUIStateForStorageScope,
  useUIStore,
} from '../ui/uiStore'
import { activateTapCanvasHostLocale } from './hostLocaleScope'
import { activateTapCanvasRequestScope } from './requestScope'
import { activateTapCanvasStorageScope } from './storageScope'

export interface TapCanvasHostRuntime {
  api: PluginHostApi
  locale: PluginHostLocale
  permissions: ReadonlySet<string>
  t: PluginHostContextValue['t']
  tenant: Readonly<PluginHostTenantProjection>
  user: Readonly<PluginHostUserProjection>
  workspaceKey: string
}

const TapCanvasHostRuntimeContext = createContext<TapCanvasHostRuntime | null>(null)

export function buildTapCanvasWorkspaceKey(
  user: PluginHostUserProjection,
  tenant: PluginHostTenantProjection,
): string {
  return [
    `user:${user.id}`,
    `tenant:${tenant.id}`,
    `code:${tenant.code}`,
    `impersonated:${tenant.impersonated === true ? '1' : '0'}`,
  ].join('|')
}

function resetRuntimeState(readOnly: boolean) {
  useRFStore.getState().reset()
  useInsertMenuStore.getState().closeMenu()
  useUploadRuntimeStore.setState({
    activeNodeImageUploadIds: [],
    diagnostics: { duplicateBlockedCount: 0 },
    handleIdsByOwnerNodeId: {},
    handlesById: {},
  })
  useUIStore.setState({
    activePanel: null,
    addPanelOpen: false,
    assetPanelFocusRequest: null,
    assetPanelStoryboardRunRequest: null,
    canvasReferencePicker: null,
    canvasViewport: null,
    creationSession: null,
    currentFlow: { id: null, name: '未命名', source: 'local', ownerType: 'project', ownerId: null },
    currentProject: null,
    focusedNodeId: null,
    hoveredEdgeId: null,
    isDirty: false,
    libraryFlowId: null,
    nanoComicStoryboardRunState: null,
    panelAnchorY: null,
    paramNodeId: null,
    preview: null,
    restoreViewport: null,
    subflowNodeId: null,
    templatePanelOpen: false,
    viewOnly: readOnly,
    webcutVideoEditModal: { open: false, payload: null },
  })
}

export function TapCanvasHostRuntimeProvider({
  children,
  host,
}: {
  children: React.ReactNode
  host: PluginHostContextValue & { tenant: PluginHostTenantProjection }
}) {
  const workspaceKey = buildTapCanvasWorkspaceKey(host.user, host.tenant)
  const canUpdateFlow = host.permissions.has('*') || host.permissions.has('tapcanvas:flow:update')
  const configurationKey = `${workspaceKey}|locale:${host.locale}|editable:${canUpdateFlow ? '1' : '0'}`
  const [activeConfigurationKey, setActiveConfigurationKey] = useState<string | null>(null)
  const value = useMemo<TapCanvasHostRuntime>(() => Object.freeze({
    api: host.api,
    locale: host.locale,
    permissions: host.permissions,
    t: host.t,
    tenant: Object.freeze({ ...host.tenant }),
    user: Object.freeze({ ...host.user }),
    workspaceKey,
  }), [host.api, host.locale, host.permissions, host.t, host.tenant, host.user, workspaceKey])

  useLayoutEffect(() => {
    const storageScope = activateTapCanvasStorageScope(workspaceKey)
    const requestScope = activateTapCanvasRequestScope()
    const localeScope = activateTapCanvasHostLocale(host.locale)
    const translatorScope = activateHostTranslator(host.t)
    setLanguage(host.locale === 'en-US' ? 'en' : 'zh')
    resetRuntimeState(!canUpdateFlow)
    hydrateTapCanvasUIStateFromStorage()
    hydrateSystemPromptPresetsFromStorage()
    setActiveConfigurationKey(configurationKey)

    return () => {
      requestScope.dispose()
      translatorScope.dispose()
      localeScope.dispose()
      resetSystemPromptPresetsForStorageScope()
      resetTapCanvasUIStateForStorageScope()
      resetRuntimeState(true)
      storageScope.dispose()
    }
  }, [canUpdateFlow, configurationKey, host.locale, host.t, workspaceKey])

  return (
    <TapCanvasHostRuntimeContext.Provider value={value}>
      {activeConfigurationKey === configurationKey ? children : null}
    </TapCanvasHostRuntimeContext.Provider>
  )
}

export function useTapCanvasHostRuntime(): TapCanvasHostRuntime {
  const value = useContext(TapCanvasHostRuntimeContext)
  if (!value) {
    throw new Error('useTapCanvasHostRuntime must be used within TapCanvasHostRuntimeProvider')
  }
  return value
}
