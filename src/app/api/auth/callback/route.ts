import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { encryptToken } from '@/backend/lib/encryption'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore */ }
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const githubAccessToken = session.provider_token

      if (githubAccessToken) {
        const encrypted = encryptToken(githubAccessToken)

        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('users')
            .update({ access_token: encrypted })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('users')
            .insert({
              auth_id: session.user.id,
              access_token: encrypted,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
              github_username: session.user.user_metadata?.user_name,
              avatar_url: session.user.user_metadata?.avatar_url,
            })
        }
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
