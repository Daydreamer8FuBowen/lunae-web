import { describe, expect, it } from 'vitest'
import { formatCode, formatJson, formatShopifyHtml, parseExcludedFields } from './format'

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

describe('source formatters', () => {
  it('formats standalone HTML with indentation and handles void elements', async () => {
    const source = '<section><div><img src="x"><input type="text"></div><p>Body</p></section>'
    const result = await formatCode(source, 'html')
    expect(result).toContain('\n  <div><img src="x" /><input type="text" /></div>')
    expect(result).toContain('\n  <p>Body</p>\n</section>')
    expect(await formatCode(result, 'html')).toBe(result)
  })

  it('applies the existing JSON HTML line breaks directly to Shopify HTML', () => {
    const source = '<section><h2>Title</h2><p>Body<br><nobr>keep</nobr></p></section>'
    expect(formatShopifyHtml(source)).toBe(JSON.parse(formatJson(JSON.stringify({ content: source }), '')).content)
  })

  it('preserves quoted angle brackets, entities, SVG and raw text', () => {
    const raw = '<script>if (a > b) { console.log("<div>"); }</script>'
    const svg = '<svg viewBox="0 0 10 10"><path d="M0 0" /></svg>'
    const pre = '<pre>  one\n    two</pre>'
    const result = formatShopifyHtml(`<div title="a > b">A &amp; B${svg}${raw}${pre}</div>`)
    expect(result).toContain('<div title="a > b">\nA &amp; B')
    for (const fragment of [svg, raw, pre]) expect(result).toContain(fragment)
    expect(formatShopifyHtml(result)).toBe(result)
  })

  it('formats JavaScript without changing literals or executing code', async () => {
    const result = await formatCode('function test(x){if(x){return "a;{}"}}const obj={text:`hello ${test(1)}`};', 'js')
    expect(result).toContain('function test(x) {\n  if (x) {\n    return "a;{}";\n  }\n}')
    expect(result).toContain('`hello ${test(1)}`')
    expect(await formatCode(result, 'js')).toBe(result)
  })

  it('reports invalid JavaScript', async () => {
    await expect(formatCode('const = ;', 'js')).rejects.toThrow()
  })
})
