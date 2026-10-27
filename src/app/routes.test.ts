import { describe, expect, it } from 'vitest'
import { legacyRedirects, projectEntries, routePaths } from './routes'

describe('project routes', () => {
  it('exposes the public navigation paths', () => {
    expect(routePaths).toMatchObject({
      home: '/',
      tools: '/tools',
      json: '/tools/formatter',
      showcase: '/tools/demos',
      xuyu: '/tools/xuyu',
    })
  })

  it('keeps tool and showcase entries in one catalog', () => {
    expect(projectEntries.map((entry) => entry.slug)).toEqual(['json-formatter', 'aura', 'prmpt'])
    expect(projectEntries.find((entry) => entry.slug === 'json-formatter')?.kind).toBe('tool')
  })

  it('redirects the legacy Shopify route', () => {
    expect(legacyRedirects['/shopify']).toBe('/tools/formatter')
    expect(legacyRedirects['/tools/json-formatter']).toBe('/tools/formatter')
    expect(legacyRedirects['/showcase']).toBe('/tools/demos')
    expect(legacyRedirects['/demo']).toBe('/tools/demos')
  })
})
