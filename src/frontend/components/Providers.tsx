'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useEffect, useState } from 'react'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  loading: boolean
}

const Context = createContext<SupabaseContext>({
  supabase: createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ),
  user: null,
  session: null,
  loading: true,
})

export const useSupabase = () => useContext(Context)

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <Context.Provider value={{ supabase, user, session, loading }}>
      {children}
    </Context.Provider>
  )
}
