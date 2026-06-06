'use client'

import { useState, useEffect } from 'react'

interface Commit {
  id: string
  message: string
  sha: string
  url: string
  filesCount: number
  createdAt: string
  task: {
    prompt: string
    branchName: string
    prUrl: string | null
    prNumber: number | null
    status: string
  }
}

interface Props {
  repoId: string
  refreshKey: number
}

export function CommitHistory({ repoId, refreshKey }: Props) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommits()
  }, [repoId, refreshKey])

  async function fetchCommits() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks?repoId=${repoId}`)
      if (!res.ok) throw new Error('Failed to fetch commits')
      const data = await res.json()
      setCommits(data.tasks?.flatMap((t: any) =>
        t.commits?.map((c: any) => ({
          ...c,
          task: {
            prompt: t.prompt,
            branchName: t.branchName,
            prUrl: t.prUrl,
            prNumber: t.prNumber,
            status: t.status,
          },
        })) || []
      ) || [])
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">Recent Activity</h2>
          <p className="mt-1 text-xs text-slate-500">Generated commits and pull requests</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : commits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">No commits yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Commits will appear here after the AI pushes changes
          </p>
        </div>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {commits.map((commit) => (
            <div
              key={commit.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <svg
                  className="h-4 w-4 text-primary-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {commit.task.prompt}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-primary-700 hover:text-primary-800"
                  >
                    {commit.sha.slice(0, 7)}
                  </a>
                  <span>{commit.filesCount} file{commit.filesCount !== 1 ? 's' : ''}</span>
                  <span>{new Date(commit.createdAt).toLocaleDateString()}</span>
                </div>
                {commit.task.branchName && (
                  <span className="mt-2 inline-block rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    {commit.task.branchName}
                  </span>
                )}
                {commit.task.prUrl && (
                  <a
                    href={commit.task.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 mt-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-200"
                  >
                    PR #{commit.task.prNumber}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
