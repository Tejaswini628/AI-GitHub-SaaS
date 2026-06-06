import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { parseRepoFullName, createBranch, commitFiles, createPullRequest } from '@/backend/lib/github'
import { AIResponse } from '@/frontend/types'

export async function POST(request: Request) {
  try {
    const { repoId, fullName, aiResponse, createPR, defaultBranch: requestedDefaultBranch } = await request.json()

    if (!fullName || !aiResponse) {
      return NextResponse.json({ error: 'fullName and aiResponse are required' }, { status: 400 })
    }

    let authContext: Awaited<ReturnType<typeof getAuthenticatedUser>> | null = null
    let accessToken = process.env.GITHUB_TOKEN || ''

    try {
      authContext = await getAuthenticatedUser()
      accessToken = authContext.accessToken
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

    const parsed: AIResponse = aiResponse
    const { owner, repo } = parseRepoFullName(fullName)

    let defaultBranch = requestedDefaultBranch || 'main'
    if (repoId && authContext) {
      const { data: dbRepo } = await authContext.supabase
        .from('repositories')
        .select('default_branch')
        .eq('id', repoId)
        .single()
      if (dbRepo) defaultBranch = dbRepo.default_branch
    }

    let task: { id: string } | null = null

    if (authContext) {
      const { data: createdTask, error: taskError } = await authContext.supabase
        .from('tasks')
        .insert({
          prompt: parsed.explanation,
          status: 'in_progress',
          branch_name: parsed.branchName,
          commit_message: parsed.commitMessage,
          files_changed: parsed.files.length,
          result: parsed.explanation,
          user_id: authContext.user.id,
          repo_id: repoId,
        })
        .select()
        .single()

      if (taskError || !createdTask) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
      }
      task = createdTask
    }

    try {
      await createBranch(accessToken, owner, repo, parsed.branchName, defaultBranch)

      const { commitSha, commitUrl } = await commitFiles(
        accessToken,
        owner,
        repo,
        parsed.branchName,
        parsed.files,
        parsed.commitMessage
      )

      if (authContext && task) {
        await authContext.supabase.from('commit_logs').insert({
          message: parsed.commitMessage,
          sha: commitSha,
          url: commitUrl,
          files_count: parsed.files.length,
          task_id: task.id,
        })
      }

      let prNumber: number | null = null
      let prUrl: string | null = null

      if (createPR) {
        const prResult = await createPullRequest(
          accessToken,
          owner,
          repo,
          parsed.commitMessage,
          parsed.explanation,
          parsed.branchName,
          defaultBranch
        )
        prNumber = prResult.prNumber
        prUrl = prResult.prUrl
      }

      if (authContext && task) {
        await authContext.supabase
          .from('tasks')
          .update({ status: 'completed', pr_number: prNumber, pr_url: prUrl })
          .eq('id', task.id)
      }

      return NextResponse.json({
        success: true,
        taskId: task?.id,
        commitSha,
        commitUrl,
        branchName: parsed.branchName,
        prNumber,
        prUrl,
        filesChanged: parsed.files.length,
      })
    } catch (error) {
      if (authContext && task) {
        await authContext.supabase
          .from('tasks')
          .update({ status: 'failed' })
          .eq('id', task.id)
      }
      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
