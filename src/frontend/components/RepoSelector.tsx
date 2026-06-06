'use client'

import { useState, useEffect } from 'react'

interface Repo {
  id: string
  name: string
  fullName: string
  owner: string
  url: string
  description: string | null
  language: string | null
  private: boolean
  defaultBranch: string
}

interface Props {
  onSelect: (repo: { id: string; fullName: string; defaultBranch: string }) => void
  selectedRepo: { id: string; fullName: string; defaultBranch: string } | null
  previewMode?: boolean
}

export function RepoSelector({ onSelect, selectedRepo, previewMode = false }: Props) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(!previewMode)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [manualFullName, setManualFullName] = useState('')
  const [manualBranch, setManualBranch] = useState('main')

  useEffect(() => {
    if (previewMode) return
    fetchRepos()
  }, [previewMode])

  async function fetchRepos() {
    setLoading(true)
      setError('')
    try {
      const res = await fetch('/api/github/repos')
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch repositories')
      }
      const data = await res.json()
      setRepos(data.repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">Repositories</h2>
          <p className="mt-1 text-xs text-slate-500">GitHub repositories you can work on</p>
        </div>
        <button
          onClick={fetchRepos}
          disabled={loading}
          className="rounded-md px-2 py-1 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50"
        >
          {loading ? 'Loading' : 'Refresh'}
        </button>
      </div>

      <input
        type="text"
        placeholder="Search repositories"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field mb-4 text-sm"
      />

      {(previewMode || error) && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">
            {previewMode ? 'Preview a repository' : 'Connect manually'}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Enter a repo as owner/name. The AI chat will open immediately. Real GitHub
            reads and commits need GitHub OAuth enabled or a server GITHUB_TOKEN.
          </p>
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="owner/repository"
              value={manualFullName}
              onChange={(e) => setManualFullName(e.target.value)}
              className="input-field text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="main"
                value={manualBranch}
                onChange={(e) => setManualBranch(e.target.value)}
                className="input-field text-sm"
              />
              <button
                onClick={() => {
                  const fullName = manualFullName.trim()
                  if (!fullName.includes('/')) return
                  onSelect({
                    id: `manual-${fullName}`,
                    fullName,
                    defaultBranch: manualBranch.trim() || 'main',
                  })
                }}
                disabled={!manualFullName.trim().includes('/')}
                className="btn-primary shrink-0 text-sm"
              >
                Open chat
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              {search ? 'No matching repositories' : 'No repositories found'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Try refreshing your GitHub connection.</p>
          </div>
        ) : (
          filtered.map((repo) => (
            <button
              key={repo.id}
              onClick={() =>
                onSelect({
                  id: repo.id,
                  fullName: repo.fullName,
                  defaultBranch: repo.defaultBranch,
                })
              }
              className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                selectedRepo?.id === repo.id
                  ? 'border-primary-200 bg-primary-50 shadow-sm shadow-primary-950/5'
                  : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="icon-tile h-8 w-8 text-xs">
                  {repo.private ? 'PR' : 'PB'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-950">
                    {repo.fullName}
                  </p>
                  {repo.description && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {repo.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {repo.language && (
                      <span className="badge-info text-[10px]">{repo.language}</span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                      {repo.defaultBranch}
                    </span>
                    {repo.private && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
