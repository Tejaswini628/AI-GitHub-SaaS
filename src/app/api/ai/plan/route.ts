import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { getRepoStructureContext, parseRepoFullName } from '@/backend/lib/github'
import { planChanges } from '@/backend/lib/ai'

export async function POST(request: Request) {
  try {
    const { accessToken } = await getAuthenticatedUser()
    const { fullName, prompt, branch } = await request.json()

    if (!fullName || !prompt) {
      return NextResponse.json(
        { error: 'fullName and prompt are required' },
        { status: 400 }
      )
    }

    const { owner, repo } = parseRepoFullName(fullName)

    const structureText = await getRepoStructureContext(accessToken, owner, repo, branch)

    const plan = await planChanges(structureText, '', prompt)

    return NextResponse.json(plan)
  } catch (error) {
    return handleApiError(error)
  }
}
