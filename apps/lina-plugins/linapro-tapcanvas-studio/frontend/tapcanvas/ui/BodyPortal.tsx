import React from 'react'
import { createPortal } from 'react-dom'

import { useTapCanvasPortalTarget } from '../workspace/TapCanvasPortalContext'

type BodyPortalProps = {
  children: React.ReactNode
}

export default function BodyPortal({ children }: BodyPortalProps): React.ReactPortal | React.JSX.Element {
  const target = useTapCanvasPortalTarget()

  if (!target) {
    return <>{children}</>
  }
  return createPortal(children, target)
}
