import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BodyPortal from '../../ui/BodyPortal'
import { TapCanvasPortalProvider } from '../../workspace/TapCanvasPortalContext'

describe('BodyPortal', () => {
  it('renders children into the Studio portal target', () => {
    const target = document.createElement('div')
    target.dataset.testid = 'studio-portal-target'
    document.body.appendChild(target)

    const view = render(
      <TapCanvasPortalProvider target={target}>
        <div data-testid="body-portal-test-host">
          <BodyPortal>
            <div data-testid="body-portal-child">body portal child</div>
          </BodyPortal>
        </div>
      </TapCanvasPortalProvider>,
    )

    const child = screen.getByTestId('body-portal-child')
    expect(target).toContainElement(child)
    expect(screen.getByTestId('body-portal-test-host')).not.toContainElement(child)

    view.unmount()
    target.remove()
  })
})
