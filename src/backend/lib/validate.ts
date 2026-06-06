import { FileChange } from '@/frontend/types'

export function validateFileChanges(files: FileChange[]): void {
  const blockedPaths = [
    '.env',
    '.env.local',
    '.env.production',
    '.gitignore',
    'node_modules',
    'package-lock.json',
    'yarn.lock',
    '.git',
  ]

  for (const file of files) {
    const normalizedPath = file.path.replace(/\\/g, '/')
    for (const blocked of blockedPaths) {
      if (
        normalizedPath === blocked ||
        normalizedPath.startsWith(`${blocked}/`) ||
        normalizedPath.includes(`/${blocked}/`)
      ) {
        throw new Error(`Security: Cannot modify blocked path: ${file.path}`)
      }
    }
    if (normalizedPath.includes('..')) {
      throw new Error(`Security: Path traversal detected: ${file.path}`)
    }
  }
}
