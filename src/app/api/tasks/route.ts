import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    const { searchParams } = new URL(request.url)
    const repoId = searchParams.get('repoId')

    let query = supabase
      .from('tasks')
      .select(`
        *,
        repo:repositories!inner(name, full_name, url),
        commits:commit_logs(id, message, sha, url, files_count, created_at)
      `)
      .eq('user_id', user.id)

    if (repoId) {
      query = query.eq('repo_id', repoId)
    }

    const { data: tasks, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ tasks: tasks || [] })
  } catch (error) {
    return handleApiError(error)
  }
}
