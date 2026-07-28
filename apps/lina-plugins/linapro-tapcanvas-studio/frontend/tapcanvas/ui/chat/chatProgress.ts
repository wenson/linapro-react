import { t } from '../../canvas/i18n'
export type ChatExecutionEventKey =
  | 'request_sent'
  | 'canvas_plan_parsed'
  | 'canvas_plan_executed'
  | 'assets_attached'
  | 'response_completed'
  | 'request_failed'

export type ChatExecutionRoute =
  | 'storyboard_workflow'
  | 'generic_chat'
  | 'replicate_replace'
  | 'canvas_edit'
  | 'request_failed'

export type ChatProgressRerunTarget = {
  sessionKey: string
  eventKey: ChatExecutionEventKey
  shotNodeId?: string
}

export type ChatProgressMetadata = {
  lane: 'chat_execution'
  route: ChatExecutionRoute
  sessionKey: string
  eventKey: ChatExecutionEventKey
  eventLabel: string
  eventIndex: number
  totalEvents: number
  rerunTarget: ChatProgressRerunTarget
}

type ChatExecutionEventDefinition = {
  key: ChatExecutionEventKey
  label: string
}

type BuildChatExecutionEventMessageInput = {
  eventKey: ChatExecutionEventKey
  detail?: string
}

type BuildChatProgressMetadataInput = {
  route: ChatExecutionRoute
  sessionKey: string
  eventKey: ChatExecutionEventKey
  shotNodeId?: string
}

const CHAT_EXECUTION_EVENT_DEFINITIONS: ChatExecutionEventDefinition[] = [
  { key: 'request_sent', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m264_requestSent")
  } },
  { key: 'canvas_plan_parsed', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m265_canvasPlanParsed")
  } },
  { key: 'canvas_plan_executed', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m266_canvasPlanExecuted")
  } },
  { key: 'assets_attached', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m267_assetsApplied")
  } },
  { key: 'response_completed', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m268_responseCompleted")
  } },
  { key: 'request_failed', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m269_requestFailed")
  } },
]

const EVENT_DEFINITION_BY_KEY = CHAT_EXECUTION_EVENT_DEFINITIONS.reduce<Record<ChatExecutionEventKey, ChatExecutionEventDefinition>>(
  (acc, eventDefinition) => {
    acc[eventDefinition.key] = eventDefinition
    return acc
  },
  {
    request_sent: CHAT_EXECUTION_EVENT_DEFINITIONS[0],
    canvas_plan_parsed: CHAT_EXECUTION_EVENT_DEFINITIONS[1],
    canvas_plan_executed: CHAT_EXECUTION_EVENT_DEFINITIONS[2],
    assets_attached: CHAT_EXECUTION_EVENT_DEFINITIONS[3],
    response_completed: CHAT_EXECUTION_EVENT_DEFINITIONS[4],
    request_failed: CHAT_EXECUTION_EVENT_DEFINITIONS[5],
  },
)

export function getChatExecutionEventDefinition(eventKey: ChatExecutionEventKey): ChatExecutionEventDefinition {
  return EVENT_DEFINITION_BY_KEY[eventKey]
}

export function buildChatExecutionEventMessage(input: BuildChatExecutionEventMessageInput): string {
  const eventDefinition = getChatExecutionEventDefinition(input.eventKey)
  const detail = String(input.detail || '').trim()
  if (!detail) return `进度更新 · ${eventDefinition.label}`
  return `进度更新 · ${eventDefinition.label}\n${detail}`
}

export function buildChatProgressMetadata(input: BuildChatProgressMetadataInput): ChatProgressMetadata {
  const eventDefinition = getChatExecutionEventDefinition(input.eventKey)
  const eventIndex = CHAT_EXECUTION_EVENT_DEFINITIONS.findIndex((item) => item.key === input.eventKey)
  const nextEventIndex = eventIndex >= 0 ? eventIndex + 1 : 1
  return {
    lane: 'chat_execution',
    route: input.route,
    sessionKey: input.sessionKey,
    eventKey: input.eventKey,
    eventLabel: eventDefinition.label,
    eventIndex: nextEventIndex,
    totalEvents: CHAT_EXECUTION_EVENT_DEFINITIONS.length,
    rerunTarget: {
      sessionKey: input.sessionKey,
      eventKey: input.eventKey,
      ...(input.shotNodeId ? { shotNodeId: input.shotNodeId } : {}),
    },
  }
}
