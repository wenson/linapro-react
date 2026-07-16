import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadBatchImageSource } from '../../domain/resource-runtime/services/batchImageSourceLoader'
import { loadReferenceSheetImageSource } from '../../runner/referenceSheet'

vi.mock('../../domain/resource-runtime/services/batchImageSourceLoader', () => ({
  loadBatchImageSource: vi.fn(),
}))

describe('referenceSheet', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('forwards the managed image source dimensions and release callback', async () => {
    const release = vi.fn()
    vi.mocked(loadBatchImageSource).mockResolvedValue({
      height: 480,
      release,
      resourceId: 'reference-image',
      source: document.createElement('canvas'),
      width: 640,
    })

    const loaded = await loadReferenceSheetImageSource('https://example.com/reference.png')

    expect(loaded.width).toBe(640)
    expect(loaded.height).toBe(480)
    expect(loadBatchImageSource).toHaveBeenCalledWith('https://example.com/reference.png')
    loaded.dispose()
    expect(release).toHaveBeenCalledTimes(1)
  })
})
