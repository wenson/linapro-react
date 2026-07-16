import { beforeEach, describe, expect, it } from 'vitest'
import {
  $,
  $t,
  activateHostTranslator,
  getCurrentLanguage,
  setLanguage,
  t,
} from '../../canvas/i18n'

const saveAsAssetKey = 'plugin.linapro-tapcanvas-studio.canvas.copy.m001_saveAsAsset'

describe('i18n helpers', () => {
  beforeEach(() => {
    setLanguage('zh')
  })

  it('returns source text in zh mode', () => {
    expect($('保存')).toBe('保存')
  })

  it('translates known text in en mode', () => {
    setLanguage('en')
    expect($('保存')).toBe('Save')
  })

  it('interpolates params after translation', () => {
    setLanguage('en')
    expect($t('项目「{{name}}」已保存', { name: 'Demo' })).toBe('Project "Demo" saved')
    // Unknown source falls back to original text and still interpolates.
    expect($t('你好，{{name}}', { name: 'TapCanvas' })).toBe('你好，TapCanvas')
  })

  it('uses the language supplied by the LinaPro host without local persistence', () => {
    setLanguage('en')
    expect(getCurrentLanguage()).toBe('en')
    expect(localStorage.getItem('tapcanvas-language')).toBeNull()
  })

  it('resolves migrated canvas copy from the plugin locale resources', () => {
    expect(t(saveAsAssetKey)).toBe('保存为资产')
    setLanguage('en')
    expect(t(saveAsAssetKey)).toBe('Save as Asset')
  })

  it('uses the active LinaPro translator and restores the resource fallback on dispose', () => {
    const scope = activateHostTranslator((key) => `host:${key}`)
    expect(t(saveAsAssetKey)).toBe(`host:${saveAsAssetKey}`)
    scope.dispose()
    expect(t(saveAsAssetKey)).toBe('保存为资产')
  })
})
