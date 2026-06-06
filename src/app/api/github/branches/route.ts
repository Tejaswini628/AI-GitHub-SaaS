import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { parseRepoFullName, createBranch } from '@/backend/lib/github'

export async function POST(request: Request) {
  try {
    const { accessToken } = await getAuthenticatedUser()
    const { fullName, branchName, baseBranch } = await request.json()

    if (!fullName || !branchName || !baseBranch) {
      return NextResponse.json(
        { error: 'fullName, branchName, and baseBranch are required' },
        { status: 400 }
      )
    }

    const { owner, repo } = parseRepoFullName(fullName)

    await createBranch(accessToken, owner, repo, branchName, baseBranch)

    return NextResponse.json({ success: true, branchName })
  } catch (error) {
    return handleApiError(error)
  }
}
