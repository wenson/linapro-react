import { t } from '../../i18n'
export type ImageEditSizeOption = {
  value: string
  label: string
  width: number
  height: number
}

export type CanvasResizeSizeOption = {
  value: string
  label: string
  width: number
  height: number
}

export const IMAGE_EDIT_SIZE_OPTIONS: readonly ImageEditSizeOption[] = [
  {
    value: '1280x720',
    get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m084_1280x720720pLandscape")
  },
    width: 1280,
    height: 720,
  },
  {
    value: '720x1280',
    get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m085_720x1280720pPortrait")
  },
    width: 720,
    height: 1280,
  },
  {
    value: '1792x1024',
    get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m086_1792x1024LargeWidescreen")
  },
    width: 1792,
    height: 1024,
  },
  {
    value: '1024x1792',
    get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m087_1024x1792LargePortrait")
  },
    width: 1024,
    height: 1792,
  },
] as const

export const DEFAULT_IMAGE_EDIT_SIZE = '1280x720'
export const DEFAULT_CANVAS_RESIZE_SIZE = '1280x720'

export const CANVAS_RESIZE_SIZE_OPTIONS: readonly CanvasResizeSizeOption[] = [
  { value: '1280x720', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m084_1280x720720pLandscape")
  }, width: 1280, height: 720 },
  { value: '720x1280', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m085_720x1280720pPortrait")
  }, width: 720, height: 1280 },
  { value: '1920x1080', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m088_1920x10801080pLandscape")
  }, width: 1920, height: 1080 },
  { value: '1080x1920', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m089_1080x19201080pPortrait")
  }, width: 1080, height: 1920 },
  { value: '1024x1024', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m090_1024x1024Square")
  }, width: 1024, height: 1024 },
  { value: '1440x1440', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m091_1440x1440HdSquare")
  }, width: 1440, height: 1440 },
  { value: '1536x1024', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m092_1536x1024Widescreen")
  }, width: 1536, height: 1024 },
  { value: '1024x1536', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m093_1024x1536Portrait")
  }, width: 1024, height: 1536 },
  { value: '1792x1024', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m086_1792x1024LargeWidescreen")
  }, width: 1792, height: 1024 },
  { value: '1024x1792', get label() {
    return t("plugin.linapro-tapcanvas-studio.canvas.copy.m087_1024x1792LargePortrait")
  }, width: 1024, height: 1792 },
] as const

const CANVAS_RESIZE_MIN = 64
const CANVAS_RESIZE_MAX = 4096

export function normalizeImageEditSize(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().replace(/\s+/g, '') : ''
  const matched = IMAGE_EDIT_SIZE_OPTIONS.find((option) => option.value === raw)
  return matched?.value || DEFAULT_IMAGE_EDIT_SIZE
}

export function parseCanvasResizeSizeDimensions(
  value: unknown,
): { width: number; height: number } | null {
  const raw = typeof value === 'string' ? value.trim().replace(/\s+/g, '') : ''
  const matched = CANVAS_RESIZE_SIZE_OPTIONS.find((option) => option.value === raw)
  if (matched) {
    return { width: matched.width, height: matched.height }
  }
  const result = raw.match(/^(\d{2,4})x(\d{2,4})$/i)
  if (!result) return null
  const width = Number(result[1])
  const height = Number(result[2])
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < CANVAS_RESIZE_MIN ||
    height < CANVAS_RESIZE_MIN ||
    width > CANVAS_RESIZE_MAX ||
    height > CANVAS_RESIZE_MAX
  ) {
    return null
  }
  return { width, height }
}

export function normalizeCanvasResizeSize(value: unknown): string {
  const parsed = parseCanvasResizeSizeDimensions(value)
  if (!parsed) return DEFAULT_CANVAS_RESIZE_SIZE
  return `${parsed.width}x${parsed.height}`
}

export function resolveImageEditSizeOption(value: unknown): ImageEditSizeOption {
  const normalized = normalizeImageEditSize(value)
  return IMAGE_EDIT_SIZE_OPTIONS.find((option) => option.value === normalized) || IMAGE_EDIT_SIZE_OPTIONS[0]
}

export function toAspectRatioFromImageEditSize(value: unknown): string {
  const option = resolveImageEditSizeOption(value)
  return option.width >= option.height ? '16:9' : '9:16'
}

export function parseImageEditSizeDimensions(
  value: unknown,
): { width: number; height: number } {
  const option = resolveImageEditSizeOption(value)
  return {
    width: option.width,
    height: option.height,
  }
}
