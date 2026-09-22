// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import ToolsPage from './ToolsPage'

afterEach(cleanup)

it('cycles through all six direct destinations and wraps around', () => {
  render(<MemoryRouter><ToolsPage /></MemoryRouter>)
  const active = () => screen.getAllByRole('link').find((link) => link.getAttribute('aria-current') === 'true')!
  expect(active().getAttribute('href')).toBe('/demos/motion-lab')
  for (const path of ['/demos/demo3', '/demos/digital-archive', '/tools/json-formatter', '/demos/aura', '/demos/prmpt', '/demos/motion-lab']) {
    fireEvent.click(screen.getByRole('button', { name: '下一个项目' }))
    expect(active().getAttribute('href')).toBe(path)
    expect(screen.getAllByRole('link').filter((link) => link.tabIndex === 0)).toHaveLength(1)
  }
  fireEvent.click(screen.getByRole('button', { name: '上一个项目' }))
  expect(active().getAttribute('href')).toBe('/demos/prmpt')
  fireEvent.keyDown(screen.getByRole('button', { name: '上一个项目' }), { key: 'ArrowLeft' })
  expect(active().getAttribute('href')).toBe('/demos/aura')
})
