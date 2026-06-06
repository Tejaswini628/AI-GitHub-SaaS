import { describe, it, expect } from 'vitest'
import { highlightCode } from '@/frontend/lib/syntax-highlight'

describe('highlightCode', () => {
  it('highlights keywords', () => {
    const result = highlightCode('const x = 1')
    expect(result).toContain('hl-keyword')
    expect(result).toContain('const')
  })

  it('highlights strings', () => {
    const result = highlightCode('const s = "hello"')
    expect(result).toContain('hl-string')
    expect(result).toContain('hello')
  })

  it('highlights numbers', () => {
    const result = highlightCode('const n = 42')
    expect(result).toContain('hl-number')
    expect(result).toContain('42')
  })

  it('highlights comments', () => {
    const result = highlightCode('// this is a comment')
    expect(result).toContain('hl-comment')
    expect(result).toContain('this is a comment')
  })

  it('escapes HTML', () => {
    const result = highlightCode('<script>')
    expect(result).toContain('&lt;')
    expect(result).toContain('script')
    expect(result).toContain('&gt;')
  })

  it('handles empty string', () => {
    expect(highlightCode('')).toBe('')
  })
})
