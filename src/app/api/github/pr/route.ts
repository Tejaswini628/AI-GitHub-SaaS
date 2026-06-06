import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { parseRepoFullName, createPullRequest } from '@/backend/lib/github'

export async function POST(request: Request) {
  try {
    const { accessToken } = await getAuthenticatedUser()
    const { fullName, title, body, head, base } = await request.json()

    if (!fullName || !title || !head || !base) {
      return NextResponse.json(
        { error: 'fullName, title, head, and base are required' },
        { status: 400 }
      )
    }

    const { owner, repo } = parseRepoFullName(fullName)

    const { prNumber, prUrl } = await createPullRequest(
      accessToken,
      owner,
      repo,
      title,
      body || title,
      head,
      base
    )

    return NextResponse.json({ prNumber, prUrl })
  } catch (error) {
    return handleApiError(error)
  }
}
