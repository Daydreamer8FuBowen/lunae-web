const BR_NOBR_REGEX = /^<\/?(br|nobr)\b/i
const SVG_OPEN_REGEX = /^<svg\b/i
const SVG_CLOSE_REGEX = /^<\/svg\b/i

function isBrOrNobr(tag: string) {
  return BR_NOBR_REGEX.test(tag)
}

function formatHtmlInString(value: string, htmlStyle: 'flat' | 'pretty' = 'flat') {
  const normalized = value.replace(/\r\n?/g, '\n')
  const valueStartsWithTag = /^\s*</.test(normalized)
  let isFirst = true
  let svgDepth = 0

  const result = normalized.replace(/<\/?[^>]+>/gi, (match) => {
    if (SVG_OPEN_REGEX.test(match) && !match.endsWith('/>')) {
      svgDepth += 1
      return match
    }
    if (SVG_CLOSE_REGEX.test(match)) {
      svgDepth = Math.max(0, svgDepth - 1)
      return match
    }
    if (svgDepth > 0 || isBrOrNobr(match)) return match
    if (isFirst && valueStartsWithTag) {
      isFirst = false
      return `${match}\n`
    }
    isFirst = false
    return `\n${match}\n`
  })

  const cleaned = result
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ \t]*(?:\n[ \t]*)+(?=<\/?[^>]+>)/g, '\n')
    .replace(/(<\/?[^>]+>)[ \t]*(?:\n[ \t]*)+/g, '$1\n')
    .replace(/\n(?:[ \t]*\n)+/g, '\n')
    .trimEnd()

  if (htmlStyle === 'pretty') {
    let depth = 0
    return cleaned.split('\n').map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1)
      const formatted = `${'  '.repeat(depth)}${trimmed}`
      if (/^<[^!/][^>]*>$/.test(trimmed) && !/<\/(?:[^>]+)>$/.test(trimmed) && !trimmed.endsWith('/>')) depth += 1
      return formatted
    }).join('\n')
  }
  return cleaned
}

function stripLeadingComments(input: string) {
  let value = input.replace(/^\uFEFF/, '')
  while (true) {
    const trimmed = value.trimStart()
    if (!trimmed.startsWith('/*')) return trimmed
    const commentEnd = trimmed.indexOf('*/', 2)
    if (commentEnd === -1) return trimmed
    value = trimmed.slice(commentEnd + 2)
  }
}

export function parseExcludedFields(value: string) {
  return new Set(value.split(/[;；]/).map((field) => field.trim()).filter(Boolean))
}

function traverseAndFormat(value: unknown, excludedFields: Set<string>, htmlStyle: 'flat' | 'pretty'): unknown {
  if (typeof value === 'string') return formatHtmlInString(value, htmlStyle)
  if (Array.isArray(value)) return value.map((item) => traverseAndFormat(item, excludedFields, htmlStyle))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      excludedFields.has(key) ? item : traverseAndFormat(item, excludedFields, htmlStyle),
    ]))
  }
  return value
}

export function formatJson(input: string, excludedFieldInput: string, htmlStyle: 'flat' | 'pretty' = 'flat') {
  const parsed = JSON.parse(stripLeadingComments(input))
  return JSON.stringify(traverseAndFormat(parsed, parseExcludedFields(excludedFieldInput), htmlStyle), null, 2)
}
import { parse, parseFragment, type DefaultTreeAdapterMap } from 'parse5'


export type FormatMode = 'json' | 'html' | 'shopify-html' | 'js'

export function formatShopifyHtml(input: string) {
  const ranges: { start: number; end: number; inline: boolean }[] = []
  const protectedTags = new Set(['svg', 'script', 'style', 'pre', 'textarea'])
  const visit = (node: DefaultTreeAdapterMap['node']) => {
    if ('tagName' in node) {
      const location = node.sourceCodeLocation
      if (location && protectedTags.has(node.tagName)) {
        ranges.push({ start: location.startOffset, end: location.endOffset, inline: true })
        return
      }
      for (const tag of [location?.startTag, location?.endTag]) {
        if (tag) ranges.push({ start: tag.startOffset, end: tag.endOffset, inline: ['br', 'nobr'].includes(node.tagName) })
      }
      if (node.tagName === 'template' && 'content' in node) visit(node.content)
    }
    if ('childNodes' in node) node.childNodes.forEach(visit)
  }
  const options = { sourceCodeLocationInfo: true }
  visit(/<!doctype\b|<(?:html|head|body)\b/i.test(input) ? parse(input, options) : parseFragment(input, options))
  ranges.sort((a, b) => a.start - b.start)

  // Source offsets preserve attributes, entities and raw content without reserializing HTML.
  let cursor = 0
  let pending = ''
  let output = ''
  const flush = () => {
    output += pending.replace(/\r\n?/g, '\n').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n+/g, '\n')
    pending = ''
  }
  for (const range of ranges) {
    pending += input.slice(cursor, range.start)
    const source = input.slice(range.start, range.end)
    if (range.inline) {
      flush()
      output += source
    } else {
      pending += `\n${source}\n`
    }
    cursor = range.end
  }
  pending += input.slice(cursor)
  flush()
  return output.replace(/^\n/, '').trimEnd()
}

export async function formatCode(input: string, mode: FormatMode, excludedFields = '') {
  if (mode === 'json') return formatJson(input, excludedFields)
  if (mode === 'shopify-html') return formatShopifyHtml(input)
  const { format } = await import('prettier/standalone')
  const plugins = mode === 'html'
    ? [await import('prettier/plugins/html')]
    : [await import('prettier/plugins/babel'), await import('prettier/plugins/estree')]
  return format(input, { parser: mode === 'html' ? 'html' : 'babel', plugins, tabWidth: 2, useTabs: false })
}
