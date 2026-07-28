import { createContext, type PropsWithChildren, useContext } from 'react'

const TapCanvasPortalContext = createContext<HTMLElement | null>(null)

export function TapCanvasPortalProvider({
  children,
  target,
}: PropsWithChildren<{ target: HTMLElement }>) {
  return (
    <TapCanvasPortalContext.Provider value={target}>
      {children}
    </TapCanvasPortalContext.Provider>
  )
}

export function useTapCanvasPortalTarget() {
  return useContext(TapCanvasPortalContext)
}
