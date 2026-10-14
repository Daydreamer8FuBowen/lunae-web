// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppRoutes } from '../App'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function Location() {
  const location = useLocation()
  return <output aria-label="当前路径">{location.pathname}{location.search}</output>
}

function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /><Location /></MemoryRouter>)
}

it('switches six demo tabs without changing the route or keeping inactive frames', () => {
  const { container } = mount('/tools/demos')
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map((tab) => tab.textContent)).toEqual(['疗愈生活', '灵感档案', '动效实验', '3D 创作', '飞鸽', '瀑布'])
  for (const tab of tabs) {
    fireEvent.click(tab)
    expect(tab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(tab.id)
    expect(container.querySelectorAll('iframe')).toHaveLength(1)
    expect(container.querySelector('iframe')?.title).toBe(tab.textContent)
    expect(screen.getByLabelText('当前路径').textContent).toBe('/tools/demos')
  }
  expect(screen.getByRole('link', { name: '返回工具箱' }).getAttribute('href')).toBe('/tools')
})

it('supports arrow-key tab selection and focus', () => {
  mount('/tools/demos')
  fireEvent.keyDown(screen.getByRole('tab', { name: '疗愈生活' }), { key: 'ArrowRight' })
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: '灵感档案' }))
  expect(document.activeElement?.getAttribute('aria-selected')).toBe('true')
})

it('redirects old project addresses to the corresponding tab', () => {
  mount('/demos/motion-lab')
  expect(screen.getByLabelText('当前路径').textContent).toBe('/tools/demos')
  expect(screen.getByRole('tab', { name: '动效实验' }).getAttribute('aria-selected')).toBe('true')
})

it('redirects the old showcase entry', () => {
  mount('/showcase')
  expect(screen.getByLabelText('当前路径').textContent).toBe('/tools/demos')
})

it('redirects the singular demo entry', () => {
  mount('/demo')
  expect(screen.getByLabelText('当前路径').textContent).toBe('/tools/demos')
})

it('redirects the former homepage to the toolbox', () => {
  mount('/')
  expect(screen.getByLabelText('当前路径').textContent).toBe('/tools')
  expect(screen.queryByRole('link', { name: 'Get started' })).toBeNull()
})
