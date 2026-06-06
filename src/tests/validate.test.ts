import { describe, it, expect } from 'vitest'
import { validateFileChanges } from '@/backend/lib/validate'

describe('validateFileChanges', () => {
  it('allows valid files', () => {
    expect(() =>
      validateFileChanges([{ path: 'src/index.ts', content: '', action: 'update' }])
    ).not.toThrow()
  })

  it('blocks .env files', () => {
    expect(() =>
      validateFileChanges([{ path: '.env', content: '', action: 'create' }])
    ).toThrow('blocked path')
  })

  it('blocks node_modules', () => {
    expect(() =>
      validateFileChanges([{ path: 'node_modules/foo/index.js', content: '', action: 'update' }])
    ).toThrow('blocked path')
  })

  it('blocks path traversal', () => {
    expect(() =>
      validateFileChanges([{ path: '../../etc/passwd', content: '', action: 'update' }])
    ).toThrow('Path traversal')
  })

  it('blocks package-lock.json', () => {
    expect(() =>
      validateFileChanges([{ path: 'package-lock.json', content: '', action: 'update' }])
    ).toThrow('blocked path')
  })
})
