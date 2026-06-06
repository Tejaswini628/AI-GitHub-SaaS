import CryptoJS from 'crypto-js'

const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is required')
  return key
}

export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, getEncryptionKey()).toString()
}

export function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, getEncryptionKey())
  return bytes.toString(CryptoJS.enc.Utf8)
}
