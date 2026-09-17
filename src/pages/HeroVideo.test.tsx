// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HeroVideo from './HeroVideo'

const player = vi.hoisted(() => ({
  supported: true,
  attach: vi.fn(),
  destroy: vi.fn(),
  load: vi.fn(),
}))

vi.mock('hls.js', () => ({ default: class {
  static isSupported = () => player.supported
  static Events = { MANIFEST_PARSED: 'manifest', ERROR: 'error' }
  static ErrorTypes = { NETWORK_ERROR: 'network', MEDIA_ERROR: 'media' }
  on = vi.fn()
  attachMedia = player.attach
  loadSource = player.load
  destroy = player.destroy
} }))

beforeEach(() => {
  player.supported = true
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe')
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals() })

describe('background video compatibility', () => {
  it('uses hls.js even when the browser advertises native HLS', async () => {
    const { container, unmount } = render(<HeroVideo />)
    await waitFor(() => expect(player.attach).toHaveBeenCalledWith(container.querySelector('video')))
    expect(container.querySelector('video')?.getAttribute('src')).toBeNull()
    expect(player.load).toHaveBeenCalledWith(expect.stringContaining('.m3u8'))
    unmount()
    expect(player.destroy).toHaveBeenCalledOnce()
  })

  it('falls back to native HLS when MediaSource playback is unavailable', async () => {
    player.supported = false
    const { container } = render(<HeroVideo />)
    await waitFor(() => expect(container.querySelector('video')?.src).toContain('.m3u8'))
    expect(player.attach).not.toHaveBeenCalled()
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
  })
})
