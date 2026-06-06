import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { getUserRepos } from '@/backend/lib/github'

export async function GET() {
  try {
    let accessToken = process.env.GITHUB_TOKEN || ''
    let user: any = null
    let supabase: any = null

    try {
      const auth = await getAuthenticatedUser()
      accessToken = auth.accessToken
      user = auth.user
      supabase = auth.supabase
    } catch {
      if (!accessToken) {
        return NextResponse.json(
          {
            error:
              'GitHub is not connected. Enable the GitHub provider in Supabase Auth or set GITHUB_TOKEN in .env for local development.',
          },
          { status: 401 }
        )
      }
    }

    const repos = await getUserRepos(accessToken)

    if (user && supabase) {
      for (const repo of repos) {
        const { data: existing } = await supabase
          .from('repositories')
          .select('id')
          .eq('full_name', repo.fullName)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('repositories')
            .update({
              name: repo.name,
              owner: repo.owner,
              url: repo.url,
              description: repo.description,
              language: repo.language,
              private: repo.private,
              default_branch: repo.defaultBranch,
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('repositories')
            .insert({
              github_id: repo.id,
              name: repo.name,
              full_name: repo.fullName,
              owner: repo.owner,
              url: repo.url,
              description: repo.description,
              language: repo.language,
              private: repo.private,
              default_branch: repo.defaultBranch,
              user_id: user.id,
            })
        }
      }
    }

    return NextResponse.json({ repos })
  } catch (error) {
    return handleApiError(error)
  }
}
