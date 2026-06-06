'use client'

import { useSupabase } from '@/frontend/components/Providers'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

export default function LandingPage() {
  return (
    <Suspense fallback={<LandingLoading />}>
      <LandingPageContent />
    </Suspense>
  )
}

function LandingLoading() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
    </div>
  )
}

function LandingPageContent() {
  const { user, loading, supabase } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const featuresRef = useRef<HTMLDivElement>(null)
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [hasServerToken, setHasServerToken] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    fetch('/api/github/status')
      .then((res) => res.json())
      .then((data) => setHasServerToken(Boolean(data.hasServerToken)))
      .catch(() => setHasServerToken(false))
  }, [])

  const handleSignIn = async () => {
    setSigningIn(true)
    setAuthError('')

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo user:email',
          redirectTo: `${window.location.origin}/api/auth/callback`,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error
      if (!data?.url) throw new Error('Failed to create sign-in URL')

      window.location.assign(data.url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      console.error('Sign in error:', err)
      setAuthError(message)
      setSigningIn(false)
    }
  }

  const callbackError = searchParams.get('error')

  if (loading) {
    return <LandingLoading />
  }

  return (
    <div className="page-shell min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white shadow-sm shadow-slate-950/20">
            AI
          </div>
          <span className="text-lg font-bold text-slate-950">GitHub Dev</span>
        </div>
        <button onClick={handleSignIn} disabled={signingIn} className="btn-secondary text-sm">
          {signingIn ? 'Redirecting to GitHub...' : 'Sign in with GitHub'}
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-sm font-semibold text-primary-800 shadow-sm">
              AI-powered repository automation
            </div>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
              Ship GitHub changes from a focused AI workspace
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              Connect a repository, describe the work, review generated files,
              then commit or open a pull request without leaving the app.
            </p>
            {(authError || callbackError) && (
              <div className="mt-6 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">GitHub sign-in is not enabled yet.</p>
                <p className="mt-1">
                  Supabase returned <code className="rounded bg-amber-100 px-1">{authError || callbackError}</code>.
                  To enable GitHub sign-in: go to your{' '}
                  <a href="https://supabase.com/dashboard/project/nfatqhigayuemqerkjkl/auth/providers"
                     target="_blank" rel="noopener noreferrer"
                     className="font-semibold underline hover:text-amber-800">
                    Supabase Auth providers
                  </a>, enable GitHub, and add your GitHub OAuth App credentials.
                </p>
              </div>
            )}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleSignIn} disabled={signingIn} className="btn-primary px-8 py-4 text-base">
                {signingIn ? 'Redirecting...' : 'Get started'}
              </button>
              <button
                onClick={() => router.push('/dashboard?preview=1')}
                className="btn-secondary px-8 py-4 text-base"
              >
                Preview AI workspace
              </button>
              {hasServerToken && (
                <button
                  onClick={() => router.push('/dashboard?local=1')}
                  className="btn-secondary px-8 py-4 text-base"
                >
                  Use local token
                </button>
              )}
              <a href="#workflow" className="btn-secondary px-8 py-4 text-base">
                View workflow
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-xl shadow-slate-950/10">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-slate-100">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-sm font-semibold">AI workspace</p>
                  <p className="text-xs text-slate-400">acme/web-app on main</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  PR ready
                </span>
              </div>
              <div className="space-y-3">
                <div className="max-w-[82%] rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  Add a billing settings page with tests.
                </div>
                <div className="ml-auto max-w-[82%] rounded-lg bg-primary-500 p-3 text-sm text-white">
                  Generated 4 file changes and prepared branch ai/billing-settings.
                </div>
                {[
                  ['create', 'src/app/settings/billing/page.tsx'],
                  ['update', 'src/frontend/components/Navbar.tsx'],
                  ['create', 'src/tests/billing-settings.test.tsx'],
                ].map(([action, path]) => (
                  <div key={path} className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-xs">
                    <span className="rounded bg-white/10 px-2 py-1 font-semibold uppercase text-slate-200">
                      {action}
                    </span>
                    <code className="truncate text-slate-300">{path}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" ref={featuresRef} className="grid scroll-mt-8 gap-4 pb-12 md:grid-cols-3">
          {[
            {
              title: 'Repo-aware planning',
              desc: 'Analyzes structure, branches, and conventions before proposing changes.',
            },
            {
              title: 'Reviewable file diffs',
              desc: 'Shows generated files in a compact review flow before anything is pushed.',
            },
            {
              title: 'GitHub delivery',
              desc: 'Creates branches, commits, and pull requests from the same workflow.',
            },
          ].map((feature) => (
            <div key={feature.title} className="card">
              <div className="icon-tile mb-4">{feature.title.charAt(0)}</div>
              <h3 className="text-base font-semibold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
