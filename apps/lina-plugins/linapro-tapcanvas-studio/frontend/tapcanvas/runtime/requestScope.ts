let activeController: AbortController | null = null

export function activateTapCanvasRequestScope(): {
  dispose: () => void
  signal: AbortSignal
} {
  const controller = new AbortController()
  activeController = controller

  return {
    signal: controller.signal,
    dispose: () => {
      controller.abort()
      if (activeController === controller) {
        activeController = null
      }
    },
  }
}

export function withTapCanvasRequestSignal(init?: RequestInit): RequestInit {
  const scopeSignal = activeController?.signal
  if (!scopeSignal) return init ?? {}
  if (!init?.signal) return { ...(init ?? {}), signal: scopeSignal }
  if (init.signal === scopeSignal) return init

  return {
    ...init,
    signal: AbortSignal.any([init.signal, scopeSignal]),
  }
}
