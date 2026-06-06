import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from './auth'

export { getAuthenticatedUser }

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
