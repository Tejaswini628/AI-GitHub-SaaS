import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef'
})

describe('encryption', () => {
  it('encrypts and decrypts a token', async () => {
    const { encryptToken, decryptToken } = await import('@/backend/lib/encryption')
    const token = 'github_pat_test_token_123'
    const encrypted = encryptToken(token)
    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(token)
    const decrypted = decryptToken(encrypted)
    expect(decrypted).toBe(token)
  })

  it('produces different ciphertexts each time', async () => {
    const { encryptToken } = await import('@/backend/lib/encryption')
    const token = 'same_token'
    const a = encryptToken(token)
    const b = encryptToken(token)
    expect(a).not.toBe(b)
  })

  it('returns empty string on invalid ciphertext', async () => {
    const { decryptToken } = await import('@/backend/lib/encryption')
    const result = decryptToken('invalid-base64!!')
    expect(result).toBe('')
  })
})
