import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { getRepoContent, getFileContent, parseRepoFullName } from '@/backend/lib/github'

export async function POST(request: Request) {
  try {
    const { accessToken } = await getAuthenticatedUser()
    const { fullName, branch, includeContent, paths } = await request.json()

    if (!fullName) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 })
    }

    const { owner, repo } = parseRepoFullName(fullName)

    const structure = await getRepoContent(accessToken, owner, repo, '', branch)

    let fileContents: Record<string, string> = {}
    if (includeContent && paths && Array.isArray(paths)) {
      for (const filePath of paths) {
        const content = await getFileContent(accessToken, owner, repo, filePath, branch)
        if (content !== null) {
          fileContents[filePath] = content
        }
      }
    }

    return NextResponse.json({ structure, fileContents })
  } catch (error) {
    return handleApiError(error)
  }
}
