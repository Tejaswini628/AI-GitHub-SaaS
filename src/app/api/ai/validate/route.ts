import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { validateChanges } from '@/backend/lib/ai'

export async function POST(request: Request) {
  try {
    await getAuthenticatedUser()
    const { prompt, aiResponse } = await request.json()

    if (!prompt || !aiResponse) {
      return NextResponse.json(
        { error: 'prompt and aiResponse are required' },
        { status: 400 }
      )
    }

    const result = await validateChanges(prompt, aiResponse)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
