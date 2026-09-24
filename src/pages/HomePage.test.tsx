// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'
import ToolsPage from './ToolsPage'

vi.mock('./HeroVideo', () => ({ default: () => <video /> }))

function mount() {
  return render(<MemoryRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/tools" element={<ToolsPage />} />
  </Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })))
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('home to tools transition', () => {
  it('keeps the homepage during the transition and focuses the final tools page', () => {
    const { container } = mount()
    fireEvent.click(screen.getByRole('link', { name: 'Get started' }))
    expect(container.querySelector('.is-entering')).not.toBeNull()
    expect(screen.queryByRole('link', { name: 'Shopify 工具' })).toBeNull()
    act(() => vi.advanceTimersByTime(1400))
    expect(screen.getByRole('link', { name: 'Shopify 工具' }).getAttribute('href')).toBe('/tools/json-formatter')
    expect(screen.getByRole('link', { name: '疗愈生活' }).getAttribute('href')).toBe('/demos/aura')
    expect(screen.getByRole('link', { name: '灵感档案' }).getAttribute('href')).toBe('/demos/prmpt')
    expect(screen.getByRole('link', { name: '飞鸽' }).getAttribute('href')).toBe('/demos/digital-archive')
    expect(document.activeElement).toBe(screen.getByRole('main', { name: '工具箱' }))
    expect(container.querySelector('.home-transition')).toBeNull()
  })

  it('cancels pending navigation when leaving the homepage', () => {
    const { unmount } = mount()
    fireEvent.click(screen.getByRole('link', { name: 'Get started' }))
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('skips the transition for reduced motion', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList)
    const { container } = mount()
    fireEvent.click(screen.getByRole('link', { name: 'Get started' }))
    expect(within(screen.getByRole('list', { name: '工具与作品' })).getAllByRole('link')).toHaveLength(6)
    expect(container.querySelector('.is-entering')).toBeNull()
  })
})
