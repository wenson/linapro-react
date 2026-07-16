import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { StatusBanner } from '../../canvas/nodes/taskNode/components/StatusBanner'

function renderWithMantine(node: React.ReactNode) {
  return render(<MantineProvider>{node}</MantineProvider>)
}

describe('StatusBanner', () => {
  it('does not render when status is not error', () => {
    const { container } = renderWithMantine(<StatusBanner status="success" lastError="x" />)
    expect(container.querySelector('.task-node-status-banner')).toBeNull()
  })

  it('shows generic 429 errors without legacy billing guidance', () => {
    renderWithMantine(<StatusBanner status="error" lastError="upstream 429" httpStatus={429} />)
    expect(screen.getByText('执行错误')).toBeInTheDocument()
    expect(screen.getByText('upstream 429')).toBeInTheDocument()
    expect(screen.queryByText(/升级您的服务计划/)).not.toBeInTheDocument()
  })

  it('shows safety-blocked 429 errors without legacy billing guidance', () => {
    renderWithMantine(<StatusBanner status="error" lastError="IMAGE_SAFETY blocked" httpStatus={429} />)
    expect(screen.getByText('执行错误')).toBeInTheDocument()
    expect(screen.getByText('IMAGE_SAFETY blocked')).toBeInTheDocument()
    expect(screen.queryByText(/升级您的服务计划/)).not.toBeInTheDocument()
  })
})
