'use client'

import { useSupabase } from '@/frontend/components/Providers'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Navbar } from '@/frontend/components/Navbar'
import { RepoSelector } from '@/frontend/components/RepoSelector'
import { ChatInterface } from '@/frontend/components/ChatInterface'
import { CommitHistory } from '@/frontend/components/CommitHistory'
import { Skeleton, RepoSkeleton, CommitSkeleton } from '@/frontend/components/Skeleton'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageContent />
    </Suspense>
  )
}

function DashboardLoading() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RepoSkeleton />
          </div>
          <div className="lg:col-span-2">
            <CommitSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardPageContent() {
  const { user, loading: authLoading } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const previewMode = searchParams.get('preview') === '1'
  const localMode = searchParams.get('local') === '1'
  const [selectedRepo, setSelectedRepo] = useState<{
    id: string
    fullName: string
    defaultBranch: string
  } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!authLoading && !user && !previewMode && !localMode) {
      router.push('/')
    }
  }, [user, authLoading, previewMode, localMode, router])

  if (authLoading) {
    return <DashboardLoading />
  }

  if (!user && !previewMode && !localMode) return null

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Select a repository, describe the change, review generated files,
              and push a branch or pull request from one focused workspace.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
            Signed in as{' '}
            <span className="font-semibold text-slate-900">
              {user?.user_metadata?.full_name || user?.email || (localMode ? 'Local GitHub token' : 'Preview mode')}
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RepoSelector
              onSelect={(repo) => setSelectedRepo(repo)}
              selectedRepo={selectedRepo}
              previewMode={previewMode}
            />
          </div>

          <div className="space-y-6 lg:col-span-2">
            {selectedRepo ? (
              <>
                <ChatInterface
                  repo={selectedRepo}
                  onTaskComplete={() => setRefreshKey((k) => k + 1)}
                />
                {!localMode && (
                  <CommitHistory
                    repoId={selectedRepo.id}
                    refreshKey={refreshKey}
                  />
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="icon-tile mb-4 h-12 w-12">R</div>
                <h3 className="mb-2 text-lg font-semibold text-slate-950">
                  Select a Repository
                </h3>
                <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">
                  Choose a GitHub repository from the sidebar to get started.
                  The AI will analyze your codebase and help you ship features.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
