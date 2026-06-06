'use client'

import { useSupabase } from './Providers'
import Link from 'next/link'

export function Navbar() {
  const { user, supabase } = useSupabase()

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 shadow-sm shadow-slate-950/20">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <span className="text-lg font-bold text-slate-950">GitHub Dev</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                History
              </Link>
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || ''}
                    className="h-8 w-8 rounded-full ring-2 ring-white"
                  />
                )}
                <div className="hidden text-sm sm:block">
                  <p className="max-w-40 truncate font-medium text-slate-900">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
