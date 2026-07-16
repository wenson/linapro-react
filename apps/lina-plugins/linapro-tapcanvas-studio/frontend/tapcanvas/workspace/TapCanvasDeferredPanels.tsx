import { lazy, Suspense } from 'react'

import { useUIStore } from '../ui/uiStore'

const AddNodePanel = lazy(() => import('../ui/AddNodePanel'))
const AgentDialog = lazy(() => import('../ui/chat/AiChatDialog'))
const AssetPanel = lazy(() => import('../ui/AssetPanel'))
const HistoryPanel = lazy(() => import('../ui/HistoryPanel'))
const NanoComicWorkspacePanel = lazy(() => import('../ui/NanoComicWorkspacePanel'))
const ParamModal = lazy(() => import('../ui/ParamModal'))
const PreviewModal = lazy(() => import('../ui/PreviewModal'))
const TapshowPanel = lazy(() => import('../ui/TapshowPanel'))
const TemplatePanel = lazy(() => import('../ui/TemplatePanel'))
const WebCutVideoEditModalHost = lazy(() =>
  import('../ui/WebCutVideoEditModalHost').then((module) => ({
    default: module.WebCutVideoEditModalHost,
  })),
)

interface TapCanvasDeferredPanelsProps {
  agentBridgeEnabled?: boolean
}

export default function TapCanvasDeferredPanels({
  agentBridgeEnabled = false,
}: TapCanvasDeferredPanelsProps) {
  const activePanel = useUIStore((state) => state.activePanel)
  const paramNodeId = useUIStore((state) => state.paramNodeId)
  const preview = useUIStore((state) => state.preview)
  const webCutOpen = useUIStore((state) => state.webcutVideoEditModal.open)

  return (
    <Suspense fallback={null}>
      {activePanel === 'add' ? <AddNodePanel /> : null}
      {activePanel === 'template' ? <TemplatePanel /> : null}
      {activePanel === 'assets' ? <AssetPanel /> : null}
      {activePanel === 'tapshow' ? <TapshowPanel /> : null}
      {activePanel === 'history' ? <HistoryPanel /> : null}
      {activePanel === 'nanoComic' ? <NanoComicWorkspacePanel /> : null}
      {paramNodeId ? <ParamModal /> : null}
      {preview ? <PreviewModal /> : null}
      {webCutOpen ? <WebCutVideoEditModalHost /> : null}
      {agentBridgeEnabled ? <AgentDialog className="app-ai-chat-dialog" /> : null}
    </Suspense>
  )
}
