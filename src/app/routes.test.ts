import { describe, expect, it } from 'vitest'
import { legacyRedirects, projectEntries, routePaths } from './routes'

describe('project routes', () => {
  it('exposes the public navigation paths', () => {
    expect(routePaths).toMatchObject({
      home: '/',
      tools: '/tools',
      json: '/tools/json-formatter',
      showcase: '/showcase',
      auraDemo: '/demos/aura',
      prmptDemo: '/demos/prmpt',
      motionLabDemo: '/demos/motion-lab',
      demo3: '/demos/demo3',
      digitalArchiveDemo: '/demos/digital-archive',
    })
  })

  it('keeps tool and showcase entries in one catalog', () => {
    expect(projectEntries.map((entry) => entry.slug)).toEqual(['json-formatter', 'aura', 'prmpt'])
    expect(projectEntries.find((entry) => entry.slug === 'json-formatter')?.kind).toBe('tool')
  })

  it('redirects the legacy Shopify route', () => {
    expect(legacyRedirects['/shopify']).toBe('/tools/json-formatter')
  })
})
