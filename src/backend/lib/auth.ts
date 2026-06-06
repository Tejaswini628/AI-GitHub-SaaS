import { createSupabaseServerClient } from './supabase-server'
import { encryptToken, decryptToken } from './encryption'

export async function getServerSession() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signOutUser() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    throw new Error('Unauthorized')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', session.user.id)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  const accessToken = decryptToken(user.access_token)

  return {
    user,
    accessToken,
    session,
    supabase,
  }
}

export async function updateUserAccessToken(userId: string, token: string) {
  const supabase = await createSupabaseServerClient()
  const encrypted = encryptToken(token)
  await supabase
    .from('users')
    .update({ access_token: encrypted })
    .eq('id', userId)
}
