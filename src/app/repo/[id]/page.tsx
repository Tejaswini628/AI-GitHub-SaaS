'use client'

import { useSupabase } from '@/frontend/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/frontend/components/Navbar'
import { ChatInterface } from '@/frontend/components/ChatInterface'
import { CommitHistory } from '@/frontend/components/CommitHistory'

export default function RepoPage() {
  const { user, loading: authLoading } = useSupabase()
  const router = useRouter()
  const params = useParams()
  const [repo, setRepo] = useState<{
    id: string
    fullName: string
    defaultBranch: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (params.id && user) {
      fetchRepo()
    }
  }, [params.id, user])

  async function fetchRepo() {
    setLoading(true)
    try {
      const res = await fetch(`/api/github/repo?repoId=${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch repo')
      const data = await res.json()
      setRepo({
        id: data.repo.id,
        fullName: data.repo.full_name,
        defaultBranch: data.repo.default_branch,
      })
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user || !repo) return null

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            Repository
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {repo.fullName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Default branch:{' '}
            <span className="font-mono font-semibold text-slate-900">
              {repo.defaultBranch}
            </span>
          </p>
        </div>

        <ChatInterface
          repo={repo}
          onTaskComplete={() => setRefreshKey((k) => k + 1)}
        />
        <CommitHistory repoId={repo.id} refreshKey={refreshKey} />
      </main>
    </div>
  )
}
