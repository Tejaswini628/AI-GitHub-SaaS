import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { getRepoContent } from '@/backend/lib/github'

export async function GET(request: Request) {
  try {
    const { accessToken, supabase } = await getAuthenticatedUser()
    const { searchParams } = new URL(request.url)
    const repoId = searchParams.get('repoId')
    const branch = searchParams.get('branch') || undefined

    if (!repoId) {
      return NextResponse.json({ error: 'repoId is required' }, { status: 400 })
    }

    const { data: dbRepo, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .single()

    if (repoError || !dbRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(10)

    const structure = await getRepoContent(accessToken, dbRepo.owner, dbRepo.name, '', branch)

    return NextResponse.json({ repo: { ...dbRepo, tasks }, structure })
  } catch (error) {
    return handleApiError(error)
  }
}
