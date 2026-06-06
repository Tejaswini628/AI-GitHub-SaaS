'use client'

import { useSupabase } from '@/frontend/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/frontend/components/Navbar'
import { Skeleton, CardSkeleton } from '@/frontend/components/Skeleton'

interface TaskItem {
  id: string
  prompt: string
  status: string
  branch_name: string | null
  commit_message: string | null
  pr_url: string | null
  pr_number: number | null
  files_changed: number
  created_at: string
  repo: {
    name: string
    full_name: string
    url: string
  }
  commits: {
    id: string
    message: string
    sha: string
    url: string
    files_count: number
    created_at: string
  }[]
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useSupabase()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTasks(data.tasks)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            Audit trail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Task History
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            All AI-generated changes, commits, and pull requests across your repositories.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="icon-tile mb-4 h-12 w-12">H</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-950">No tasks yet</h3>
            <p className="text-sm text-slate-600">
              Start by selecting a repository and asking the AI to make changes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="card">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-950">
                      {task.prompt}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {task.repo?.full_name || ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ${
                      task.status === 'completed'
                        ? 'badge-success'
                        : task.status === 'failed'
                        ? 'badge-error'
                        : 'badge-warning'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{new Date(task.created_at).toLocaleString()}</span>
                  <span>
                    {task.files_changed} file{task.files_changed !== 1 ? 's' : ''}
                  </span>
                  {task.branch_name && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                      {task.branch_name}
                    </span>
                  )}
                  {task.pr_url && (
                    <a
                      href={task.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary-700 hover:text-primary-800"
                    >
                      PR #{task.pr_number}
                    </a>
                  )}
                </div>

                {task.commits && task.commits.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Commits
                    </p>
                    <div className="space-y-1">
                      {task.commits.map((commit) => (
                        <a
                          key={commit.id}
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary-700"
                        >
                          <span className="font-mono font-semibold text-primary-700">
                            {commit.sha.slice(0, 7)}
                          </span>
                          <span className="truncate">{commit.message}</span>
                          <span className="shrink-0 text-slate-400">
                            {commit.files_count} files
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
