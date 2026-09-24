// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ToolsPage from './ToolsPage'

const motionPreference = vi.hoisted(() => ({ reduced: false }))
vi.mock('motion/react', async (importOriginal) => ({
  ...await importOriginal<typeof import('motion/react')>(),
  useReducedMotion: () => motionPreference.reduced,
}))

beforeEach(() => {
  motionPreference.reduced = false
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('makes all six original destinations accessible directly in the project grid', () => {
  render(<MemoryRouter><ToolsPage /></MemoryRouter>)
  const grid = screen.getByRole('list', { name: '工具与作品' })
  const links = within(grid).getAllByRole('link')
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/tools/json-formatter', '/demos/aura', '/demos/prmpt',
    '/demos/motion-lab', '/demos/demo3', '/demos/digital-archive',
  ])
  expect(links.every((link) => link.tabIndex === 0)).toBe(true)
  expect(screen.getByRole('link', { name: /返回首页/ }).getAttribute('href')).toBe('/')
  expect(screen.getByRole('link', { name: '继续探索作品' }).getAttribute('href')).toBe('/showcase')
})

it('allows the continuous marquee to be paused and resumed', () => {
  render(<MemoryRouter><ToolsPage /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: '暂停滚动' }))
  expect(screen.getByRole('button', { name: '继续滚动' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: '继续滚动' }))
  expect(screen.getByRole('button', { name: '暂停滚动' }).getAttribute('aria-pressed')).toBe('false')
  expect(screen.getAllByText('Creative code').filter((label) => !label.closest('[aria-hidden="true"]'))).toHaveLength(1)
})

it('shows the card reveal on keyboard focus and keeps it until focus leaves', async () => {
  motionPreference.reduced = true
  render(<MemoryRouter><ToolsPage /></MemoryRouter>)
  const card = screen.getByRole('link', { name: 'Shopify 工具' })
  const reveal = card.querySelector<HTMLElement>('.tools-project-reveal')!
  fireEvent.focus(card)
  await waitFor(() => expect(reveal.style.opacity).toBe('1'))
  fireEvent.pointerLeave(card)
  expect(reveal.style.opacity).toBe('1')
  fireEvent.blur(card)
  await waitFor(() => expect(reveal.style.opacity).toBe('0'))
})

it('keeps projects visible and pauses continuous movement with reduced motion', () => {
  motionPreference.reduced = true
  const { container } = render(<MemoryRouter><ToolsPage /></MemoryRouter>)
  expect(container.querySelector('.tools-marquee')?.getAttribute('data-paused')).toBe('true')
  expect(screen.getByRole('button', { name: '继续滚动' }).hasAttribute('disabled')).toBe(true)
  expect([...container.querySelectorAll<HTMLElement>('.tools-project-item')].every((item) => item.style.opacity !== '0')).toBe(true)
})
