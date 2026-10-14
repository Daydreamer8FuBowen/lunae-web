// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { JsonTool } from './JsonTool'

afterEach(cleanup)

it('formats raw HTML, Shopify HTML and JS and clears stale results when switching', async () => {
  const { container } = render(<JsonTool onBack={() => {}} />)
  expect(screen.getByRole('heading', { name: '格式化' })).toBeTruthy()
  expect(screen.getByLabelText(/跳过字段/)).toBeTruthy()
  for (const mode of ['HTML', 'Shopify HTML', 'JS']) {
    fireEvent.click(screen.getByRole('button', { name: mode }))
    expect(screen.queryByLabelText(/跳过字段/)).toBeNull()
    expect(container.querySelector('.result')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '填入示例' }))
    expect(screen.getByRole('textbox', { name: `${mode} 原数据` })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '格式化' }))
    await waitFor(() => expect(container.querySelector('.result')).not.toBeNull())
    expect(screen.queryByRole('alert')).toBeNull()
  }
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'const = ;' } })
  fireEvent.click(screen.getByRole('button', { name: '格式化' }))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('JS 格式化失败'))
  fireEvent.click(screen.getByRole('button', { name: '清空' }))
  expect(screen.queryByRole('alert')).toBeNull()
})
