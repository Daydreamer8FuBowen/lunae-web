import { describe, expect, it } from 'vitest'
import { formatJson, parseExcludedFields } from './format'

describe('JSON formatter', () => {
  it('formats nested HTML strings while preserving excluded fields', () => {
    const source = JSON.stringify({
      content: '<section><h2>Title</h2><p>Body</p></section>',
      raw: '<div><span>keep flat</span></div>',
    })

    expect(formatJson(source, 'raw', 'flat')).toBe(JSON.stringify({
      content: '<section>\n<h2>\nTitle\n</h2>\n<p>\nBody\n</p>\n</section>',
      raw: '<div><span>keep flat</span></div>',
    }, null, 2))
  })

  it('supports Chinese and English separators for excluded fields', () => {
    expect([...parseExcludedFields('aaa; bbb； aaa')]).toEqual(['aaa', 'bbb'])
  })

  it('strips leading block comments before parsing JSON', () => {
    expect(formatJson('/* generated */\n{"ok":true}', '', 'flat')).toBe('{\n  "ok": true\n}')
  })
})
